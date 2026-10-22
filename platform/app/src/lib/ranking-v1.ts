import "server-only"
import { supabasePublic } from "./supabase-public"

/**
 * Ranking Model v1 — eligibility (E1–E9) first, then weighted scoring.
 * Spec: specs/ranking-v1/Ranking_v1_03_report_rules_weights_simulation.md
 * Locale-independent: works on codes only. Price is never an input (E9).
 * Returns null on any data error so the caller can fall back to the legacy matcher.
 *
 * Medical boundary (decision 2026-10-11):
 *  - `wellness` programs compete for the wellness top-3.
 *  - `medical_wellness` programs NEVER enter the wellness top-3, even when verified.
 *    For the Longevity focus, verified ones appear in a separate "preventive lane" (screening language, no wellness claims).
 *  - `medical` programs only appear in the Medical support block (medical signal), without price.
 */

export const RANKING_VERSION = "v1"

export type GuestCtx = {
  focus?: string | null
  intent?: string | null
  durationDays?: number | null
  subRisk?: number | null
  medicalSignal?: boolean
  // Set by /api/intake only (not by page re-renders) so each assessment is logged once.
  userId?: string | null
  assessmentId?: string | null
  log?: boolean
}

type FocusProfile = {
  icp: string | null // guest ICP (null = no automatic ICP)
  trigger: string
  goals: string[] // goals.code
  outcomes: string[] // outcomes_taxonomy slug; the first one is the guest's primary outcome
  lane?: boolean // show the controlled medical_wellness lane for this focus
}

// WS focus -> goal/outcome -> ICP/trigger. NOT via the legacy track/cohort.
const FOCUS: Record<string, FocusProfile> = {
  "Body & Detox": {
    icp: "preventive_longevity",
    trigger: "outcome_aware",
    goals: ["recover", "nutrition"],
    outcomes: ["metabolic-health", "boost-energy"],
  },
  "Sleep & Recovery": {
    icp: "mind_reset",
    trigger: "problem_aware",
    goals: ["rhythm", "recover"],
    outcomes: ["restore-sleep", "stress-anxiety"],
  },
  "Weight & Metabolic Health": {
    icp: "preventive_longevity",
    trigger: "outcome_aware",
    goals: ["nutrition"],
    outcomes: ["metabolic-health"],
  },
  // Decision 2026-10-11: no automatic ICP and no goal/outcome mapping -> "no close match" + coordinator CTA.
  "Beauty & Aesthetics": { icp: null, trigger: "outcome_aware", goals: [], outcomes: [] },
  Longevity: {
    icp: "preventive_longevity",
    trigger: "outcome_aware",
    goals: ["health"],
    outcomes: ["healthy-ageing"],
    lane: true,
  },
  "Performance & Energy": {
    icp: "performance_active",
    trigger: "outcome_aware",
    goals: ["fitness"],
    outcomes: ["rebuild-your-body", "boost-energy"],
  },
}

const INTENT_TO_FOCUS: Record<string, string> = {
  A: "Body & Detox",
  B: "Sleep & Recovery",
  C: "Weight & Metabolic Health",
  D: "Beauty & Aesthetics",
  E: "Longevity",
  F: "Performance & Energy",
}

export function resolveFocus(ctx: GuestCtx): { name: string; profile: FocusProfile } | null {
  const byFocus = ctx.focus ? FOCUS[ctx.focus.trim()] : undefined
  if (byFocus) return { name: ctx.focus!.trim(), profile: byFocus }
  const viaIntent = ctx.intent ? INTENT_TO_FOCUS[ctx.intent.trim().toUpperCase()] : undefined
  if (viaIntent) return { name: viaIntent, profile: FOCUS[viaIntent] }
  return null
}

const conf = (verified: boolean | null | undefined) => (verified ? 1 : 0.5)

export type RankedProgram = Record<string, any> & {
  ranking: {
    version: string
    score: number
    components: { intent: number; goal: number; trigger: number; evidence: number; constraint: number; commercial: number }
    cta: string
    why: Record<string, any>
  }
}

export type RankingResult = {
  programs: RankedProgram[]
  noMatch: boolean
  medicalPathway: Record<string, any>[]
  lane: RankedProgram[]
  focus: string
}

const PROGRAM_SELECT =
  "id, name, slug, summary, cohort, tier, duration_days, price_usd, outcomes, is_composite, hero_image_url, " +
  "contraindications, sort_order, market, medical_level, medical_level_verified, cta_type, " +
  "program_properties(role, properties(id, name, island, country, contact_wa, entity_type, certified)), " +
  "program_variants(duration_days, duration_nights, price_basic_usd, active), " +
  "program_icps(icp_code, fit, verified), program_triggers(trigger_code, fit, verified), " +
  "program_goals(goal_id, verified, goals(code)), program_outcomes(outcome_slug, weight, verified), " +
  "reviews(id, status)"

const MEDICAL_ENTITY_TYPES = new Set(["network_coordinator", "hospital_clinic"])
const isMedicalProperty = (row: any) =>
  (row?.program_properties ?? []).some((pp: any) => MEDICAL_ENTITY_TYPES.has(pp?.properties?.entity_type))

function score(row: any, f: { name: string; profile: FocusProfile }, ctx: GuestCtx) {
  const p = f.profile
  const notes: string[] = []
  const matchedOn: string[] = []
  let allConfirmed = true

  // Intent fit (25)
  let intent = 0
  const icpRow = p.icp ? (row.program_icps ?? []).find((r: any) => r.icp_code === p.icp) : null
  if (icpRow) {
    intent = 25 * (icpRow.fit === "primary" ? 1 : 0.5) * conf(icpRow.verified)
    matchedOn.push(`${icpRow.fit} ICP ${p.icp}`)
    if (!icpRow.verified) allConfirmed = false
  }

  // Goal fit (25): max of outcome match and goal-code match
  let goalFrac = 0
  let goalMatch: string | null = null
  let goalAny = false
  for (const o of row.program_outcomes ?? []) {
    if (!p.outcomes.includes(o.outcome_slug)) continue
    goalAny = true
    // The guest's first listed outcome is the primary one (1.0); the rest count 0.6. Program weight: primary 1.0, secondary 0.6.
    const posFactor = p.outcomes.indexOf(o.outcome_slug) === 0 ? 1 : 0.6
    const v = (o.weight === "primary" ? 1 : 0.6) * posFactor * conf(o.verified)
    if (v > goalFrac) {
      goalFrac = v
      goalMatch = `${o.weight} outcome ${o.outcome_slug}`
      if (!o.verified) allConfirmed = false
    }
  }
  for (const g of row.program_goals ?? []) {
    const code = g?.goals?.code
    if (!code || !p.goals.includes(code)) continue
    goalAny = true
    const v = 0.8 * conf(g.verified)
    if (v > goalFrac) {
      goalFrac = v
      goalMatch = `goal ${code}`
      if (!g.verified) allConfirmed = false
    }
  }
  const goal = 25 * goalFrac
  if (goalMatch) matchedOn.push(goalMatch)

  // Trigger fit (15): primary 1.0, secondary 0.6, none 0.2 (confidence only applies to existing rows)
  let trigger = 15 * 0.2
  const trRow = (row.program_triggers ?? []).find((r: any) => r.trigger_code === p.trigger)
  if (trRow) {
    trigger = 15 * (trRow.fit === "primary" ? 1 : 0.6) * conf(trRow.verified)
    matchedOn.push(`trigger ${p.trigger}`)
    if (!trRow.verified) allConfirmed = false
  }

  // Evidence / quality (15)
  const nReviews = (row.reviews ?? []).filter((r: any) => r.status === "published").length
  const certified = (row.program_properties ?? []).some((pp: any) => pp?.properties?.certified)
  const evidenceFrac = nReviews >= 5 ? 1 : nReviews >= 1 ? 0.7 : certified ? 0.4 : 0.2
  const evidence = 15 * evidenceFrac
  if (nReviews > 0) matchedOn.push(`${nReviews} published review${nReviews === 1 ? "" : "s"}`)

  // Constraint fit (15): duration gap
  let gap: number | null = null
  let constraintFrac = 0.5
  if (typeof ctx.durationDays === "number" && typeof row.duration_days === "number") {
    gap = Math.abs(row.duration_days - ctx.durationDays)
    constraintFrac = gap <= 1 ? 1 : gap <= 3 ? 0.7 : gap <= 7 ? 0.4 : 0.2
  }
  const constraint = 15 * constraintFrac

  // Commercial relevance (5): bookable priced variant vs request-only (E7)
  const hasActiveVariant = (row.program_variants ?? []).some((v: any) => v.active)
  const commercial = 5 * (hasActiveVariant ? 1 : 0.5)

  // E6 safety notes: never excludes, never a diagnosis
  if (row.contraindications && String(row.contraindications).trim()) notes.push("screening note: contraindications listed")
  if (typeof ctx.subRisk === "number" && ctx.subRisk < 50) notes.push("screening note: risk sub-score is low")

  const total = intent + goal + trigger + evidence + constraint + commercial
  const r1 = (n: number) => Math.round(n * 10) / 10
  return {
    goalAny,
    gap,
    nReviews,
    total: r1(total),
    components: {
      intent: r1(intent),
      goal: r1(goal),
      trigger: r1(trigger),
      evidence: r1(evidence),
      constraint: r1(constraint),
      commercial: r1(commercial),
    },
    cta: hasActiveVariant ? row.cta_type ?? "find_my_program" : "request_dates",
    why: {
      version: RANKING_VERSION,
      focus: f.name,
      icp: p.icp,
      trigger: p.trigger,
      matched_on: matchedOn,
      notes,
      confidence: allConfirmed ? "confirmed" : "hypothesis",
    },
  }
}

type Scored = { r: any; s: ReturnType<typeof score> }

function toProgram({ r, s }: Scored): RankedProgram {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    summary: r.summary,
    cohort: r.cohort,
    tier: r.tier,
    duration_days: r.duration_days,
    price_usd: r.price_usd,
    outcomes: r.outcomes,
    is_composite: r.is_composite,
    hero_image_url: r.hero_image_url,
    program_properties: r.program_properties,
    program_variants: r.program_variants,
    ranking: { version: RANKING_VERSION, score: s.total, components: s.components, cta: s.cta, why: s.why },
  }
}

const byScore = (a: Scored, b: Scored) =>
  b.s.total - a.s.total ||
  (a.s.gap ?? 99) - (b.s.gap ?? 99) ||
  b.s.nReviews - a.s.nReviews ||
  (a.r.sort_order ?? 9999) - (b.r.sort_order ?? 9999) ||
  String(a.r.slug).localeCompare(String(b.r.slug))

export async function rankPrograms(ctx: GuestCtx): Promise<RankingResult | null> {
  const f = resolveFocus(ctx)
  if (!f) return null // unknown focus -> legacy matcher

  // No goal/outcome mapping (Beauty & Aesthetics): transparent "no close match"
  const noMapping = f.profile.goals.length === 0 && f.profile.outcomes.length === 0

  const { data, error } = await supabasePublic
    .from("programs")
    .select(PROGRAM_SELECT)
    .eq("active", true)
    .eq("status", "published")
    .eq("market", "b2c")
  if (error || !data) {
    console.error("[ranking-v1] programs query failed", error?.message)
    return null
  }
  const rows = data as any[]

  const medicalPathway = ctx.medicalSignal ? await fetchMedicalPathwayFrom(rows) : []

  // Controlled preventive lane (Longevity focus only): VERIFIED medical_wellness programs, never mixed into the wellness top-3.
  const lane: RankedProgram[] =
    f.profile.lane && !ctx.medicalSignal
      ? rows
          .filter(
            (r) =>
              r.medical_level === "medical_wellness" &&
              r.medical_level_verified === true &&
              (r.program_properties ?? []).length > 0 &&
              !isMedicalProperty(r) &&
              (r.program_icps ?? []).some((i: any) => i.icp_code === "preventive_longevity" && i.fit === "primary"),
          )
          .map((r) => ({ r, s: score(r, f, ctx) }))
          .filter((x) => x.s.goalAny)
          .sort(byScore)
          .slice(0, 2)
          .map(toProgram)
      : []

  if (noMapping) return { programs: [], noMatch: true, medicalPathway, lane, focus: f.name }

  // E1 done by query. E2 medical gate (fail closed): only `wellness` competes for the top-3.
  const eligible = rows.filter((r) => {
    if ((r.program_properties ?? []).length === 0) return false // E1: must have a linked property to send the guest to
    if (isMedicalProperty(r)) return false // legacy safety net stays on
    return r.medical_level === "wellness" // medical_wellness / medical / NULL never enter the wellness top-3
  })

  const scored: Scored[] = eligible.map((r) => ({ r, s: score(r, f, ctx) }))

  // E4 goal gate: with >= 3 goal-relevant programs, goal-fit 0 is not eligible for the top-3
  const relevant = scored.filter((x) => x.s.goalAny)
  // If nothing is goal-relevant at all there is no close match (never pad with unrelated programs)
  if (relevant.length === 0) return { programs: [], noMatch: true, medicalPathway, lane, focus: f.name }
  const pool = relevant.length >= 3 ? relevant : scored

  pool.sort(byScore)

  // E8 diversity: at most 2 of 3 from one property
  const perProperty = new Map<string, number>()
  const top: Scored[] = []
  for (const x of pool) {
    const pid = x.r.program_properties?.[0]?.properties?.id ?? `none:${x.r.id}`
    const n = perProperty.get(pid) ?? 0
    if (n >= 2) continue
    perProperty.set(pid, n + 1)
    top.push(x)
    if (top.length === 3) break
  }

  return { programs: top.map(toProgram), noMatch: false, medicalPathway, lane, focus: f.name }
}

/** Separate Medical support block. No price field on purpose (E9: price never competes with wellness programs). */
async function fetchMedicalPathwayFrom(rows: any[]) {
  return rows
    .filter((r) => r.medical_level === "medical")
    .slice(0, 3)
    .map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      summary: r.summary,
      duration_days: r.duration_days,
      program_properties: r.program_properties,
      cta: "submit_case",
      label: "Medical support / Clinical pathway",
    }))
}
