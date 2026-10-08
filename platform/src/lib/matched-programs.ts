import "server-only"
import { supabaseAdmin } from "./supabase-server"

/** Top published programs for a cohort, cheapest first — the "matched" set after the WS assessment. */
export async function fetchMatchedPrograms(cohort: number | null | undefined) {
  const { data } = await supabaseAdmin
    .from("programs")
    .select(
      "id, name, slug, summary, cohort, tier, duration_days, price_usd, outcomes, is_composite, hero_image_url, " +
        "program_properties(role, properties(name, island, country, contact_wa)), " +
        "program_variants(duration_days, duration_nights, price_basic_usd, active)",
    )
    .eq("cohort", cohort ?? 1)
    .eq("active", true)
    .eq("status", "published")
    .order("price_usd", { ascending: true })
    .limit(3)
  return data ?? []
}
