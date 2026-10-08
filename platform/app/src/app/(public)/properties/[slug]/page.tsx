import Image from "next/image"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase-server"
import { type DbProgramRow } from "../../_lib/programMapping"
import { mapProgramsResolved } from "../../_lib/programMappingResolved"
import ProgramCard from "../../_components/ProgramCard"
import ReserveModal from "../../_components/ReserveModal"
import MediaGallery from "../../_components/MediaGallery"
import type { Metadata } from "next"
import { dataLayerScript } from "../../_lib/track"
import { canonicalPathForDbSlug, MEDICAL_SITE } from "@/lib/medical-routes"

function trimMeta(input: string, max = 155): string {
  const t = input.replace(/\s+/g, " ").trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const i = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "))
  if (i > 80) return cut.slice(0, i + 1)
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "") + "..."
}


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { data } = await supabaseAdmin
    .from("properties")
    .select("name, island, country, description, image_url, translations")
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
  const trEn = (((data as any).translations?.en) ?? {}) as { seo_title?: string; meta_description?: string }
  const seoTitle = trEn.seo_title ? String(trEn.seo_title).replace(/\s*\|\s*Dream Islands\s*$/i, "") : null
  const title = seoTitle ?? (location ? `${row.name.trim()} - ${location}` : row.name.trim())
  const description = trimMeta(trEn.meta_description ?? row.description ?? `${row.name.trim()}, a verified wellness property on Dream Islands.`)
  return {
    title,
    description,
    alternates: { canonical: canonicalPathForDbSlug(slug) },
    openGraph: {
      title: `${title} | Dream Islands`,
      description,
      url: `${MEDICAL_SITE}${canonicalPathForDbSlug(slug)}`,
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
    .select("id, name, slug, island, country, cohort_tags, certified, description, image_url, contact_wa, active, translations, entity_type")
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

  const programs = await mapProgramsResolved((progRows ?? []) as unknown as DbProgramRow[])

  const { data: mediaRows } = await supabaseAdmin
    .from("media_assets")
    .select("public_url, alt_en, alt_ru, title_ru, asset_type, is_featured, sort_order")
    .eq("property_id", property.id)
    .eq("active", true)
    .eq("asset_type", "gallery")
    .order("sort_order")

  const galleryImages = ((mediaRows ?? []) as unknown as Array<{
    public_url: string
    alt_en?: string | null; alt_ru: string | null
    title_ru: string | null
  }>)
    .filter((m) => m.public_url && m.public_url.startsWith("http"))
    .map((m) => ({ url: m.public_url, alt: m.alt_en || m.alt_ru || m.title_ru || property.name.trim() }))

  const isMedicalProp = ((property as any).entity_type === "hospital_clinic") || ((property as any).entity_type === "network_coordinator")
  const flag = property.country ? (COUNTRY_FLAGS[property.country] ?? "") : ""
  const waHref = property.contact_wa
    ? `https://wa.me/${property.contact_wa.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi! I'd like to know more about ${property.name.trim()}.`)}`
    : "https://wa.me/message/HOF2AFIBDYY5J1"

  const videos: { youtube_id: string; title_en?: string }[] = Array.isArray((property as any).translations?.videos)
    ? (property as any).translations.videos
    : []

  const jsonLdType = (property as any).entity_type === "hospital_clinic" ? "Hospital" : (property as any).entity_type === "network_coordinator" ? "Organization" : "LodgingBusiness"
  const propertyJsonLd = {
    "@context": "https://schema.org",
    "@type": jsonLdType,
    name: property.name.trim(),
    description: property.description ?? undefined,
    image: property.image_url ?? undefined,
    url: `${MEDICAL_SITE}${canonicalPathForDbSlug(property.slug)}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: property.island ?? undefined,
      addressCountry: property.country ?? undefined,
    },
  }

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(propertyJsonLd) }} />
      {videos.map((v) => (
        <script
          key={"vo-" + v.youtube_id}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "VideoObject",
              name: `${v.title_en ?? property.name.trim()} | ${property.name.trim()}`,
              description: `${v.title_en ?? "Video"} at ${property.name.trim()}${property.island ? ", " + property.island : ""}${property.country ? ", " + property.country : ""}.`,
              thumbnailUrl: [`https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg`],
              uploadDate: "2026-10-06T00:00:00+00:00",
              contentUrl: `https://youtu.be/${v.youtube_id}`,
              embedUrl: `https://www.youtube.com/embed/${v.youtube_id}`,
              publisher: { "@type": "Organization", name: "Dream Islands", url: "https://dreamislands.org" },
            }),
          }}
        />
      ))}
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
          {isMedicalProp && programs.length === 0 && (
            <ReserveModal
              programs={[{
                id: "",
                name: `Case review - ${property.name.trim()}`,
                property_id: property.id,
                property_name: property.name,
                destination_country: property.country ?? undefined,
                case_mode: true,
              }]}
              triggerLabel="Submit Your Case"
              triggerClassName="btn btn-primary"
            />
          )}
          {programs.length > 0 && (
            <ReserveModal
              programs={programs.map((p) => ({
                id: p.id,
                name: p.name,
                property_id: property.id,
                property_name: property.name,
                destination_country: property.country ?? undefined,
                case_mode: isMedicalProp,
              }))}
              triggerLabel={isMedicalProp ? "Submit Your Case" : "Reserve a program here"}
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

        {videos.length > 0 && (
          <div style={{ margin: "40px 0" }}>
            <h2 style={{ fontSize: 22, marginBottom: 16 }}>Watch</h2>
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
              {videos.map((v) => (
                <div key={v.youtube_id}>
                  <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: 14 }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${v.youtube_id}`}
                      title={v.title_en ?? property.name.trim()}
                      loading="lazy"
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                  <div style={{ fontSize: 14, marginTop: 8 }}>{v.title_en}</div>
                </div>
              ))}
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
          <p className="body">{isMedicalProp ? "Submit your case: our team reviews it, recommends the suitable provider and programme, and confirms scope and price before any booking." : "No published programs at this property yet."}</p>
        )}
      </section>
    </div>
  )
}
