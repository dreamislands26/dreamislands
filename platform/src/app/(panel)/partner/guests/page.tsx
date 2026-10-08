import { getSessionUser } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"
import { fetchGuestDataset, fetchPartnerUsers } from "@/lib/guest-queries"
import UsersView, {
  type ProgramOption,
  type PropertyOption,
} from "../../admin/users/UsersView"

export const dynamic = "force-dynamic"

export default async function PartnerGuests({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; property?: string }>
}) {
  const filters = await searchParams
  const me = await getSessionUser()
  const partnerPropIds = me?.partner_property_ids ?? []
  const sb = await supabaseServer()

  const { users, errorMessage: usersError } = await fetchPartnerUsers(sb)
  const data = await fetchGuestDataset(sb, users)

  const rows = data.rows.filter((r) => {
    if (filters.program && !r.program_ids.includes(filters.program)) return false
    if (filters.property && !r.property_ids.includes(filters.property)) return false
    return true
  })

  // Properties RLS lets a partner read every active property, so the filter UI
  // must be narrowed to what they actually own.
  const partnerProgramIds = new Set(
    data.programProperties
      .filter((l) => partnerPropIds.includes(l.property_id))
      .map((l) => l.program_id),
  )
  const programOptions: ProgramOption[] = data.programs
    .filter((p) => partnerProgramIds.has(p.id))
    .map((p) => ({ id: p.id, name: p.name, cohort: p.cohort, tier: p.tier }))
  const propertyOptions: PropertyOption[] = data.properties
    .filter((p) => partnerPropIds.includes(p.id))
    .map((p) => ({ id: p.id, name: p.name, slug: p.slug }))

  return (
    <UsersView
      rows={rows}
      bookings={data.bookings}
      programOptions={programOptions}
      propertyOptions={propertyOptions}
      activeFilters={{ program: filters.program ?? null, property: filters.property ?? null }}
      errorMessage={usersError ?? data.errorMessage}
      basePath="/partner/guests"
      role="partner"
      title={`${rows.length} ${rows.length === 1 ? "guest" : "guests"} on your properties`}
    />
  )
}
