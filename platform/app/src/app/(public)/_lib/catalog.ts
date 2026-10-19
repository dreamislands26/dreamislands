// Read-only loaders shared by the DS v2 pages. Never writes.
import { supabaseAdmin } from "@/lib/supabase-server"
import { mapProgram, type DbProgramRow, type LandingProgram } from "./programMapping"
import { resolveHeroes } from "./programMappingResolved"

export const PROGRAM_SELECT =
  "id, name, slug, summary, cohort, tier, duration_days, price_usd, outcomes, is_composite, hero_image_url, " +
  "performance_subtype_id, performance_subtypes(code, label, sort_order), " +
  "program_properties(role, properties(id, name, island, country, contact_wa)), " +
  "program_variants(duration_days, duration_nights, price_basic_usd, price_vip_usd, active)"

export type CatalogProgram = LandingProgram & { minPrice: number; minDays: number; maxDays: number; propertyIds: string[]; outcomes: string[] }

/** Curated goals (outcomes_taxonomy), linked to programs through program_outcomes. */
export type Outcome = { slug: string; name: string; hook: string | null }

export async function loadOutcomes(): Promise<Outcome[]> {
  const { data } = await supabaseAdmin.from("outcomes_taxonomy").select("slug, name, hook").eq("active", true).order("priority")
  return (data ?? []) as Outcome[]
}

/** Short chip label: "Lose Weight / Metabolic Health" becomes "Lose Weight". */
export const outcomeLabel = (o: Outcome) => o.name.split(" / ")[0].trim()

async function loadProgramOutcomes(): Promise<Map<string, string[]>> {
  const { data } = await supabaseAdmin.from("program_outcomes").select("program_id, outcome_slug")
  const map = new Map<string, string[]>()
  for (const r of (data ?? []) as { program_id: string; outcome_slug: string }[]) map.set(r.program_id, [...(map.get(r.program_id) ?? []), r.outcome_slug])
  return map
}

/** Average published rating per program id. */
export async function loadRatings(): Promise<Map<string, number>> {
  const { data } = await supabaseAdmin
    .from("reviews")
    .select("program_id, rating")
    .eq("status", "published")
    .in("visibility", ["both", "en"])
    .not("rating", "is", null)
    .not("program_id", "is", null)
  const sums = new Map<string, { s: number; n: number }>()
  for (const r of (data ?? []) as { program_id: string; rating: number }[]) {
    const v = sums.get(r.program_id) ?? { s: 0, n: 0 }
    sums.set(r.program_id, { s: v.s + Number(r.rating), n: v.n + 1 })
  }
  return new Map([...sums].map(([id, v]) => [id, Math.round((v.s / v.n) * 10) / 10]))
}

export async function loadPrograms(): Promise<CatalogProgram[]> {
  const [{ data }, ratings, outcomes] = await Promise.all([
    supabaseAdmin
      .from("programs")
      .select(PROGRAM_SELECT)
      .eq("active", true)
      .eq("status", "published")
      .order("sort_order"),
    loadRatings(),
    loadProgramOutcomes(),
  ])
  const rows = (data ?? []) as unknown as DbProgramRow[]
  // Stage 1 hero rule: program own -> its own property -> neutral country hero -> global, never another
  // property's photo (programMappingResolved).
  const heroes = await resolveHeroes(rows as unknown as Parameters<typeof resolveHeroes>[0])
  return rows.map((row, i) => {
    const p = { ...mapProgram(row), hero_image_url: heroes[i].url, rating: ratings.get(row.id) ?? null }
    const variants = (row.program_variants ?? []).filter((v) => v.active)
    const prices = variants.map((v) => Number(v.price_basic_usd)).filter((n) => n > 0)
    const days = variants.map((v) => v.duration_days).filter((n) => n > 0)
    return {
      ...p,
      minPrice: prices.length ? Math.min(...prices) : Number(row.price_usd) || 0,
      minDays: days.length ? Math.min(...days) : row.duration_days,
      maxDays: days.length ? Math.max(...days) : row.duration_days,
      propertyIds: (row.program_properties ?? []).map((pp) => pp.properties?.id).filter((x): x is string => !!x),
      outcomes: outcomes.get(row.id) ?? [],
    }
  })
}

export type CatalogProperty = {
  id: string
  name: string
  slug: string
  island: string | null
  country: string | null
  description: string | null
  image_url: string | null
  certified: boolean
  entity_type: string | null
}

export async function loadProperties(country?: string): Promise<CatalogProperty[]> {
  let q = supabaseAdmin
    .from("properties")
    .select("id, name, slug, island, country, description, image_url, certified, entity_type")
    .eq("active", true)
    .neq("name", "")
    .order("name")
  if (country) q = q.eq("country", country)
  const { data } = await q
  return ((data ?? []) as CatalogProperty[]).map((p) => ({ ...p, name: p.name.trim() }))
}

export const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`

export function dayRange(min: number, max: number) {
  if (!min && !max) return ""
  return min === max ? `${min} days` : `${min} to ${max} days`
}

/** Goal language for the five tracks (until the taxonomy sync). */
export const GOALS: { cohort: number; key: string; chip: string; title: string; track: string }[] = [
  { cohort: 1, key: "reset", chip: "Recover and reset", title: "To recover and reset", track: "Reset" },
  { cohort: 3, key: "mind", chip: "Calm my mind", title: "For a calm mind and better sleep", track: "Mind" },
  { cohort: 2, key: "performance", chip: "Perform better", title: "To perform better", track: "Performance" },
  { cohort: 4, key: "immersion", chip: "Go deep", title: "To go deep", track: "Immersion" },
  { cohort: 7, key: "sport", chip: "Active holiday", title: "For an active holiday", track: "SportChill" },
]

/** First sentence, trimmed for card meta lines. */
export function shortLine(text: string | null | undefined, max = 60) {
  if (!text) return ""
  const first = text.split(/(?<=[.!?])\s/)[0] ?? text
  return first.length > max ? first.slice(0, max - 1).trimEnd() + "…" : first.replace(/\.$/, "")
}

const CYRILLIC_RE = /[Ѐ-ӿ]/
/** Bilingual fields are stored as "A / B" in either order: pick the side without Cyrillic. */
export function enOnly(s: string | null | undefined): string | null {
  if (!s) return null
  const parts = s.split(" / ").map((p) => p.trim()).filter(Boolean)
  if (parts.length > 1) {
    const clean = parts.find((p) => !CYRILLIC_RE.test(p))
    if (clean) return clean
  }
  return s.trim()
}

export type GuestReview = { id: string; name: string; meta: string | null; text: string; rating: number; programSlugs: string[]; featured: boolean }

export async function loadReviews(): Promise<GuestReview[]> {
  const { data } = await supabaseAdmin
    .from("reviews")
    .select("id, guest_name, guest_title, country, text_en, rating, featured, created_at, programs(name, slug)")
    .eq("status", "published")
    .in("visibility", ["both", "en"])
    .not("rating", "is", null)
    .order("created_at", { ascending: false })
  type Row = { id: string; guest_name: string; guest_title: string | null; country: string | null; text_en: string | null; rating: number; featured: boolean; programs: { name: string; slug: string } | { name: string; slug: string }[] | null }
  return ((data ?? []) as unknown as Row[])
    .filter((r) => r.text_en && !CYRILLIC_RE.test(r.text_en))
    .map((r) => {
      const progs = Array.isArray(r.programs) ? r.programs : r.programs ? [r.programs] : []
      return {
        id: r.id,
        name: enOnly(r.guest_name) ?? r.guest_name,
        meta: [enOnly(r.guest_title), enOnly(r.country)].filter(Boolean).join(", ") || null,
        text: r.text_en as string,
        rating: r.rating,
        featured: r.featured,
        programSlugs: progs.map((p) => p.slug).filter(Boolean),
      }
    })
}

export type Room = { id: string; room_type: string; capacity: number | null; has_pool: boolean | null; description: string | null; price_thb_per_night: number | null }

export async function loadRooms(propertyIds: string[]): Promise<Room[]> {
  if (propertyIds.length === 0) return []
  const { data } = await supabaseAdmin
    .from("accommodation_rates")
    .select("id, room_type, capacity, has_pool, description, price_thb_per_night, sort_order")
    .in("property_id", propertyIds)
    .eq("active", true)
    .order("sort_order")
  return (data ?? []) as Room[]
}

export async function loadGallery(filter: { program_id?: string; property_id?: string | string[] }, fallbackAlt: string) {
  let q = supabaseAdmin.from("media_assets").select("public_url, alt_en, alt_ru, title_ru").eq("active", true).eq("asset_type", "gallery").order("sort_order")
  if (filter.program_id) q = q.eq("program_id", filter.program_id)
  if (filter.property_id) q = Array.isArray(filter.property_id) ? q.in("property_id", filter.property_id) : q.eq("property_id", filter.property_id)
  const { data } = await q
  return ((data ?? []) as { public_url: string; alt_en: string | null; alt_ru: string | null; title_ru: string | null }[])
    .filter((m) => m.public_url && m.public_url.startsWith("http"))
    .map((m) => ({ url: m.public_url, alt: m.alt_en?.trim() || (enOnly(m.alt_ru) && !CYRILLIC_RE.test(enOnly(m.alt_ru) as string) ? (enOnly(m.alt_ru) as string) : fallbackAlt) }))
}
