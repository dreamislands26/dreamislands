import "server-only"
import { supabasePublic as supabaseAdmin } from "@/lib/supabase-public"  // anon + RLS, not service role

// One hero rule for every locale / every listing:
//   program.hero_image_url -> its own property photo -> NEUTRAL country hero -> global fallback
// A photo of another property is never used as a program's visual (Cross-property hero must stay 0).
// Resolved at render time, never copied into the entity.
export const GLOBAL_FALLBACK_HERO =
  process.env.NEXT_PUBLIC_GLOBAL_HERO ?? "https://dreamislands.ru/assets/img/og-image.webp"

export type HeroSource = "own" | "property" | "destination" | "global"

export type HeroContext = {
  neutralByCountry: Record<string, string>
}

export async function getHeroContext(): Promise<HeroContext> {
  const { data } = await supabaseAdmin
    .from("destination_countries")
    .select("country, hero_image_url, hero_is_neutral")
    .eq("active", true)
  const neutralByCountry: Record<string, string> = {}
  for (const r of (data ?? []) as any[]) {
    if (r.hero_is_neutral && r.hero_image_url) neutralByCountry[r.country] = r.hero_image_url
  }
  return { neutralByCountry }
}

type PropLike = { image_url?: string | null; country?: string | null; entity_type?: string | null }
type ProgramLike = {
  hero_image_url?: string | null
  program_properties?: Array<{ properties?: PropLike | null }> | null
}

export function resolveProgramHero(g: ProgramLike, ctx: HeroContext): { url: string; source: HeroSource } {
  if (g.hero_image_url) return { url: g.hero_image_url, source: "own" }
  const props = (g.program_properties ?? []).map((pp) => pp.properties).filter(Boolean) as PropLike[]
  // wellness properties first, same ordering as the RU generator
  props.sort((a, b) => (a.entity_type === "wellness_property" ? 0 : 1) - (b.entity_type === "wellness_property" ? 0 : 1))
  for (const p of props) if (p.image_url) return { url: p.image_url, source: "property" }
  const country = props.find((p) => p.country)?.country
  if (country && ctx.neutralByCountry[country]) return { url: ctx.neutralByCountry[country], source: "destination" }
  return { url: GLOBAL_FALLBACK_HERO, source: "global" }
}

export function resolvePropertyHero(p: PropLike, ctx: HeroContext): { url: string; source: HeroSource } {
  if (p.image_url) return { url: p.image_url, source: "property" }
  if (p.country && ctx.neutralByCountry[p.country]) return { url: ctx.neutralByCountry[p.country], source: "destination" }
  return { url: GLOBAL_FALLBACK_HERO, source: "global" }
}
