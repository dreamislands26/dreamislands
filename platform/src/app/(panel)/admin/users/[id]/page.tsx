import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase-server"
import { fetchAdminUser, fetchGuestProfile } from "@/lib/guest-queries"
import GuestProfileView from "../GuestProfileView"

export const dynamic = "force-dynamic"

export default async function AdminGuestProfile({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await fetchAdminUser(supabaseAdmin, id)
  if (!user) notFound()

  const profile = await fetchGuestProfile(supabaseAdmin, user)

  return (
    <GuestProfileView
      profile={profile}
      backHref="/admin/users"
      backLabel="Back to guests"
      canEdit
    />
  )
}
