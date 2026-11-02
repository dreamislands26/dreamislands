import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { sendEmail, adminInbox } from "@/lib/email"
import { availabilityRequest } from "@/lib/email-templates"

// Clinique La Prairie Phuket enquiry ("Request programme & dates").
// Same durable pattern as the availability-request path in /api/bookings/public:
// a guest row in users + a bookings row with status "inquiry" and the full context
// (goal, time, matcher recommendation, attribution) in bookings.inquiry_context.
// The programme is optional: guests who are not sure yet still get stored.

const PROPERTY_SLUG = "clinique-la-prairie-phuket"

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 5
const hits = new Map<string, number[]>()
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const ts = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  ts.push(now)
  hits.set(ip, ts)
  return ts.length > RATE_LIMIT_MAX
}

const str = (v: unknown, max = 500): string | null => {
  if (typeof v !== "string") return null
  const t = v.trim().slice(0, max)
  return t || null
}

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status })
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim()
  if (isRateLimited(ip)) return bad("too many requests", 429)

  let b: Record<string, unknown>
  try {
    b = (await req.json()) as Record<string, unknown>
  } catch {
    return bad("invalid JSON body")
  }

  const name = str(b.name, 120)
  const contact = str(b.contact, 160)
  if (!name || !contact) return bad("name and contact required")
  if (b.consent !== true) return bad("consent required")
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)

  const { data: property } = await supabaseAdmin
    .from("properties")
    .select("id, name, country")
    .eq("slug", PROPERTY_SLUG)
    .maybeSingle()

  const programmeSlug = str(b.programme, 80)
  let program: { id: string; name: string } | null = null
  if (programmeSlug) {
    const { data } = await supabaseAdmin
      .from("programs")
      .select("id, name, active")
      .eq("slug", programmeSlug)
      .maybeSingle()
    if (data?.active) program = { id: data.id, name: data.name }
  }

  const { data: guest, error: guestErr } = await supabaseAdmin
    .from("users")
    .insert({
      name,
      email: isEmail ? contact : null,
      whatsapp: isEmail ? null : contact,
      country: str(b.country, 80),
      source: "website_clp_phuket",
    })
    .select("id")
    .single()
  if (guestErr || !guest) {
    console.error("[clp-lead] guest insert failed:", guestErr)
    return bad("could not store request", 500)
  }

  const inquiryContext = {
    kind: "clp_phuket_enquiry",
    goal: str(b.goal, 80),
    time_available: str(b.time, 40),
    preferred_dates: str(b.dates, 120),
    notes: str(b.notes, 1500),
    recommended_program: str(b.recommended_program, 80),
    program_slug: programmeSlug,
    program_name: program?.name ?? null,
    property_id: property?.id ?? null,
    property_name: property?.name ?? "Clinique La Prairie Phuket",
    destination_country: property?.country ?? "Thailand",
    source_page: str(b.page, 200) ?? `/properties/${PROPERTY_SLUG}`,
    guest_contact: { email: isEmail ? contact : null, whatsapp: isEmail ? null : contact },
    consent: { given: true, at: new Date().toISOString() },
    attribution: {
      traffic_source: str(b.traffic_source, 120),
      utm_source: str(b.utm_source, 120),
      utm_medium: str(b.utm_medium, 120),
      utm_campaign: str(b.utm_campaign, 120),
    },
  }

  const { data: booking, error: bookingErr } = await supabaseAdmin
    .from("bookings")
    .insert({
      user_id: guest.id,
      program_id: program?.id ?? null,
      pax: 1,
      status: "inquiry",
      payment_status: "unpaid",
      source: "website_clp_phuket",
      inquiry_context: inquiryContext,
    })
    .select("id")
    .single()
  if (bookingErr || !booking) {
    console.error("[clp-lead] booking insert failed:", bookingErr)
    return bad("could not store request", 500)
  }

  void supabaseAdmin
    .from("analytics_events")
    .insert({
      event_name: "inquiry_submitted",
      user_id: guest.id,
      booking_id: booking.id,
      property_id: property?.id ?? null,
      program_id: program?.id ?? null,
      destination_country: property?.country ?? null,
      utm_source: inquiryContext.attribution.utm_source,
      utm_medium: inquiryContext.attribution.utm_medium,
      utm_campaign: inquiryContext.attribution.utm_campaign,
      traffic_channel: inquiryContext.attribution.traffic_source,
    })
    .then(({ error }) => {
      if (error) console.error("[clp-lead] analytics insert failed:", error)
    })

  void (async () => {
    try {
      const recipients = adminInbox()
      if (recipients.length === 0) return
      const mail = availabilityRequest({
        guestName: name,
        guestContact: contact,
        programName: program?.name ?? `Programme guidance (goal: ${inquiryContext.goal ?? "not sure"})`,
        propertyName: inquiryContext.property_name,
        arrival: null,
        pax: 1,
        sourcePage: inquiryContext.source_page,
        adminBookingUrl: `${new URL(req.url).origin}/admin/bookings`,
      })
      await sendEmail({ to: recipients, ...mail, tag: "clp_phuket_enquiry" })
    } catch (err) {
      console.error("[clp-lead] notify failed:", err)
    }
  })()

  return NextResponse.json({ ok: true })
}
