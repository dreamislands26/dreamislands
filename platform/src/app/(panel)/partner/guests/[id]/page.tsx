import { notFound } from "next/navigation"
import { supabaseServer } from "@/lib/supabase-server"
import { fetchGuestProfile, fetchPartnerUsers } from "@/lib/guest-queries"
import GuestProfileView from "../../../admin/users/GuestProfileView"

export const dynamic = "force-dynamic"

export default async function PartnerGuestProfile({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const sb = await supabaseServer()

  // partner_guests is the authorised set: it already scopes to the partner's
  // properties, so membership in it *is* the access check. notFound() rather
  // than 403 so we don't confirm the id exists.
  const { users } = await fetchPartnerUsers(sb)
  const user = users.find((u) => u.id === id)
  if (!user) notFound()

  const profile = await fetchGuestProfile(sb, user)

  return (
    <GuestProfileView
      profile={profile}
      backHref="/partner/guests"
      backLabel="Back to guests"
      canEdit={false}
    />
  )
}
