import { NextResponse } from "next/server"
import { supabaseServer, supabaseAdmin } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// Tiny endpoint for the site header: keeps public pages static while the
// avatar / "Log in" state is resolved in the browser.
export async function GET() {
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ signedIn: false })

  const [{ data: profile }, { data: guest }] = await Promise.all([
    sb.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabaseAdmin.from("users").select("name").eq("auth_user_id", user.id).maybeSingle(),
  ])
  return NextResponse.json({
    signedIn: true,
    role: profile?.role ?? "user",
    email: user.email ?? "",
    name: guest?.name ?? null,
  })
}
