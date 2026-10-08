import { NextResponse } from "next/server"
import { confirmCheckoutSession } from "@/lib/checkout-confirm"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get("session_id")
  const programId = searchParams.get("program_id")
  const result = await confirmCheckoutSession(sessionId, programId)
  if (!result) {
    return NextResponse.json({ confirmed: false })
  }
  return NextResponse.json({ confirmed: true, booking: result })
}
