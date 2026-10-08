import { supabaseAdmin } from "@/lib/supabase-server"
import { fetchAdminUsers, fetchGuestDataset } from "@/lib/guest-queries"
import UsersView, { type ProgramOption, type PropertyOption } from "./UsersView"

export const dynamic = "force-dynamic"

export default async function Users({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; property?: string }>
}) {
  const filters = await searchParams
  const { users, errorMessage: usersError } = await fetchAdminUsers(supabaseAdmin)
  const data = await fetchGuestDataset(supabaseAdmin, users)

  const rows = data.rows.filter((r) => {
    if (filters.program && !r.program_ids.includes(filters.program)) return false
    if (filters.property && !r.property_ids.includes(filters.property)) return false
    return true
  })

  const programOptions: ProgramOption[] = data.programs.map((p) => ({
    id: p.id,
    name: p.name,
    cohort: p.cohort,
    tier: p.tier,
  }))
  const propertyOptions: PropertyOption[] = data.properties
    .filter((p) => p.active)
    .map((p) => ({ id: p.id, name: p.name, slug: p.slug }))

  return (
    <UsersView
      rows={rows}
      bookings={data.bookings}
      programOptions={programOptions}
      propertyOptions={propertyOptions}
      activeFilters={{ program: filters.program ?? null, property: filters.property ?? null }}
      errorMessage={usersError ?? data.errorMessage}
    />
  )
}
