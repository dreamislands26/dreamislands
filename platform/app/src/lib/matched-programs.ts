import "server-only"
import { supabaseAdmin } from "./supabase-server"
import { resolveHeroes } from "@/app/(public)/_lib/programMappingResolved"
import { rankPrograms, RANKING_VERSION, type GuestCtx, type RankingResult } from "./ranking-v1"

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
  lane: any[]
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
 * Explainability log: one journey_search per assessment (linked to the guest and the assessment),
 * one journey_match per shown program with score components and the `why` payload.
 * Never throws: logging must not break the guest's result.
 */
async function logRanking(ctx: GuestCtx, r: RankingResult) {
  try {
    if (!ctx.userId) return
    const { data: s, error } = await supabaseAdmin
      .from("journey_search")
      .insert({
        user_id: ctx.userId,
        assessment_id: ctx.assessmentId ?? null,
        duration_min: ctx.durationDays ?? null,
        duration_max: ctx.durationDays ?? null,
        party_size: 1,
      })
      .select("id")
      .single()
    if (error || !s) {
      console.error("[ranking-v1] journey_search insert failed", error?.message)
      return
    }
    const shown = [
      ...r.programs.map((p, i) => ({ p, rank: i + 1, lane: false })),
      ...r.lane.map((p) => ({ p, rank: null as number | null, lane: true })),
    ]
    if (!shown.length) return
    const rows = shown.map(({ p, rank, lane }) => {
      const k = p.ranking.components
      return {
        search_id: s.id,
        program_id: p.id,
        goal_fit: Math.round(k.goal),
        evidence_fit: Math.round(k.evidence),
        destination_fit: 0,
        duration_fit: Math.round(k.constraint),
        rank,
        intent_fit: k.intent,
        trigger_fit: k.trigger,
        score: p.ranking.score,
        ranking_version: p.ranking.version,
        why: { ...p.ranking.why, lane, components: k, focus_resolved: r.focus },
      }
    })
    const { error: mErr } = await supabaseAdmin.from("journey_match").insert(rows)
    if (mErr) console.error("[ranking-v1] journey_match insert failed", mErr.message)
  } catch (e) {
    console.error("[ranking-v1] logging failed", e)
  }
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
        if (ctx.log) await logRanking(ctx, r)
        return { programs, noMatch: r.noMatch, medicalPathway: r.medicalPathway, lane: r.lane, version: RANKING_VERSION }
      }
    } catch (e) {
      console.error("[ranking-v1] failed, using legacy matcher", e)
    }
  }
  return { programs: await legacyMatched(cohort), noMatch: false, medicalPathway: [], lane: [], version: "legacy" }
}

/** Backwards-compatible: returns just the programs. */
export async function fetchMatchedPrograms(cohort: number | null | undefined, ctx?: GuestCtx) {
  return (await fetchMatchedBundle(cohort, ctx)).programs
}
