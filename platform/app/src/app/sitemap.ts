import type { MetadataRoute } from "next"
import { supabasePublic as supabaseAdmin } from "@/lib/supabase-public"  // anon + RLS, not service role
import { STATIC_ROUTES } from "./sitemap-static"
import { HTML_LANG, indexableLocales, localePath } from "@/lib/i18n"

// Sitemap is generated from Supabase on every request: a published entity appears, an unpublished/archived one disappears.
// STATIC_ROUTES holds only the non-entity pages (home, start, about, guides, tracks, ...).
export const dynamic = "force-dynamic"

const BASE = "https://dreamislands.org"

function d(v?: string | null): Date | undefined {
  return v ? new Date(v) : undefined
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [progs, props, dests] = await Promise.all([
    supabaseAdmin.from("programs").select("slug, updated_at").eq("active", true).eq("status", "published"),
    supabaseAdmin.from("properties").select("slug, country, entity_type, updated_at").eq("active", true),
    supabaseAdmin.from("destination_countries").select("slug, updated_at").eq("active", true),
  ])

  const out: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: BASE + r.path,
    changeFrequency: r.changefreq,
    priority: r.priority,
  }))

  for (const g of (progs.data ?? []) as any[]) {
    if (!g.slug) continue
    out.push({ url: `${BASE}/programs/${g.slug}`, lastModified: d(g.updated_at), changeFrequency: "weekly", priority: 0.8 })
  }
  for (const p of (props.data ?? []) as any[]) {
    if (!p.slug) continue
    if (p.entity_type === "wellness_property" || p.entity_type === "medical_wellness_center") {
      out.push({ url: `${BASE}/properties/${p.slug}`, lastModified: d(p.updated_at), changeFrequency: "weekly", priority: 0.7 })
    } else if (p.entity_type === "hospital_clinic" && p.country === "China") {
      out.push({ url: `${BASE}/medical/china/hospitals/${p.slug}`, lastModified: d(p.updated_at), changeFrequency: "monthly", priority: 0.6 })
    }
  }
  for (const c of (dests.data ?? []) as any[]) {
    if (!c.slug) continue
    out.push({ url: `${BASE}/destinations/${c.slug}`, lastModified: d(c.updated_at), changeFrequency: "weekly", priority: 0.8 })
  }

  // de-duplicate by URL (entity routes win over anything listed statically)
  const seen = new Map<string, MetadataRoute.Sitemap[number]>()
  for (const e of out) seen.set(e.url, e)
  const base = [...seen.values()]
  // Locale URLs + hreflang appear only for locales listed in INDEXABLE_LOCALES.
  const live = indexableLocales()
  if (!live.length) return base
  const withLocales: MetadataRoute.Sitemap = []
  for (const e of base) {
    const path = e.url.slice(BASE.length) || "/"
    const languages: Record<string, string> = { en: e.url, "x-default": e.url }
    for (const l of live) languages[HTML_LANG[l]] = BASE + localePath(path, l)
    withLocales.push({ ...e, alternates: { languages } })
    for (const l of live) withLocales.push({ ...e, url: BASE + localePath(path, l), alternates: { languages } })
  }
  return withLocales
}
