import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { supabaseAdmin } from "@/lib/supabase-server"
import type StripeSDK from "stripe"
import crypto from "crypto"

export const runtime = "nodejs"

const META_PIXEL_ID = "1037065448928323"
const GA4_MEASUREMENT_ID = "G-EX3VDY1RH0"

function sha256(value: string) {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex")
}

async function sendMetaPurchaseEvent(session: StripeSDK.Checkout.Session) {
  const token = process.env.META_CAPI_ACCESS_TOKEN
  if (token === undefined) return
  const email = session.customer_details?.email
  const value = (session.amount_total ?? 0) / 100
  const currency = (session.currency ?? "usd").toUpperCase()
  const payload = { data: [{ event_name: "Purchase", event_time: Math.floor(Date.now() / 1000), event_id: session.id, action_source: "website", event_source_url: "https://dreamislands.org/", user_data: { em: email ? [sha256(email)] : undefined }, custom_data: { currency, value } }] }
  const url = "https://graph.facebook.com/v20.0/" + META_PIXEL_ID + "/events?access_token=" + token
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    if (res.ok === false) console.error("[meta capi] non-OK response:", res.status, await res.text())
  } catch (err) {
    console.error("[meta capi] request failed:", err)
  }
}

async function sendGa4PurchaseEvent(session: StripeSDK.Checkout.Session) {
  const apiSecret = process.env.GA4_API_SECRET
  if (apiSecret === undefined) return
  const clientId = session.metadata?.ga_client_id || session.id
  const sessionId = session.metadata?.session_id || undefined
  const value = (session.amount_total ?? 0) / 100
  const currency = (session.currency ?? "thb").toUpperCase()
  const programId = session.metadata?.program_id
  const programName = session.metadata?.program_name
  const variantLabel = session.metadata?.variant_label
  const propertyName = session.metadata?.property_name
  const bookingId = session.metadata?.booking_id ?? session.id
  const payload = {
    client_id: clientId,
    events: [
      {
        name: "purchase",
        params: {
          transaction_id: bookingId,
          value: value,
          currency: currency,
          ...(sessionId ? { session_id: sessionId } : {}),
          items: programId
            ? [
                {
                  item_id: programId,
                  item_name: programName || undefined,
                  item_variant: variantLabel || undefined,
                  item_brand: propertyName || undefined,
                  item_category: "wellness_program",
                  price: value,
                  quantity: 1,
                },
              ]
            : undefined,
        },
      },
    ],
  }
  const url = "https://www.google-analytics.com/mp/collect?measurement_id=" + GA4_MEASUREMENT_ID + "&api_secret=" + apiSecret
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    if (res.ok === false) console.error("[ga4 mp] non-OK response:", res.status, await res.text())
  } catch (err) {
    console.error("[ga4 mp] request failed:", err)
  }
}

async function logAnalyticsPurchaseEvent(session: StripeSDK.Checkout.Session) {
  try {
    const value = (session.amount_total ?? 0) / 100
    const currency = (session.currency ?? "thb").toUpperCase()
    const cohort = session.metadata?.wbs_cohort ? Number(session.metadata.wbs_cohort) : null
    const score = session.metadata?.wbs_score ? Number(session.metadata.wbs_score) : null
    const { error } = await supabaseAdmin.from("analytics_events").insert({
      event_name: "purchase",
      ga_client_id: session.metadata?.ga_client_id || null,
      session_id: session.metadata?.session_id || null,
      user_id: session.metadata?.user_id || null,
      booking_id: session.metadata?.booking_id || null,
      market_country: session.metadata?.market_country || null,
      destination_country: session.metadata?.destination_country || null,
      property_id: session.metadata?.property_id || null,
      program_id: session.metadata?.program_id || null,
      variant_id: session.metadata?.variant_id || null,
      wbs_cohort: cohort,
      wbs_score: score,
      value,
      currency,
    })
    if (error) console.error("[analytics_events] purchase insert failed:", error)
  } catch (err) {
    console.error("[analytics_events] purchase insert unhandled:", err)
  }
}

async function findCommercialTerms(propertyId: string | null, programId: string | null, variantId: string | null) {
  const nowIso = new Date().toISOString()
  const { data, error } = await supabaseAdmin
    .from("commercial_terms")
    .select("commission_model, commission_rate, fixed_commission_amount, calculation_version, property_id, program_id, variant_id")
    .eq("is_active", true)
    .lte("valid_from", nowIso)
    .or("valid_to.is.null,valid_to.gt." + nowIso)
  if (error) {
    console.error("[commercial_terms] lookup failed:", error)
    return null
  }
  const rows = data ?? []
  const byVariant = variantId ? rows.find((r) => r.variant_id === variantId) : undefined
  if (byVariant) return byVariant
  const byProgram = programId ? rows.find((r) => r.program_id === programId && r.variant_id === null) : undefined
  if (byProgram) return byProgram
  const byProperty = propertyId ? rows.find((r) => r.property_id === propertyId && r.program_id === null && r.variant_id === null) : undefined
  if (byProperty) return byProperty
  const byDefault = rows.find((r) => r.property_id === null && r.program_id === null && r.variant_id === null)
  return byDefault ?? null
}

async function fetchStripeFee(paymentIntentId: string | null) {
  if (!paymentIntentId) return { fee: null as number | null, chargeId: null as string | null }
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ["latest_charge.balance_transaction"] })
    const charge = pi.latest_charge as StripeSDK.Charge | null
    const bt = charge?.balance_transaction as StripeSDK.BalanceTransaction | null
    return { fee: bt ? bt.fee / 100 : null, chargeId: charge?.id ?? null }
  } catch (err) {
    console.error("[stripe] fee lookup failed:", err)
    return { fee: null as number | null, chargeId: null as string | null }
  }
}

async function upsertBookingFinancialsOnPurchase(session: StripeSDK.Checkout.Session, eventId: string) {
  const bookingId = session.metadata?.booking_id ?? session.client_reference_id
  if (!bookingId) return
  const { data: booking, error: bookingErr } = await supabaseAdmin
    .from("bookings")
    .select("full_price, currency")
    .eq("id", bookingId)
    .single()
  if (bookingErr || !booking) {
    console.error("[booking_financials] booking lookup failed:", bookingErr)
    return
  }
  const propertyId = session.metadata?.property_id || null
  const programId = session.metadata?.program_id || null
  const variantId = session.metadata?.variant_id || null
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null
  const { fee, chargeId } = await fetchStripeFee(paymentIntentId)
  const amountPaid = (session.amount_total ?? 0) / 100
  const currency = (session.currency ?? booking.currency ?? "thb").toUpperCase()

  const { error: txError } = await supabaseAdmin.from("booking_payment_transactions").insert({
    booking_id: bookingId,
    provider: "stripe",
    provider_event_id: eventId,
    provider_charge_id: chargeId,
    provider_payment_intent_id: paymentIntentId,
    transaction_type: "payment",
    amount: amountPaid,
    currency,
    provider_fee: fee,
    raw_event: { session_id: session.id },
  })
  if (txError && txError.code !== "23505") {
    console.error("[booking_payment_transactions] insert failed:", txError)
  }

  const terms = await findCommercialTerms(propertyId, programId, variantId)
  const grossBookingValue = booking.full_price !== null ? Number(booking.full_price) : null
  let supplierPayable: number | null = null
  if (terms && grossBookingValue !== null) {
    if (terms.commission_model === "percentage_of_booking" && terms.commission_rate !== null) {
      supplierPayable = grossBookingValue * (1 - Number(terms.commission_rate))
    } else if (terms.commission_model === "fixed_amount" && terms.fixed_commission_amount !== null) {
      supplierPayable = grossBookingValue - Number(terms.fixed_commission_amount)
    }
  }
  const refundAmount = 0
  const dreamIslandsRevenue = grossBookingValue !== null && supplierPayable !== null ? grossBookingValue - supplierPayable - refundAmount : null
  const netRevenue = dreamIslandsRevenue !== null && fee !== null ? dreamIslandsRevenue - fee : null

  const { error: upsertErr } = await supabaseAdmin.from("booking_financials").upsert(
    {
      booking_id: bookingId,
      property_id: propertyId,
      program_id: programId,
      variant_id: variantId,
      currency,
      gross_booking_value: grossBookingValue,
      amount_paid: amountPaid,
      refund_amount: refundAmount,
      payment_processing_fee: fee,
      supplier_payable: supplierPayable,
      dream_islands_revenue: dreamIslandsRevenue,
      net_revenue: netRevenue,
      commission_rate: terms?.commission_rate ?? null,
      commission_model: terms?.commission_model ?? null,
      calculation_version: terms?.calculation_version ?? "unset",
      calculated_at: new Date().toISOString(),
    },
    { onConflict: "booking_id" }
  )
  if (upsertErr) console.error("[booking_financials] upsert failed:", upsertErr)
}

async function handleChargeRefunded(event: StripeSDK.Event) {
  const charge = event.data.object as StripeSDK.Charge
  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id ?? null
  if (!paymentIntentId) return

  const { data: paymentTx, error: txLookupErr } = await supabaseAdmin
    .from("booking_payment_transactions")
    .select("booking_id")
    .eq("provider_payment_intent_id", paymentIntentId)
    .eq("transaction_type", "payment")
    .limit(1)
    .maybeSingle()
  if (txLookupErr || !paymentTx) {
    console.error("[booking_financials] refund: no matching payment transaction:", txLookupErr)
    return
  }
  const bookingId = paymentTx.booking_id

  const { data: priorRefunds } = await supabaseAdmin
    .from("booking_payment_transactions")
    .select("amount")
    .eq("provider_charge_id", charge.id)
    .eq("transaction_type", "refund")
  const priorRefundSum = (priorRefunds ?? []).reduce((sum, r) => sum + Number(r.amount), 0)
  const totalRefunded = (charge.amount_refunded ?? 0) / 100
  const delta = totalRefunded - priorRefundSum
  if (delta > 0) {
    const { error: refundTxErr } = await supabaseAdmin.from("booking_payment_transactions").insert({
      booking_id: bookingId,
      provider: "stripe",
      provider_event_id: event.id,
      provider_charge_id: charge.id,
      provider_payment_intent_id: paymentIntentId,
      transaction_type: "refund",
      amount: delta,
      currency: (charge.currency ?? "thb").toUpperCase(),
      raw_event: { refunded: true },
    })
    if (refundTxErr && refundTxErr.code !== "23505") {
      console.error("[booking_payment_transactions] refund insert failed:", refundTxErr)
      return
    }
  }

  let currentFee: number | null = null
  if (charge.balance_transaction) {
    try {
      const btId = typeof charge.balance_transaction === "string" ? charge.balance_transaction : charge.balance_transaction.id
      const bt = await stripe.balanceTransactions.retrieve(btId)
      currentFee = bt.fee / 100
    } catch (err) {
      console.error("[stripe] balance transaction lookup failed:", err)
    }
  }

  const { data: refundRows } = await supabaseAdmin
    .from("booking_payment_transactions")
    .select("amount")
    .eq("booking_id", bookingId)
    .eq("transaction_type", "refund")
  const refundAmount = (refundRows ?? []).reduce((sum, r) => sum + Number(r.amount), 0)

  const { data: existing } = await supabaseAdmin
    .from("booking_financials")
    .select("gross_booking_value, supplier_payable, payment_processing_fee")
    .eq("booking_id", bookingId)
    .maybeSingle()
  if (!existing) return

  const fee = currentFee ?? existing.payment_processing_fee
  const grossBookingValue = existing.gross_booking_value !== null ? Number(existing.gross_booking_value) : null
  const supplierPayable = existing.supplier_payable !== null ? Number(existing.supplier_payable) : null
  const dreamIslandsRevenue = grossBookingValue !== null && supplierPayable !== null ? grossBookingValue - supplierPayable - refundAmount : null
  const netRevenue = dreamIslandsRevenue !== null && fee !== null ? dreamIslandsRevenue - Number(fee) : null

  const { error: updateErr } = await supabaseAdmin
    .from("booking_financials")
    .update({
      refund_amount: refundAmount,
      payment_processing_fee: fee,
      dream_islands_revenue: dreamIslandsRevenue,
      net_revenue: netRevenue,
      calculated_at: new Date().toISOString(),
    })
    .eq("booking_id", bookingId)
  if (updateErr) console.error("[booking_financials] refund update failed:", updateErr)
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !whSecret) {
    return NextResponse.json({ error: "missing signature/secret" }, { status: 400 })
  }
  const rawBody = await req.text()
  let event: StripeSDK.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, whSecret)
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err)
    return NextResponse.json({ error: "invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as StripeSDK.Checkout.Session
    const bookingId = session.metadata?.booking_id ?? session.client_reference_id
    if (bookingId) {
      const { error } = await supabaseAdmin
        .from("bookings")
        .update({
          payment_status: "paid",
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
          paid_at: new Date().toISOString(),
        })
        .eq("id", bookingId)
      if (error) console.error("[stripe webhook] failed to update booking:", error)
    }
    sendMetaPurchaseEvent(session).catch((err) => console.error("[meta capi] unhandled:", err))
    sendGa4PurchaseEvent(session).catch((err) => console.error("[ga4 mp] unhandled:", err))
    logAnalyticsPurchaseEvent(session).catch((err) => console.error("[analytics_events] unhandled:", err))
    upsertBookingFinancialsOnPurchase(session, event.id).catch((err) => console.error("[booking_financials] unhandled:", err))
  } else if (event.type === "charge.refunded") {
    handleChargeRefunded(event).catch((err) => console.error("[booking_financials] refund unhandled:", err))
  }

  return NextResponse.json({ received: true })
}
