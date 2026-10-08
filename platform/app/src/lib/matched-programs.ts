import "server-only"
import { supabaseAdmin } from "./supabase-server"
import { resolveHeroes } from "@/app/(public)/_lib/programMappingResolved"

const MEDICAL_ENTITY_TYPES = new Set(["network_coordinator", "hospital_clinic"])

/** A program is a medical pathway if any linked property is a medical network/clinic. */
export function isMedicalPathway(row: any): boolean {
  return (row?.program_properties ?? []).some((pp: any) => MEDICAL_ENTITY_TYPES.has(pp?.properties?.entity_type))
}

/** Top published programs for a cohort, cheapest first — the "matched" set after the WS assessment. */
export async function fetchMatchedPrograms(cohort: number | null | undefined) {
  const { data } = await supabaseAdmin
    .from("programs")
    .select(
      "id, name, slug, summary, cohort, tier, duration_days, price_usd, outcomes, is_composite, hero_image_url, " +
        "program_properties(role, properties(id, name, island, country, contact_wa, entity_type)), " +
        "program_variants(duration_days, duration_nights, price_basic_usd, active)",
    )
    .eq("cohort", cohort ?? 1)
    .eq("active", true)
    .eq("status", "published")
    .order("price_usd", { ascending: true })
    .limit(40)
  // Wellness top-3 only. Medical pathway programs are surfaced by a separate, intent-driven layer (not by price).
  const rows = ((data ?? []) as any[]).filter((r) => !isMedicalPathway(r)).slice(0, 3)
  const heroes = await resolveHeroes(rows)
  return rows.map((r, i) => ({ ...r, hero_image_url: heroes[i].url }))
}
