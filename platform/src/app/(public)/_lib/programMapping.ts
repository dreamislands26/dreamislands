// Mapping layer between Supabase `programs` rows and the LandingProgram shape
// the design components expect. Lives only on the public side.
import { COUNTRY_FLAGS } from "./countries"

const OUTCOME_ICON_RULES: Array<[string, string]> = [["energy", "energy"], ["sleep", "sleep"], ["stress", "stress"], ["calm", "stress"], ["relax", "stress"], ["weight", "weight"], ["anti-aging", "ageing"], ["longevity", "longevity"], ["inflammation", "inflammation"], ["clarity", "clarity"], ["mental reset", "clarity"], ["gut", "digestion"], ["digest", "digestion"]]

export function outcomeIcon(tag: string): string | null {
  const t = tag.toLowerCase()
  for (const [keyword, icon] of OUTCOME_ICON_RULES) {
    if (t.includes(keyword)) return icon
  }
  return null
}

export const COHORT_LABELS: Record<number, { name: string; fullName: string; tagline: string; color: string }> = {
  1: { name: "Reset", fullName: "Reset & Recovery", tagline: "Detox & recovery", color: "var(--reset)" },
  2: { name: "Performance", fullName: "Performance", tagline: "Energy & fitness", color: "var(--accent)" },
  3: { name: "Mind", fullName: "Mind Balance", tagline: "Clarity & calm", color: "var(--sleep)" },
  4: { name: "Immersion", fullName: "Island Immersion", tagline: "Deep transformation", color: "var(--accent)" },
  7: { name: "SportChill", fullName: "Sport & Chill", tagline: "Active holiday, not a fix", color: "var(--sport)" },
}

export const TRACKS = [
  { id: "Reset", label: "Reset & Recovery", desc: "Down-regulate, detox, re-sleep.", cohort: 1 },
  { id: "Performance", label: "Performance", desc: "Train smarter; rebuild capacity.", cohort: 2 },
  { id: "Mind", label: "Mind Balance", desc: "Calm the nervous system; restore focus.", cohort: 3 },
  { id: "Immersion", label: "Island Immersion", desc: "Composite, longer-stay protocols.", cohort: 4 },
  { id: "SportChill", label: "Sport & Chill", desc: "Active travel — sport, recovery, leisure. No problem to fix.", cohort: 7 },
] as const

export const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Get your WS",
    body: "23 questions, about 2 minutes. We score Movement, Recovery, Lifestyle Risk and Emotional Health on a 0–100 scale.",
  },
  {
    n: "02",
    title: "See your matched programs",
    body: "Three retreats across Asia, ranked by your score. Composite stays for deep work, focused tracks for one priority.",
  },
  {
    n: "03",
    title: "We WhatsApp you within minutes",
    body: "Real humans confirm dates, run pre-arrival prep, and stay with you through the protocol.",
  },
] as const

export type DbProperty = {
  id: string
  name: string
  island: string | null
  country: string | null
  contact_wa: string | null
}
export type DbVariant = {
  duration_days: number
  duration_nights: number
  price_basic_usd: number
  price_vip_usd: number | null
  active: boolean
}
export type DbProgramRow = {
  id: string
  name: string
  slug: string | null
  summary: string | null
  cohort: number
  tier: string | null
  duration_days: number
  price_usd: number
  outcomes: string[] | null
  is_composite: boolean
  hero_image_url: string | null
  performance_subtype_id: number | null
  performance_subtypes: { code: string; label: string; sort_order: number } | null
  program_properties: Array<{ role: string | null; properties: DbProperty }>
  program_variants: DbVariant[]
}
export type LandingProgram = {
  id: string
  slug: string | null
  name: string
  blurb: string
  track: string
  trackFull: string
  cohort: number
  trackColor: string
  performanceSubtype: { code: string; label: string } | null
  tier: string | null
  type: "Composite" | "Rebuild"
  duration: string
  price: string
  tags: string[]
  location: string
  flag: string
  country: string | null
  hero_image_url: string | null
  contact_wa: string | null
}

export function mapProgram(row: DbProgramRow): LandingProgram {
  const cohort = COHORT_LABELS[row.cohort] ?? { name: "Reset", fullName: "Reset & Recovery", tagline: "", color: "var(--accent)" }
  const performanceSubtype = row.performance_subtypes
    ? { code: row.performance_subtypes.code, label: row.performance_subtypes.label }
    : null
  const variants = (row.program_variants ?? []).filter((v) => v.active)
  const days = variants.map((v) => v.duration_days).filter((n) => n > 0)
  const dMin = days.length ? Math.min(...days) : row.duration_days
  const dMax = days.length ? Math.max(...days) : row.duration_days
  const duration = dMin === dMax ? `${dMin} days` : `${dMin}–${dMax} days`
  const prices = variants
    .map((v) => Number(v.price_basic_usd))
    .filter((n) => n > 0)
  const minPrice = prices.length ? Math.min(...prices) : Number(row.price_usd)
  const price = `from $${minPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  const firstProp = row.program_properties?.[0]?.properties
  const locationParts: string[] = []
  if (firstProp?.island) locationParts.push(firstProp.island)
  if (firstProp?.country) locationParts.push(firstProp.country)
  const location = locationParts.join(", ") || (firstProp?.name ?? "")
  const flag = firstProp?.country ? (COUNTRY_FLAGS[firstProp.country] ?? "") : ""
  const contact_wa =
    row.program_properties?.map((pp) => pp.properties?.contact_wa).find((wa) => !!wa) ?? null
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    blurb: row.summary ?? "",
    track: cohort.name,
    trackFull: cohort.fullName,
    cohort: row.cohort,
    trackColor: cohort.color,
    performanceSubtype,
    tier: row.tier,
    type: row.is_composite ? "Composite" : "Rebuild",
    duration,
    price,
    tags: row.outcomes ?? [],
    location,
    flag,
    country: firstProp?.country ?? null,
    hero_image_url: row.hero_image_url,
    contact_wa,
  }
}
