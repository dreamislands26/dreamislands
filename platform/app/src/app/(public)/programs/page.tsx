import { supabaseAdmin } from "@/lib/supabase-server"
import ProgramsListView from "./ProgramsListView"
import { mapProgram, type DbProgramRow } from "../_lib/programMapping"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "All Wellness Programs",
  description: "Browse outcome-matched wellness programs across Asia - detox, performance, mind reset and immersion protocols.",
  alternates: { canonical: "/programs" },
  openGraph: {
    title: "All Wellness Programs | Dream Islands",
    description: "Browse outcome-matched wellness programs across Asia.",
    url: "https://dreamislands.org/programs",
  },
}

export const dynamic = "force-dynamic"

export default async function ProgramsListPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string; country?: string }>
}) {
  const sp = await searchParams

  const { data: rows } = await supabaseAdmin
    .from("programs")
    .select(
      "id, name, slug, summary, cohort, tier, duration_days, price_usd, outcomes, is_composite, hero_image_url, " +
        "performance_subtype_id, performance_subtypes(code, label, sort_order), " +
        "program_properties(role, properties(id, name, island, country, contact_wa)), " +
        "program_variants(duration_days, duration_nights, price_basic_usd, price_vip_usd, active)",
    )
    .eq("active", true)
    .eq("status", "published")
    .order("sort_order")
    .order("cohort")
    .order("duration_days")

  const programs = ((rows ?? []) as unknown as DbProgramRow[]).map(mapProgram)

  const jsonLd =
    (rows ?? []).length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: (rows ?? []).map((r: any, i: number) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `https://dreamislands.org/programs/${r.slug}`,
            item: {
              "@type": "Product",
              name: r.name,
              ...(r.summary ? { description: r.summary } : {}),
              ...(r.hero_image_url ? { image: r.hero_image_url } : {}),
              ...(r.price_usd
                ? {
                    offers: {
                      "@type": "Offer",
                      price: r.price_usd,
                      priceCurrency: "USD",
                      url: `https://dreamislands.org/programs/${r.slug}`,
                    },
                  }
                : {}),
            },
          })),
        }
      : null
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProgramsListView programs={programs} initialFilter={sp.track ?? "All"} initialCountry={sp.country ?? "All"} />
    </>
  )
}
