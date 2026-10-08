import { NextResponse } from "next/server"
import { supabaseServer, supabaseAdmin } from "@/lib/supabase-server"
import { guestRowIds } from "@/lib/guest-auth"

export const dynamic = "force-dynamic"

type Payload = { name?: unknown; whatsapp?: unknown; country?: unknown }

function clean(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null
  const t = v.trim()
  return t ? t.slice(0, max) : null
}

// Guest edits their own contact details from /profile/details.
export async function PATCH(req: Request) {
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user?.email) return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 })

  let body: Payload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: "invalid JSON body" }, { status: 400 })
  }
  const update = {
    name: clean(body.name, 120),
    whatsapp: clean(body.whatsapp, 40),
    country: clean(body.country, 80),
  }

  const { primary } = await guestRowIds(user.id, user.email.toLowerCase())
  if (primary) {
    const { error } = await supabaseAdmin.from("users").update(update).eq("id", primary)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  } else {
    // Signed up without an assessment: create the guest row so details persist.
    const { error } = await supabaseAdmin
      .from("users")
      .insert({ ...update, email: user.email.toLowerCase(), auth_user_id: user.id, source: "profile" })
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}
