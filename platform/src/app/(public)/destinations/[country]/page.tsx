import Link from "next/link"
import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase-server"
import { mapProgram, type DbProgramRow } from "../../_lib/programMapping"
import ProgramCard from "../../_components/ProgramCard"
import { COUNTRY_FLAGS, countryFromSlug } from "../../_lib/countries"
import type { Metadata } from "next"
import { dataLayerScript } from "../../_lib/track"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>
}): Promise<Metadata> {
  const { country: slug } = await params
  const country = countryFromSlug(slug)
  if (country == null) {
    return { title: "Destination not found" }
  }
  const title = country + " Wellness Destinations"
  const description = "Explore verified wellness properties and programs in " + country + " on Dream Islands."
  return {
    title,
    description,
    alternates: { canonical: "/destinations/" + slug },
    openGraph: {
      title: title + " | Dream Islands",
      description,
      url: "https://dreamislands.org/destinations/" + slug,
    },
  }
}

export const dynamic = "force-dynamic"

type PropertyRow = {
  id: string
  name: string
  slug: string
  island: string | null
  description: string | null
  certified: boolean
}

export default async function DestinationCountryPage({
  params,
}: {
  params: Promise<{ country: string }>
}) {
  const { country: slug } = await params
  const country = countryFromSlug(slug)
  if (country == null) {
    notFound()
  }

  const { data: propRows } = await supabaseAdmin
    .from("properties")
    .select("id, name, slug, island, description, certified")
    .eq("active", true)
    .eq("country", country)
    .neq("name", "")
    .order("name")

  const properties = (propRows ?? []) as PropertyRow[]

  const { data: progRows } = await supabaseAdmin
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

  const allPrograms = ((progRows ?? []) as unknown as DbProgramRow[]).map(mapProgram)
  const programs = allPrograms.filter((p) => p.country === country)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: country + " Wellness Destinations",
    url: "https://dreamislands.org/destinations/" + slug,
    hasPart: [
      ...properties.map((p) => ({
        "@type": "LodgingBusiness",
        name: p.name.trim(),
        url: "https://dreamislands.org/properties/" + p.slug,
      })),
      ...programs.map((p) => ({
        "@type": "Product",
        name: p.name,
        url: p.slug ? "https://dreamislands.org/programs/" + p.slug : undefined,
      })),
    ],
  }

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script dangerouslySetInnerHTML={{ __html: dataLayerScript("view_destination", { country: country, slug: slug }) }} />
      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          <Link href="/destinations" style={{ color: "inherit" }}>Destinations</Link> / {country}
        </div>
        <h1
          className="display"
          style={{ fontSize: "clamp(40px, 10vw, 72px)", margin: "0 0 20px", color: "var(--ink)" }}
        >
          {COUNTRY_FLAGS[country] ?? ""} <span className="display-italic">{country}</span>
        </h1>
        <p className="body-lg" style={{ marginBottom: 40, maxWidth: 700 }}>
          {properties.length} {properties.length === 1 ? "property" : "properties"} and {programs.length}{" "}
          {programs.length === 1 ? "program" : "programs"} in {country} on Dream Islands.
        </p>

        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 28, marginBottom: 20, color: "var(--ink)" }}>
          Properties
        </h2>
        <div style={{ display: "grid", gap: 16, marginBottom: 48 }}>
          {properties.map((p) => (
            <Link
              key={p.id}
              href={"/properties/" + p.slug}
              className="card"
              style={{ display: "block", padding: 24, textDecoration: "none", color: "inherit" }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--ink)" }}>
                  {p.name.trim()}
                </div>
                {p.certified && <span className="tag" style={{ fontSize: 10 }}>Verified Partner</span>}
              </div>
              {p.island && <div className="body-sm">{p.island}</div>}
              {p.description && <p className="body-sm" style={{ marginTop: 6 }}>{p.description}</p>}
            </Link>
          ))}
        </div>

        {programs.length > 0 && (
          <>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 28, marginBottom: 20, color: "var(--ink)" }}>
              Programs
            </h2>
            <div
              style={{ display: "grid", gap: 16 }}
              className="programs-grid"
            >
              {programs.map((p) => (
                <ProgramCard key={p.id} program={p} variant="wide" />
              ))}
            </div>
            <style>{"@media (min-width: 700px) { .programs-grid { grid-template-columns: repeat(2, 1fr); } } @media (min-width: 1100px) { .programs-grid { grid-template-columns: repeat(3, 1fr); } }"}</style>
          </>
        )}
      </section>
    </div>
  )
}
