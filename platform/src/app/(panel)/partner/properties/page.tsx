import { getSessionUser } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"
import PartnerPropertiesView, {
  type PartnerPropertyRow,
  type PropertyRequestRow,
} from "./PartnerPropertiesView"

export const dynamic = "force-dynamic"

export default async function PartnerProperties() {
  const me = await getSessionUser()
  const ids = me?.partner_property_ids ?? []
  const sb = await supabaseServer()

  // The .in(...) filter is load-bearing, not an optimisation: properties_read
  // lets any partner select every active property.
  const [propsRes, roomsRes, ppRes, specRes, reqRes] = await Promise.all([
    ids.length
      ? sb
          .from("properties")
          .select("id, name, slug, island, country, certified, active")
          .in("id", ids)
          .order("name")
      : Promise.resolve({ data: [], error: null }),
    ids.length
      ? sb.from("accommodation_rates").select("id, property_id").in("property_id", ids)
      : Promise.resolve({ data: [], error: null }),
    ids.length
      ? sb.from("program_properties").select("program_id, property_id").in("property_id", ids)
      : Promise.resolve({ data: [], error: null }),
    ids.length
      ? sb.from("specialists").select("id, property_id").in("property_id", ids)
      : Promise.resolve({ data: [], error: null }),
    // Not gated on ids: a partner with no properties yet may still have requests.
    sb
      .from("property_requests")
      .select("id, property_name, island, country, status, admin_note, created_at")
      .order("created_at", { ascending: false }),
  ])

  function countBy(list: Array<{ property_id: string }> | null) {
    const m = new Map<string, number>()
    for (const r of list ?? []) m.set(r.property_id, (m.get(r.property_id) ?? 0) + 1)
    return m
  }

  const roomCounts = countBy(roomsRes.data as Array<{ property_id: string }> | null)
  const programCounts = countBy(ppRes.data as Array<{ property_id: string }> | null)
  const specialistCounts = countBy(specRes.data as Array<{ property_id: string }> | null)

  const rows: PartnerPropertyRow[] = (
    (propsRes.data ?? []) as Array<Omit<PartnerPropertyRow, "rooms_count" | "programs_count" | "specialists_count">>
  ).map((p) => ({
    ...p,
    rooms_count: roomCounts.get(p.id) ?? 0,
    programs_count: programCounts.get(p.id) ?? 0,
    specialists_count: specialistCounts.get(p.id) ?? 0,
  }))

  return (
    <PartnerPropertiesView
      rows={rows}
      requests={(reqRes.data ?? []) as PropertyRequestRow[]}
      errorMessage={propsRes.error?.message ?? null}
    />
  )
}
