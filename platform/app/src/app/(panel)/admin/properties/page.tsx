import { supabaseAdmin } from "@/lib/supabase-server"
import PropertiesView, { type PropertyRow } from "./PropertiesView"
import { CohortCatalogProvider } from "./PropertyFormFields"
import { fetchCohortCatalog } from "@/lib/cohorts"

export const dynamic = "force-dynamic"

export default async function Properties() {
  const { data, error } = await supabaseAdmin
    .from("properties")
    .select(
      "id, name, slug, parent_id, island, country, cohort_tags, performance_subtype_ids, certified, active, contact_wa, description, created_at",
    )
    .order("created_at")

  const rows = (data ?? []) as PropertyRow[]
  // Resolve parent name in memory (avoid JOIN that complicates types)
  const byId = new Map<string, PropertyRow>(rows.map((r) => [r.id, r]))
  const enriched = rows.map((r) => ({
    ...r,
    parent_name: r.parent_id ? byId.get(r.parent_id)?.name ?? null : null,
  }))

  const parentOptions = rows.filter((r) => !r.parent_id).map((r) => ({ id: r.id, name: r.name }))

  const catalog = await fetchCohortCatalog()
  return (
    <CohortCatalogProvider catalog={catalog}>
      <PropertiesView
        rows={enriched}
        parentOptions={parentOptions}
        errorMessage={error?.message ?? null}
      />
    </CohortCatalogProvider>
  )
}
