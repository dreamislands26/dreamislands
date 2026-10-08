import { notFound } from "next/navigation"
import { getSessionUser } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"
import { fetchGuestDataset, fetchPartnerUsers } from "@/lib/guest-queries"
import PropertyDetailView, {
  type ProgramLinkRow,
  type RoomRow,
  type SpecialistRow,
} from "../../../admin/properties/[id]/PropertyDetailView"
import { CohortCatalogProvider } from "../../../admin/properties/PropertyFormFields"
import { fetchCohortCatalog } from "@/lib/cohorts"
import type { PropertyRow } from "../../../admin/properties/PropertiesView"

export const dynamic = "force-dynamic"

export default async function PartnerPropertyDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const me = await getSessionUser()

  // Authorize in code, not via RLS: properties_read grants every partner read on
  // every active property. notFound() rather than 403 so we don't confirm the id.
  if (!me || !me.partner_property_ids.includes(id)) notFound()

  const sb = await supabaseServer()

  const [propRes, roomsRes, ppRes, programsRes, specialistsRes] = await Promise.all([
    sb
      .from("properties")
      .select(
        "id, name, slug, parent_id, island, country, cohort_tags, performance_subtype_ids, certified, active, contact_wa, description, created_at",
      )
      .eq("id", id)
      .maybeSingle(),
    sb
      .from("accommodation_rates")
      .select("id, room_type, capacity, has_pool, price_thb_per_night, description, active, sort_order")
      .eq("property_id", id)
      .order("sort_order")
      .order("capacity"),
    sb.from("program_properties").select("program_id").eq("property_id", id),
    sb
      .from("programs")
      .select("id, name, slug, cohort, tier, duration_days, price_usd, active")
      .order("name"),
    sb
      .from("specialists")
      .select("id, name, role, cohort_focus, active")
      .eq("property_id", id)
      .order("name"),
  ])

  const errorMessage = roomsRes.error?.message ?? specialistsRes.error?.message ?? null
  if (!propRes.data) notFound()

  const { users } = await fetchPartnerUsers(sb)
  const guestData = await fetchGuestDataset(sb, users)
  const guests = guestData.rows.filter((r) => r.property_ids.includes(id))

  const linkedIds = new Set((ppRes.data ?? []).map((l) => l.program_id as string))
  const allPrograms = (programsRes.data ?? []) as ProgramLinkRow[]

  const catalog = await fetchCohortCatalog()
  return (
    <CohortCatalogProvider catalog={catalog}>
      <PropertyDetailView
        property={propRes.data as PropertyRow}
        rooms={(roomsRes.data ?? []) as RoomRow[]}
        programs={allPrograms.filter((p) => linkedIds.has(p.id))}
        attachablePrograms={[]}
        specialists={(specialistsRes.data ?? []) as SpecialistRow[]}
        guests={guests}
        guestBookings={guestData.bookings}
        guestBasePath="/partner/guests"
        parentOptions={[]}
        backHref="/partner/properties"
        backLabel="Back to properties"
        canEdit={{ overview: false, rooms: false, programs: false, specialists: true }}
        errorMessage={errorMessage}
      />
    </CohortCatalogProvider>
  )
}
