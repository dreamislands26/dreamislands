import { stripe } from "@/lib/stripe"
import { supabaseAdmin } from "@/lib/supabase-server"

export type ConfirmedCheckout = {
  id: string
  arrival: string
  departure: string
  pax: number
}

export async function confirmCheckoutSession(
  sessionId: string | null | undefined,
  programId?: string | null,
): Promise<ConfirmedCheckout | null> {
  if (!sessionId) return null
  let session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId)
  } catch (err) {
    console.error("[checkout-confirm] session retrieve failed:", err)
    return null
  }
  if (session.payment_status !== "paid") return null
  if (programId && session.metadata?.program_id && session.metadata.program_id !== programId) {
    return null
  }
  const bookingId = session.metadata?.booking_id ?? session.client_reference_id
  if (!bookingId) return null
  const { data: booking } = await supabaseAdmin
    .from("bookings")
    .select("id, arrival, departure, pax")
    .eq("id", bookingId)
    .maybeSingle()
  if (!booking) return null
  return { id: booking.id, arrival: booking.arrival, departure: booking.departure, pax: booking.pax }
}
