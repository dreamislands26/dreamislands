import "server-only"
import { supabaseAdmin } from "./supabase-server"
import { resolveHeroes } from "@/app/(public)/_lib/programMappingResolved"
import { rankPrograms, RANKING_VERSION, type GuestCtx } from "./ranking-v1"

export type { GuestCtx }

const MEDICAL_ENTITY_TYPES = new Set(["network_coordinator", "hospital_clinic"])

/** A program is a medical pathway if any linked property is a medical network/clinic. */
export function isMedicalPathway(row: any): boolean {
  return (row?.program_properties ?? []).some((pp: any) => MEDICAL_ENTITY_TYPES.has(pp?.properties?.entity_type))
}

export type MatchedBundle = {
  programs: any[]
  noMatch: boolean
  medicalPathway: any[]
  version: string
}

/** Legacy path (the 08.10 temporary protection): cohort-only, cheapest first, wellness top-3. Stays as fallback. */
async function legacyMatched(cohort: number | null | undefined) {
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

/**
 * Matching entry point. Ranking v1 runs only when RANKING_V1=1 AND a guest context is supplied;
 * any error or unknown focus falls back to the legacy path.
 */
export async function fetchMatchedBundle(
  cohort: number | null | undefined,
  ctx?: GuestCtx,
): Promise<MatchedBundle> {
  if (process.env.RANKING_V1 === "1" && ctx) {
    try {
      const r = await rankPrograms(ctx)
      if (r) {
        const heroes = await resolveHeroes(r.programs as any[])
        const programs = r.programs.map((p, i) => ({ ...p, hero_image_url: heroes[i].url }))
        return { programs, noMatch: r.noMatch, medicalPathway: r.medicalPathway, version: RANKING_VERSION }
      }
    } catch (e) {
      console.error("[ranking-v1] failed, using legacy matcher", e)
    }
  }
  return { programs: await legacyMatched(cohort), noMatch: false, medicalPathway: [], version: "legacy" }
}

/** Backwards-compatible: returns just the programs. */
export async function fetchMatchedPrograms(cohort: number | null | undefined, ctx?: GuestCtx) {
  return (await fetchMatchedBundle(cohort, ctx)).programs
}
