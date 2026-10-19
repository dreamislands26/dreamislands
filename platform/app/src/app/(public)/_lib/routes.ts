// Category routes shared by the home chips and the search chips, so a visitor always meets the same
// set and order (Oleg, 19.10.2026). Each route is one catalogue filter: a goal (outcomes_taxonomy) or
// a track (cohort).
import { outcomeLabel, type CatalogProgram, type Outcome } from "./catalog"

export type Route = { key: string; label: string; icon: string; goal?: string; track?: string; cohort?: number }

/** Material Symbols for goals (outcomes_taxonomy slugs) and tracks; shared by chips and goal tiles. */
export const GOAL_ICONS: Record<string, string> = {
  "restore-sleep": "bedtime",
  "boost-energy": "bolt",
  "metabolic-health": "monitor_weight",
  "mental-clarity": "psychology",
  "stress-anxiety": "self_improvement",
  "rebuild-your-body": "fitness_center",
  "healthy-ageing": "eco",
}
export const TRACK_ICONS: Record<string, string> = { Reset: "spa", Performance: "sprint", Mind: "psychology_alt", Immersion: "beach_access", SportChill: "surfing" }
export const goalIcon = (slug: string) => GOAL_ICONS[slug] ?? "spa"

/** Home order: design trio first, then the remaining live goals. */
export function homeRoutes(outcomes: Outcome[], programs: CatalogProgram[]): Route[] {
  const live = outcomes.filter((o) => programs.some((p) => p.outcomes.includes(o.slug)))
  const stress = live.find((o) => o.slug === "stress-anxiety")
  return [
    stress ? { key: stress.slug, label: "Stress relief", icon: goalIcon(stress.slug), goal: stress.slug } : { key: "mind", label: "Stress relief", icon: TRACK_ICONS.Mind, track: "Mind", cohort: 3 },
    { key: "performance", label: "Performance", icon: TRACK_ICONS.Performance, track: "Performance", cohort: 2 },
    { key: "reset", label: "Reset & Recovery", icon: TRACK_ICONS.Reset, track: "Reset", cohort: 1 },
    ...live.filter((o) => o !== stress).map((o) => ({ key: o.slug, label: outcomeLabel(o), icon: goalIcon(o.slug), goal: o.slug })),
  ]
}

/** Search order: the home routes, with the broader tracks not already among them mixed in after the
 *  first, clearest few. */
export function searchRoutes(home: Route[], tracks: { label: string; track: string; cohort: number }[]): Route[] {
  const extra = tracks
    .filter((t) => !home.some((r) => r.cohort === t.cohort))
    .map((t) => ({ key: `track-${t.track}`, label: t.label, icon: TRACK_ICONS[t.track] ?? "spa", track: t.track, cohort: t.cohort }))
  const head = home.slice(0, 5)
  return [...head, ...extra, ...home.slice(5)]
}

export const routeMatch = (r: Route) => (p: CatalogProgram) => (r.goal ? p.outcomes.includes(r.goal) : p.cohort === r.cohort)
export const routeHref = (r: Route) => (r.goal ? `/programs?goal=${r.goal}` : `/programs?track=${r.track}`)
