import { NextResponse } from "next/server"
import { normalizeEmail, sendGuestCode } from "@/lib/guest-auth"

export const dynamic = "force-dynamic"

// Per-instance cooldown so one address can't be spammed with codes.
const COOLDOWN_MS = 60_000
const lastSent = new Map<string, number>()

export async function POST(req: Request) {
  let body: { email?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: "invalid JSON body" }, { status: 400 })
  }
  const email = normalizeEmail(body.email)
  if (!email) return NextResponse.json({ success: false, error: "Enter a valid email" }, { status: 400 })

  const now = Date.now()
  const prev = lastSent.get(email)
  if (prev && now - prev < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - (now - prev)) / 1000)
    return NextResponse.json(
      { success: false, error: `We just sent a code. You can request a new one in ${wait} s.`, retryIn: wait },
      { status: 429 },
    )
  }
  lastSent.set(email, now)

  const ok = await sendGuestCode(email)
  if (!ok) {
    lastSent.delete(email)
    return NextResponse.json({ success: false, error: "Couldn't send the code. Please try again." }, { status: 502 })
  }
  return NextResponse.json({ success: true, retryIn: COOLDOWN_MS / 1000 })
}
