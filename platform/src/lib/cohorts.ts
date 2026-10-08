import "server-only"
import { supabaseAdmin } from "./supabase-server"

// Cohorts live in `tracks` (id = the cohort number used across programs and
// properties.cohort_tags). Subcategories exist only for Performance, in
// `performance_subtypes`.

export type CohortOption = { id: number; code: string; label: string; is_public: boolean }
export type SubtypeOption = { id: number; code: string; label: string }
export type CohortCatalog = { cohorts: CohortOption[]; performanceSubtypes: SubtypeOption[]; performanceId: number | null }

export async function fetchCohortCatalog(): Promise<CohortCatalog> {
  const [{ data: tracks }, { data: subtypes }] = await Promise.all([
    supabaseAdmin.from("tracks").select("id, code, label, is_public, sort_order").order("sort_order"),
    supabaseAdmin.from("performance_subtypes").select("id, code, label, sort_order").order("sort_order"),
  ])
  const cohorts = (tracks ?? []).map((t) => ({
    id: Number(t.id),
    code: t.code as string,
    label: t.label as string,
    is_public: !!t.is_public,
  }))
  return {
    cohorts,
    performanceSubtypes: (subtypes ?? []).map((s) => ({ id: Number(s.id), code: s.code as string, label: s.label as string })),
    performanceId: cohorts.find((c) => c.code === "performance")?.id ?? null,
  }
}

/** Keeps only ids that exist in the catalog; drops subtypes unless Performance is among the cohorts. */
export function cleanCohortSelection(
  catalog: CohortCatalog,
  cohortTags: unknown,
  subtypeIds: unknown,
): { cohort_tags: number[]; performance_subtype_ids: number[] } {
  const known = new Set(catalog.cohorts.map((c) => c.id))
  const tags = Array.isArray(cohortTags)
    ? Array.from(new Set(cohortTags.map(Number).filter((n) => Number.isInteger(n) && known.has(n))))
    : []
  const knownSub = new Set(catalog.performanceSubtypes.map((s) => s.id))
  const subs =
    catalog.performanceId != null && tags.includes(catalog.performanceId) && Array.isArray(subtypeIds)
      ? Array.from(new Set(subtypeIds.map(Number).filter((n) => Number.isInteger(n) && knownSub.has(n))))
      : []
  return { cohort_tags: tags.sort((a, b) => a - b), performance_subtype_ids: subs.sort((a, b) => a - b) }
}

/** property_tracks mirrors cohort_tags; rewrite it after a save. */
export async function syncPropertyTracks(propertyId: string, cohortTags: number[]): Promise<void> {
  await supabaseAdmin.from("property_tracks").delete().eq("property_id", propertyId)
  if (cohortTags.length) {
    await supabaseAdmin.from("property_tracks").insert(cohortTags.map((t) => ({ property_id: propertyId, track_id: t })))
  }
}
