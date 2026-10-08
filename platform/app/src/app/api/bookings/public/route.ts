import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { stripe } from "@/lib/stripe"
import { sendEmail, adminInbox } from "@/lib/email"
import { bookingInquiry, availabilityRequest } from "@/lib/email-templates"

type PublicBookingPayload = {
  // Legacy inquiry contract (used by MatchedView.tsx) — unchanged
  user_id?: string
  program_id?: string
  arrival?: string
  departure?: string
  pax?: number
  // Deposit-checkout contract (used by ReserveModal.tsx)
  variant_id?: string
  guest_name?: string
  guest_email?: string
  guest_whatsapp?: string
  ga_client_id?: string
  session_id?: string
  property_id?: string
  property_name?: string
  destination_country?: string
  market_country?: string
  traffic_channel?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  // Availability/pricing-request fallback contract (ReserveModal.tsx, no
  // priced variant available — variant_id absent, guest_name present)
  source_page?: string
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status, headers: cors })
}

function formatTHB(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n))
}

function formatDateLong(iso: string): string {
  const d = new Date(iso + "T00:00:00Z")
  return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
}

// Fire-and-forget analytics_events insert — mirrors the shape/convention the
// Stripe webhook's logAnalyticsPurchaseEvent already uses, so all funnel
// stages land in the same queryable table. Never blocks or fails the request.
function logFunnelEvent(fields: Record<string, unknown>) {
  void supabaseAdmin
    .from("analytics_events")
    .insert(fields)
    .then(({ error }) => {
      if (error) console.error(`[analytics_events] ${fields.event_name} insert failed:`, error)
    })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: cors })
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export async function POST(req: Request) {
  let body: PublicBookingPayload
  try {
    body = (await req.json()) as PublicBookingPayload
  } catch {
    return bad("invalid JSON body")
  }

  // New deposit-checkout flow (ReserveModal.tsx sends variant_id) — takes priority.
  if (body.variant_id) {
    return handleDepositCheckout(req, body)
  }

  // Availability/pricing-request fallback (ReserveModal.tsx, program has no
  // priced variant — sends guest_name but no variant_id). Must be checked
  // before the legacy inquiry branch below, which requires user_id instead.
  if (!body.user_id && body.guest_name) {
    return handleAvailabilityRequest(req, body)
  }

  // Legacy inquiry flow (MatchedView.tsx sends user_id + departure, no variant_id) — unchanged.
  const userId = (body.user_id ?? "").trim()
  const programId = (body.program_id ?? "").trim()
  const arrival = (body.arrival ?? "").trim()
  const departure = (body.departure ?? "").trim()
  const pax = Number(body.pax ?? 1)

  if (!userId) return bad("user_id required")
  if (!programId) return bad("program_id required")
  if (!ISO_DATE.test(arrival)) return bad("arrival must be YYYY-MM-DD")
  if (!ISO_DATE.test(departure)) return bad("departure must be YYYY-MM-DD")
  if (departure <= arrival) return bad("departure must be after arrival")
  if (!Number.isInteger(pax) || pax < 1 || pax > 20) return bad("pax must be 1–20")

  // Confirm user + program exist, get max_guests for upper bound
  const [{ data: user }, { data: program }] = await Promise.all([
    supabaseAdmin.from("users").select("id").eq("id", userId).maybeSingle(),
    supabaseAdmin
      .from("programs")
      .select("id, max_guests, active")
      .eq("id", programId)
      .maybeSingle(),
  ])
  if (!user) return bad("unknown user_id", 404)
  if (!program || !program.active) return bad("unknown or inactive program_id", 404)
  if (program.max_guests && pax > program.max_guests) {
    return bad(`pax exceeds program max_guests (${program.max_guests})`)
  }

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .insert({
      user_id: userId,
      program_id: programId,
      arrival,
      departure,
      pax,
      status: "inquiry",
    })
    .select("id, status, arrival, departure, pax")
    .single()

  if (error) return bad(error.message)

  // Fire notification to admin + (if any) partners of properties linked to this program.
  // No await — never block the response.
  void notifyInquiry({ req, userId, programId, bookingId: data.id, arrival, departure, pax })

  return NextResponse.json({ success: true, booking: data }, { headers: cors })
}

async function handleDepositCheckout(req: Request, body: PublicBookingPayload) {
  const programId = (body.program_id ?? "").trim()
  const variantId = (body.variant_id ?? "").trim()
  const arrival = (body.arrival ?? "").trim()
  const pax = Number(body.pax ?? 1)
  const guestName = (body.guest_name ?? "").trim()
  const guestEmail = (body.guest_email ?? "").trim() || null
  const guestWhatsapp = (body.guest_whatsapp ?? "").trim() || null

  if (!programId) return bad("program_id required")
  if (!variantId) return bad("variant_id required")
  if (!ISO_DATE.test(arrival)) return bad("arrival must be YYYY-MM-DD")
  if (!guestName) return bad("guest_name required")
  if (!guestEmail && !guestWhatsapp) return bad("guest_email or guest_whatsapp required")
  if (!Number.isInteger(pax) || pax < 1 || pax > 20) return bad("pax must be 1–20")

  const [{ data: variant }, { data: program }] = await Promise.all([
    supabaseAdmin
      .from("program_variants")
      .select("id, program_id, label, duration_nights, price_basic_thb, active")
      .eq("id", variantId)
      .maybeSingle(),
    supabaseAdmin
      .from("programs")
      .select(
        "id, slug, name, active, max_guests, hero_image_url, program_properties(properties(name, country, island))",
      )
      .eq("id", programId)
      .maybeSingle(),
  ])

  if (!program || !program.active) return bad("unknown or inactive program_id", 404)
  if (!variant || !variant.active || variant.price_basic_thb == null) {
    return bad("unknown or inactive variant_id", 404)
  }
  if (variant.program_id !== programId) return bad("variant_id does not belong to program_id")
  if (program.max_guests && pax > program.max_guests) {
    return bad(`pax exceeds program max_guests (${program.max_guests})`)
  }

  // Property/destination for the checkout line item — read server-side from
  // the program's linked property, never from client-supplied body fields,
  // so the checkout description can't drift from what's actually in the DB.
  type PP = { properties: { name: string; country: string | null; island: string | null } | null }
  const propertyLinks =
    ((program as unknown as { program_properties?: PP[] }).program_properties ?? []) as PP[]
  const checkoutProperty = propertyLinks.find((pp) => pp.properties)?.properties ?? null
  const checkoutPropertyName = checkoutProperty?.name ?? null
  const checkoutDestination = checkoutProperty
    ? [checkoutProperty.island, checkoutProperty.country].filter(Boolean).join(", ")
    : null

  const arrivalDate = new Date(arrival + "T00:00:00Z")
  arrivalDate.setUTCDate(arrivalDate.getUTCDate() + variant.duration_nights)
  const departure = arrivalDate.toISOString().slice(0, 10)

  const fullPrice = Number(variant.price_basic_thb)
  const depositPct = 20
  const depositAmount = Math.round(fullPrice * (depositPct / 100))
  const remainingBalance = fullPrice - depositAmount

  const { data: guestUser, error: guestErr } = await supabaseAdmin
    .from("users")
    .insert({
      name: guestName,
      email: guestEmail,
      whatsapp: guestWhatsapp,
      country: body.destination_country ?? null,
      source: "website_reserve_modal",
    })
    .select("id")
    .single()
  if (guestErr || !guestUser) return bad(guestErr?.message ?? "could not create guest record")

  const { data: booking, error: bookingErr } = await supabaseAdmin
    .from("bookings")
    .insert({
      user_id: guestUser.id,
      program_id: programId,
      variant_id: variantId,
      arrival,
      departure,
      pax,
      status: "inquiry",
      payment_status: "unpaid",
      currency: "THB",
      full_price: fullPrice,
      deposit_amount: depositAmount,
      deposit_pct: depositPct,
      remaining_balance: remainingBalance,
      price_version: "program_variants.price_basic_thb",
      price_valid_at: new Date().toISOString(),
      source: "website_reserve_modal",
    })
    .select("id")
    .single()
  if (bookingErr || !booking) return bad(bookingErr?.message ?? "could not create booking")

  const origin = new URL(req.url).origin
  const successUrl = `${origin}/programs/${program.slug}?booking=paid&session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${origin}/programs/${program.slug}?booking=cancelled`

  // Absolute URL required by Stripe's product_data.images — hero_image_url is
  // stored as a relative path, so resolve it against this request's origin.
  const heroImageUrl = program.hero_image_url
    ? program.hero_image_url.startsWith("http")
      ? program.hero_image_url
      : `${origin}${program.hero_image_url}`
    : null

  const guestCount = `${pax} guest${pax === 1 ? "" : "s"}`
  const locationLine = [checkoutPropertyName, checkoutDestination].filter(Boolean).join(", ")
  const description = [
    locationLine || null,
    `Arrival ${formatDateLong(arrival)}`,
    guestCount,
    `20% reservation deposit on THB ${formatTHB(fullPrice)}`,
    `Remaining balance THB ${formatTHB(remainingBalance)} due before arrival`,
  ]
    .filter(Boolean)
    .join(" · ")

  let session
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      client_reference_id: booking.id,
      customer_email: guestEmail ?? undefined,
      line_items: [
        {
          price_data: {
            currency: "thb",
            product_data: {
              name: `${program.name} — ${variant.label}`,
              description,
              images: heroImageUrl ? [heroImageUrl] : undefined,
            },
            unit_amount: Math.round(depositAmount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        booking_id: booking.id,
        program_id: programId,
        variant_id: variantId,
        variant_label: variant.label,
        program_name: program.name,
        property_id: body.property_id ?? "",
        property_name: body.property_name ?? "",
        destination_country: body.destination_country ?? "",
        market_country: body.market_country ?? "",
        traffic_channel: body.traffic_channel ?? "",
        utm_source: body.utm_source ?? "",
        utm_medium: body.utm_medium ?? "",
        utm_campaign: body.utm_campaign ?? "",
        ga_client_id: body.ga_client_id ?? "",
        session_id: body.session_id ?? "",
        user_id: guestUser.id,
      },
    })
  } catch (err) {
    console.error("[bookings/public] stripe session create failed:", err)
    return bad("could not start checkout", 502)
  }

  const { error: updateErr } = await supabaseAdmin
    .from("bookings")
    .update({ stripe_session_id: session.id })
    .eq("id", booking.id)
  if (updateErr) console.error("[bookings/public] failed to store stripe_session_id:", updateErr)

  // Funnel: Checkout created → Stripe opened → Deposit paid (the last step is
  // logged by the webhook's logAnalyticsPurchaseEvent). Same table/columns as
  // that "purchase" event, so both are queryable together by
  // program/property/country/channel.
  logFunnelEvent({
    event_name: "checkout_created",
    ga_client_id: body.ga_client_id || null,
    session_id: body.session_id || null,
    user_id: guestUser.id,
    booking_id: booking.id,
    market_country: body.market_country || null,
    destination_country: body.destination_country || null,
    property_id: body.property_id || null,
    program_id: programId,
    variant_id: variantId,
    value: depositAmount,
    currency: "THB",
    utm_source: body.utm_source || null,
    utm_medium: body.utm_medium || null,
    utm_campaign: body.utm_campaign || null,
    traffic_channel: body.traffic_channel || null,
  })

  void notifyInquiry({
    req,
    userId: guestUser.id,
    programId,
    bookingId: booking.id,
    arrival,
    departure,
    pax,
  })

  return NextResponse.json(
    { success: true, booking: { id: booking.id }, checkout_url: session.url },
    { headers: cors },
  )
}

// Fallback path for ReserveModal.tsx when the selected program has no active,
// priced variant. Durably stores the inquiry (never email-only) with full
// context in bookings.inquiry_context, and notifies the team — no Stripe.
async function handleAvailabilityRequest(req: Request, body: PublicBookingPayload) {
  const programId = (body.program_id ?? "").trim()
  const arrival = (body.arrival ?? "").trim()
  const pax = Number(body.pax ?? 1)
  const guestName = (body.guest_name ?? "").trim()
  const guestEmail = (body.guest_email ?? "").trim() || null
  const guestWhatsapp = (body.guest_whatsapp ?? "").trim() || null

  if (!programId) return bad("program_id required")
  if (!guestName) return bad("guest_name required")
  if (!guestEmail && !guestWhatsapp) return bad("guest_email or guest_whatsapp required")
  if (arrival && !ISO_DATE.test(arrival)) return bad("arrival must be YYYY-MM-DD")
  if (!Number.isInteger(pax) || pax < 1 || pax > 20) return bad("pax must be 1–20")

  const { data: program } = await supabaseAdmin
    .from("programs")
    .select("id, name, active")
    .eq("id", programId)
    .maybeSingle()
  if (!program || !program.active) return bad("unknown or inactive program_id", 404)

  const { data: guestUser, error: guestErr } = await supabaseAdmin
    .from("users")
    .insert({
      name: guestName,
      email: guestEmail,
      whatsapp: guestWhatsapp,
      country: body.destination_country ?? null,
      source: "website_reserve_modal_fallback",
    })
    .select("id")
    .single()
  if (guestErr || !guestUser) return bad(guestErr?.message ?? "could not create guest record")

  // Preserves everything Mark's spec requires: program/property identifiers,
  // guest contact, preferred arrival, guest count, source page, and a
  // program-name snapshot — kept even if the program is later renamed.
  const inquiryContext = {
    kind: "availability_request",
    program_id: programId,
    program_name: program.name,
    property_id: body.property_id ?? null,
    property_name: body.property_name ?? null,
    destination_country: body.destination_country ?? null,
    source_page: body.source_page ?? null,
    guest_contact: { email: guestEmail, whatsapp: guestWhatsapp },
    attribution: {
      market_country: body.market_country ?? null,
      traffic_channel: body.traffic_channel ?? null,
      utm_source: body.utm_source ?? null,
      utm_medium: body.utm_medium ?? null,
      utm_campaign: body.utm_campaign ?? null,
      ga_client_id: body.ga_client_id ?? null,
      session_id: body.session_id ?? null,
    },
  }

  const { data: booking, error: bookingErr } = await supabaseAdmin
    .from("bookings")
    .insert({
      user_id: guestUser.id,
      program_id: programId,
      arrival: arrival || null,
      pax,
      status: "inquiry",
      payment_status: "unpaid",
      source: "website_reserve_modal_fallback",
      inquiry_context: inquiryContext,
    })
    .select("id")
    .single()
  if (bookingErr || !booking) return bad(bookingErr?.message ?? "could not create booking")

  // Funnel (unpriced path): Pricing request opened → Inquiry submitted →
  // Quote delivered → Deposit paid. "Quote delivered" has no code trigger yet
  // — it's a human action from the admin panel once pricing is confirmed.
  logFunnelEvent({
    event_name: "inquiry_submitted",
    ga_client_id: body.ga_client_id || null,
    session_id: body.session_id || null,
    user_id: guestUser.id,
    booking_id: booking.id,
    market_country: body.market_country || null,
    destination_country: body.destination_country || null,
    property_id: body.property_id || null,
    program_id: programId,
    utm_source: body.utm_source || null,
    utm_medium: body.utm_medium || null,
    utm_campaign: body.utm_campaign || null,
    traffic_channel: body.traffic_channel || null,
  })

  void notifyAvailabilityRequest({
    req,
    guestName,
    guestContact: guestEmail ?? guestWhatsapp ?? "",
    programName: program.name,
    propertyId: body.property_id ?? null,
    propertyName: body.property_name ?? null,
    arrival: arrival || null,
    pax,
    sourcePage: body.source_page ?? null,
  })

  return NextResponse.json({ success: true, booking: { id: booking.id } }, { headers: cors })
}

async function notifyInquiry(args: {
  req: Request
  userId: string
  programId: string
  bookingId: string
  arrival: string
  departure: string
  pax: number
}) {
  try {
    const origin = new URL(args.req.url).origin
    const [{ data: guest }, { data: program }] = await Promise.all([
      supabaseAdmin.from("users").select("name, whatsapp").eq("id", args.userId).maybeSingle(),
      supabaseAdmin
        .from("programs")
        .select("name, program_properties(properties(id, name))")
        .eq("id", args.programId)
        .maybeSingle(),
    ])
    if (!guest || !program) return

    type PP = { properties: { id: string; name: string } | null }
    const propertyLinks =
      ((program as unknown as { program_properties?: PP[] }).program_properties ?? []) as PP[]
    const firstProperty = propertyLinks.find((pp) => pp.properties)?.properties ?? null
    const propertyIds = propertyLinks
      .map((pp) => pp.properties?.id)
      .filter((x): x is string => !!x)

    const partnerEmails = await partnerEmailsForProperties(propertyIds)
    const recipients = Array.from(new Set([...adminInbox(), ...partnerEmails]))
    if (recipients.length === 0) return

    const mail = bookingInquiry({
      guestName: guest.name,
      whatsapp: guest.whatsapp,
      programName: program.name,
      propertyName: firstProperty?.name ?? null,
      arrival: args.arrival,
      departure: args.departure,
      pax: args.pax,
      adminBookingUrl: `${origin}/admin/bookings`,
    })
    await sendEmail({ to: recipients, ...mail, tag: "booking_inquiry" })
  } catch (err) {
    console.error("[notifyInquiry] failed:", err)
  }
}

async function notifyAvailabilityRequest(args: {
  req: Request
  guestName: string
  guestContact: string
  programName: string
  propertyId: string | null
  propertyName: string | null
  arrival: string | null
  pax: number
  sourcePage: string | null
}) {
  try {
    const origin = new URL(args.req.url).origin
    const partnerEmails = args.propertyId ? await partnerEmailsForProperties([args.propertyId]) : []
    const recipients = Array.from(new Set([...adminInbox(), ...partnerEmails]))
    if (recipients.length === 0) return

    const mail = availabilityRequest({
      guestName: args.guestName,
      guestContact: args.guestContact,
      programName: args.programName,
      propertyName: args.propertyName,
      arrival: args.arrival,
      pax: args.pax,
      sourcePage: args.sourcePage,
      adminBookingUrl: `${origin}/admin/bookings`,
    })
    await sendEmail({ to: recipients, ...mail, tag: "availability_request" })
  } catch (err) {
    console.error("[notifyAvailabilityRequest] failed:", err)
  }
}

async function partnerEmailsForProperties(propertyIds: string[]): Promise<string[]> {
  if (propertyIds.length === 0) return []
  const { data: links } = await supabaseAdmin
    .from("partner_properties")
    .select("profile_id")
    .in("property_id", propertyIds)
  const linkedIds = Array.from(new Set((links ?? []).map((l) => l.profile_id as string)))
  const { data: partners } = linkedIds.length
    ? await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("role", "partner")
        .in("id", linkedIds)
    : { data: [] as Array<{ id: string }> }
  const ids = (partners ?? []).map((p) => p.id)
  if (ids.length === 0) return []
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 })
  return users.filter((u) => ids.includes(u.id) && u.email).map((u) => u.email as string)
}
