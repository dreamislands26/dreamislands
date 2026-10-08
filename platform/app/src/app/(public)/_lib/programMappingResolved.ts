import "server-only"
import { cache } from "react"
import { supabasePublic } from "@/lib/supabase-public"
import { getHeroContext, resolveProgramHero, type HeroSource } from "@/lib/hero"
import { mapProgram, type DbProgramRow, type LandingProgram } from "./programMapping"

// SINGLE point where a program's hero is resolved (cards, lists, detail page, og:image, JSON-LD all use it):
//   program own -> its own (linked) property photo -> NEUTRAL country hero -> global fallback.
// A photo of a property that is not linked to the program is never used (Cross-property hero = 0).
const heroCtx = cache(getHeroContext)
const VIDEO = /\.(mp4|mov|webm)(\?|$)/i

type HeroRow = {
  hero_image_url: string | null
  program_properties?: Array<{ properties?: { id?: string; country?: string | null } | null }> | null
}

export async function resolveHeroes(rows: HeroRow[]): Promise<Array<{ url: string; source: HeroSource }>> {
  const ids = Array.from(
    new Set(
      rows.flatMap((r) => (r.program_properties ?? []).map((pp) => pp.properties?.id).filter(Boolean) as string[]),
    ),
  )
  const photos = new Map<string, string>()
  const ents = new Map<string, string | null>()
  if (ids.length) {
    const [props, media] = await Promise.all([
      supabasePublic.from("properties").select("id, image_url, entity_type").in("id", ids),
      supabasePublic
        .from("media_assets")
        .select("property_id, public_url, is_featured, sort_order, asset_type")
        .in("property_id", ids)
        .eq("active", true)
        .in("asset_type", ["hero", "gallery"])
        .order("is_featured", { ascending: false })
        .order("sort_order", { ascending: true }),
    ])
    for (const p of (props.data ?? []) as any[]) {
      ents.set(p.id, p.entity_type ?? null)
      if (p.image_url && !VIDEO.test(p.image_url)) photos.set(p.id, p.image_url)
    }
    for (const m of (media.data ?? []) as any[]) {
      if (m.public_url && !VIDEO.test(m.public_url) && !photos.has(m.property_id)) photos.set(m.property_id, m.public_url)
    }
  }
  const ctx = await heroCtx()
  return rows.map((r) =>
    resolveProgramHero(
      {
        hero_image_url: r.hero_image_url,
        program_properties: (r.program_properties ?? []).map((pp) => ({
          properties: pp.properties
            ? {
                image_url: (pp.properties.id && photos.get(pp.properties.id)) || null,
                country: pp.properties.country ?? null,
                entity_type: (pp.properties.id && ents.get(pp.properties.id)) || null,
              }
            : null,
        })),
      },
      ctx,
    ),
  )
}

export async function mapProgramsResolved(rows: DbProgramRow[]): Promise<LandingProgram[]> {
  const heroes = await resolveHeroes(rows as unknown as HeroRow[])
  return rows.map((r, i) => ({ ...mapProgram(r), hero_image_url: heroes[i].url, heroSource: heroes[i].source }))
}
