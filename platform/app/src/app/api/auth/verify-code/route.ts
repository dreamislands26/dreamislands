import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseServer } from "@/lib/supabase-server"
import { claimGuestRows, normalizeEmail } from "@/lib/guest-auth"
import { QUIZ_COOKIE, readQuizCookie } from "@/lib/quiz-cookie"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  let body: { email?: unknown; code?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: "invalid JSON body" }, { status: 400 })
  }
  const email = normalizeEmail(body.email)
  const code = typeof body.code === "string" ? body.code.replace(/\D/g, "") : ""
  if (!email || code.length < 6) {
    return NextResponse.json({ success: false, error: "Enter the code from the email" }, { status: 400 })
  }

  const sb = await supabaseServer()
  const { data, error } = await sb.auth.verifyOtp({ email, token: code, type: "email" })
  if (error || !data.user) {
    return NextResponse.json(
      { success: false, error: "That code is wrong or has expired. Check the email or request a new one." },
      { status: 401 },
    )
  }

  const cookieStore = await cookies()
  await claimGuestRows(data.user.id, email, readQuizCookie(cookieStore.get(QUIZ_COOKIE)?.value))
  return NextResponse.json({ success: true })
}
