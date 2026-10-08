import "server-only"
import { supabasePublic as supabaseAdmin } from "@/lib/supabase-public"  // anon + RLS, not service role

// Single source for every public counter. Everything is derived from Supabase; nothing is hardcoded.
// Semantics (see Event_Driven_Rebuild_SPEC.md):
//  - programs   = published + active programs
//  - properties = active wellness_property rows ("selected objects" on the wellness storefront)
//  - clinics    = active hospital_clinic rows (reported separately, never mixed into `properties`)
//  - countries  = distinct countries of active wellness properties
export type CatalogStats = {
  programs: number
  properties: number
  clinics: number
  countries: number
  china: { wellnessDestinations: number; clinics: number; programs: number }
}

export async function getCatalogStats(): Promise<CatalogStats> {
  const [progRes, propRes] = await Promise.all([
    supabaseAdmin
      .from("programs")
      .select("id, program_properties(properties(country, entity_type, active))")
      .eq("active", true)
      .eq("status", "published"),
    supabaseAdmin.from("properties").select("id, country, entity_type").eq("active", true),
  ])
  const programs = (progRes.data ?? []) as any[]
  const props = (propRes.data ?? []) as Array<{ id: string; country: string | null; entity_type: string }>

  const wellness = props.filter((p) => p.entity_type === "wellness_property")
  const clinics = props.filter((p) => p.entity_type === "hospital_clinic")
  const countries = new Set(wellness.map((p) => p.country).filter(Boolean))

  const chinaWellness = wellness.filter((p) => p.country === "China")
  const chinaClinics = clinics.filter((p) => p.country === "China")
  const chinaPrograms = programs.filter((g) =>
    (g.program_properties ?? []).some((pp: any) => pp.properties?.country === "China"),
  )

  return {
    programs: programs.length,
    properties: wellness.length,
    clinics: clinics.length,
    countries: countries.size,
    china: {
      wellnessDestinations: chinaWellness.length,
      clinics: chinaClinics.length,
      programs: chinaPrograms.length,
    },
  }
}
