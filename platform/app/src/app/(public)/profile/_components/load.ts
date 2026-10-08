import "server-only"
import { cache } from "react"
import { supabaseAdmin, supabaseServer } from "@/lib/supabase-server"
import { guestRowIds } from "@/lib/guest-auth"
import { fetchGuestCabinet, type GuestCabinet } from "@/lib/guest-cabinet"

export type ProfileState =
  | { state: "anon" }
  | { state: "staff"; role: "admin" | "partner"; email: string }
  | { state: "guest"; email: string; cabinet: GuestCabinet }

/** Everything /profile needs for the signed-in guest, or why it can't show. Cached per request (layout + page). */
export const loadProfile = cache(async (): Promise<ProfileState> => {
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user?.email) return { state: "anon" }

  const { data: role } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (role?.role === "admin" || role?.role === "partner") {
    return { state: "staff", role: role.role, email: user.email }
  }

  const email = user.email.toLowerCase()
  const { primary, all } = await guestRowIds(user.id, email)
  const cabinet = await fetchGuestCabinet(primary, all)
  return { state: "guest", email, cabinet }
})

