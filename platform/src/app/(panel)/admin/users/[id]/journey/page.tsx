import { notFound } from "next/navigation"
import { Alert } from "antd"
import { DIT_WHATSAPP_URL } from "@/lib/contact"
import { fetchGuestCabinet } from "@/lib/guest-cabinet"
import { supabaseAdmin } from "@/lib/supabase-server"
import JourneyView from "./JourneyView"

export const dynamic = "force-dynamic"

// Admin preview of the data this guest sees at /profile on the public site.
export default async function GuestJourneyPreview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: guest } = await supabaseAdmin.from("users").select("id, email").eq("id", id).maybeSingle()
  if (!guest) notFound()
  // Same person = same email, exactly as the guest's own profile groups rows.
  let ids = [guest.id as string]
  if (guest.email) {
    const { data: rows } = await supabaseAdmin.from("users").select("id").ilike("email", String(guest.email).trim().replace(/[\\%_]/g, (c) => `\\${c}`))
    ids = Array.from(new Set([...ids, ...(rows ?? []).map((r) => r.id as string)]))
  }
  const cabinet = await fetchGuestCabinet(guest.id as string, ids)
  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
        message={`Data preview of ${cabinet.profile.name ?? "this guest"}'s profile — the guest sees it on the site at /profile`}
      />
      <JourneyView cabinet={cabinet} whatsappUrl={DIT_WHATSAPP_URL} programsUrl={`${(process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "").replace(/\/$/, "")}/programs`} />
    </>
  )
}
