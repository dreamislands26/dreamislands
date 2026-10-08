import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase-server"
import { fetchAdminUsers, fetchGuestDataset } from "@/lib/guest-queries"
import PropertyDetailView, {
  type ProgramLinkRow,
  type RoomRow,
  type SpecialistRow,
} from "./PropertyDetailView"
import { CohortCatalogProvider } from "../PropertyFormFields"
import { fetchCohortCatalog } from "@/lib/cohorts"
import type { PropertyRow } from "../PropertiesView"

export const dynamic = "force-dynamic"

export default async function AdminPropertyDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [propRes, roomsRes, ppRes, programsRes, specialistsRes, parentsRes] = await Promise.all([
    supabaseAdmin
      .from("properties")
      .select(
        "id, name, slug, parent_id, island, country, cohort_tags, performance_subtype_ids, certified, active, contact_wa, description, created_at",
      )
      .eq("id", id)
      .maybeSingle(),
    supabaseAdmin
      .from("accommodation_rates")
      .select("id, room_type, capacity, has_pool, price_thb_per_night, description, active, sort_order")
      .eq("property_id", id)
      .order("sort_order")
      .order("capacity"),
    supabaseAdmin.from("program_properties").select("program_id").eq("property_id", id),
    supabaseAdmin
      .from("programs")
      .select("id, name, slug, cohort, tier, duration_days, price_usd, active")
      .order("name"),
    supabaseAdmin
      .from("specialists")
      .select("id, name, role, cohort_focus, active")
      .eq("property_id", id)
      .order("name"),
    supabaseAdmin.from("properties").select("id, name").is("parent_id", null).order("name"),
  ])

  const errorMessage = roomsRes.error?.message ?? programsRes.error?.message ?? null
  if (!propRes.data) notFound()

  const { users } = await fetchAdminUsers(supabaseAdmin)
  const guestData = await fetchGuestDataset(supabaseAdmin, users)
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
        attachablePrograms={allPrograms}
        specialists={(specialistsRes.data ?? []) as SpecialistRow[]}
        guests={guests}
        guestBookings={guestData.bookings}
        guestBasePath="/admin/users"
        parentOptions={(parentsRes.data ?? []) as Array<{ id: string; name: string }>}
        backHref="/admin/properties"
        backLabel="Back to properties"
        canEdit={{ overview: true, rooms: true, programs: true, specialists: true }}
        errorMessage={errorMessage}
      />
    </CohortCatalogProvider>
  )
}
