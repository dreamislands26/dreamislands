import Image from "next/image"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase-server"
import { mapProgram, type DbProgramRow } from "../../_lib/programMapping"
import ProgramCard from "../../_components/ProgramCard"
import ReserveModal from "../../_components/ReserveModal"
import MediaGallery from "../../_components/MediaGallery"
import type { Metadata } from "next"
import { dataLayerScript } from "../../_lib/track"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { data } = await supabaseAdmin
    .from("properties")
    .select("name, island, country, description, image_url")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle()
  if (!data) {
    return { title: "Property not found" }
  }
  const row = data as unknown as {
    name: string
    island: string | null
    country: string | null
    description: string | null
    image_url: string | null
  }
  const location = [row.island, row.country].filter(Boolean).join(", ")
  const title = location ? `${row.name.trim()} - ${location}` : row.name.trim()
  const description = row.description ?? `${row.name.trim()}, a verified wellness property on Dream Islands.`
  return {
    title,
    description,
    alternates: { canonical: `/properties/${slug}` },
    openGraph: {
      title: `${title} | Dream Islands`,
      description,
      url: `https://dreamislands.org/properties/${slug}`,
      images: row.image_url ? [{ url: row.image_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Dream Islands`,
      description,
      images: row.image_url ? [row.image_url] : undefined,
    },
  }
}


export const dynamic = "force-dynamic"

const COUNTRY_FLAGS: Record<string, string> = {
  Thailand: "🇹🇭",
  China: "🇨🇳",
  Indonesia: "🇮🇩",
  Singapore: "🇸🇬",
  Philippines: "🇵🇭",
  Vietnam: "🇻🇳",
  Malaysia: "🇲🇾",
}

const TRACK_NAMES: Record<number, string> = {
  1: "Reset",
  2: "Performance",
  3: "Mind",
  4: "Immersion",
}

// Tanya ecosystem has its own full section — send visitors there instead of a generic page.
const TANYA_SLUGS = new Set(["tanya-core", "bunya-clinic", "tanya-wellbeing"])

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (TANYA_SLUGS.has(slug)) {
    redirect("/tanya-samui")
  }

  const { data: property } = await supabaseAdmin
    .from("properties")
    .select("id, name, slug, island, country, cohort_tags, certified, description, image_url, contact_wa, active")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle()

  if (!property) notFound()

  const { data: progRows } = await supabaseAdmin
    .from("programs")
    .select(
      "id, name, slug, summary, cohort, tier, duration_days, price_usd, outcomes, is_composite, hero_image_url, " +
        "program_properties!inner(role, properties(id, name, island, country, contact_wa)), " +
        "program_variants(duration_days, duration_nights, price_basic_usd, price_vip_usd, active)",
    )
    .eq("active", true)
    .eq("status", "published")
    .eq("program_properties.property_id", property.id)
    .order("sort_order")

  const programs = ((progRows ?? []) as unknown as DbProgramRow[]).map(mapProgram)

  const { data: mediaRows } = await supabaseAdmin
    .from("media_assets")
    .select("public_url, alt_ru, title_ru, asset_type, is_featured, sort_order")
    .eq("property_id", property.id)
    .eq("active", true)
    .eq("asset_type", "gallery")
    .order("sort_order")

  const galleryImages = ((mediaRows ?? []) as unknown as Array<{
    public_url: string
    alt_ru: string | null
    title_ru: string | null
  }>)
    .filter((m) => m.public_url && m.public_url.startsWith("http"))
    .map((m) => ({ url: m.public_url, alt: m.alt_ru || m.title_ru || property.name.trim() }))

  const flag = property.country ? (COUNTRY_FLAGS[property.country] ?? "") : ""
  const waHref = property.contact_wa
    ? `https://wa.me/${property.contact_wa.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi! I'd like to know more about ${property.name.trim()}.`)}`
    : "https://wa.me/message/HOF2AFIBDYY5J1"

  const propertyJsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: property.name.trim(),
    description: property.description ?? undefined,
    image: property.image_url ?? undefined,
    url: `https://dreamislands.org/properties/${property.slug}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: property.island ?? undefined,
      addressCountry: property.country ?? undefined,
    },
  }

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(propertyJsonLd) }} />
      {slug === "mile-wellness-resort" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "VideoObject",
              name: "Mile Wellness Resort, Yunnan | TCM, Medical Wellness & Hot Springs in China",
              description:
                "Mile Wellness Resort is a premium medical wellness retreat in Mile, Yunnan, China, combining Traditional Chinese Medicine (TCM), functional medicine, modern diagnostics, silica hot springs and restorative wellness. Programs range from short 3-day wellness escapes to 7-14 day deep recovery, executive health and preventive wellness programs.",
              thumbnailUrl: ["https://i.ytimg.com/vi/fpyzycLUIck/hqdefault.jpg"],
              uploadDate: "2026-09-01T08:00:25-07:00",
              duration: "PT1M4S",
              contentUrl: "https://youtu.be/fpyzycLUIck",
              embedUrl: "https://www.youtube.com/embed/fpyzycLUIck",
              publisher: { "@type": "Organization", name: "Dream Islands", url: "https://dreamislands.org" },
            }),
          }}
        />
      )}
      <script dangerouslySetInnerHTML={{ __html: dataLayerScript("view_property", { property_id: property.id, property_name: property.name, country: property.country, destination_country: property.country }) }} />
      <section className="shell" style={{ paddingTop: 24 }}>
        <Link href="/properties" className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 13, marginBottom: 24, display: "inline-flex" }}>
          {"←"} All properties
        </Link>

        {property.image_url && (
          <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 7", borderRadius: 20, overflow: "hidden", marginBottom: 28 }}>
            <Image
              src={property.image_url}
              alt={property.name.trim()}
              fill
              sizes="100vw"
              style={{ objectFit: "cover" }}
              priority
            />
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
          <h1 className="display" style={{ margin: 0, fontSize: "clamp(34px, 7vw, 56px)", color: "var(--ink)" }}>
            {property.name.trim()}
          </h1>
          {property.certified && <span className="tag">Verified Partner</span>}
        </div>

        <div className="body-lg" style={{ marginBottom: 20, color: "var(--ink-2)" }}>
          {flag} {[property.island, property.country].filter(Boolean).join(" · ")}
        </div>

        {property.description && (
          <p className="body-lg" style={{ maxWidth: 760, marginBottom: 24 }}>
            {property.description}
          </p>
        )}

        {property.cohort_tags && property.cohort_tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
            {property.cohort_tags.map((c: number) => (
              <span key={c} className="tag-outline tag" style={{ fontSize: 11 }}>
                {TRACK_NAMES[c] ?? `Track ${c}`}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 48 }}>
          {programs.length > 0 && (
            <ReserveModal
              programs={programs.map((p) => ({
                id: p.id,
                name: p.name,
                property_id: property.id,
                property_name: property.name,
                destination_country: property.country ?? undefined,
              }))}
              triggerLabel="Reserve a program here"
              triggerClassName="btn btn-primary"
            />
          )}
          <a href={waHref} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ display: "inline-flex" }}>
            Message on WhatsApp
          </a>
        </div>

        {galleryImages.length > 0 && <MediaGallery images={galleryImages} title="Gallery" />}

        {slug === "mile-wellness-resort" && (
          <div style={{ margin: "40px 0" }}>
            <h2 style={{ fontSize: 22, marginBottom: 16 }}>Watch: Mile Wellness Resort</h2>
            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: 14 }}>
              <iframe
                src="https://www.youtube.com/embed/fpyzycLUIck"
                title="Mile Wellness Resort, Yunnan | TCM, Medical Wellness & Hot Springs in China"
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        )}

        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              {programs.length} program{programs.length === 1 ? "" : "s"}
            </div>
            <h2>Programs at <span className="display-italic">{property.name.trim()}</span>.</h2>
          </div>
        </div>

        {programs.length > 0 ? (
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {programs.map((p) => (
              <ProgramCard key={p.id} program={p} variant="wide" />
            ))}
          </div>
        ) : (
          <p className="body">No published programs at this property yet.</p>
        )}
      </section>
    </div>
  )
}
