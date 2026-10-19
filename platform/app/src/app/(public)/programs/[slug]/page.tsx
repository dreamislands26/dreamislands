import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase-server"
import { resolveHeroes } from "../../_lib/programMappingResolved"
import { confirmCheckoutSession } from "@/lib/checkout-confirm"
import ProgramView, { type ProgramDetail, type AccommodationItem, type ProgramReview } from "./ProgramView"
import { enOnly, loadPrograms } from "../../_lib/catalog"
import type { Metadata } from "next"
import { dataLayerScript } from "../../_lib/track"

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
    .from("programs")
    .select("name, summary, hero_image_url, translations, program_properties(properties(id, island, country))")
    .eq("slug", slug)
    .eq("status", "published")
    .eq("active", true)
    .maybeSingle()
  if (!data) {
    return { title: "Programme not found" }
  }
  const row = data as unknown as {
    name: string
    summary: string | null
    hero_image_url: string | null
    program_properties: { properties: { island: string | null; country: string | null } | null }[]
  }
  const [metaHero] = await resolveHeroes([row as any])
  row.hero_image_url = metaHero.url
  const location = row.program_properties?.[0]?.properties
  const locationLabel = location ? [location.island, location.country].filter(Boolean).join(", ") : null
  const trEn = (((data as any).translations?.en) ?? {}) as { seo_title?: string; meta_description?: string }
  const seoTitle = trEn.seo_title ? String(trEn.seo_title).replace(/\s*\|\s*Dream Islands\s*$/i, "") : null
  const title = seoTitle ?? (locationLabel ? `${row.name} - ${locationLabel}` : row.name)
  const description = trimMeta(trEn.meta_description ?? row.summary ?? `${row.name}, a wellness programme offered through Dream Islands.`)
  return {
    title,
    description,
    alternates: { canonical: `/programs/${slug}` },
    openGraph: {
      title: `${title} | Dream Islands`,
      description,
      url: `https://dreamislands.org/programs/${slug}`,
      images: row.hero_image_url ? [{ url: row.hero_image_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Dream Islands`,
      description,
      images: row.hero_image_url ? [row.hero_image_url] : undefined,
    },
  }
}

export const dynamic = "force-dynamic"

export default async function ProgramDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ booking?: string; session_id?: string }>
}) {
  const { slug } = await params
  const sp = await searchParams

  const { data, error } = await supabaseAdmin
    .from("programs")
    .select(
      "id, name, slug, cohort, tier, summary, goal, target_guest, how_we_achieve, guest_feels, " +
        "included_services, contraindications, hero_image_url, outcomes, is_composite, " +
        "program_properties(role, properties(id, name, slug, island, country, contact_wa, entity_type)), " +
        "program_variants(id, label, duration_days, duration_nights, price_basic_usd, price_vip_usd, price_basic_thb, active, sort_order), " +
        "program_schedule_items(id, day_no, start_time, end_time, title, description, kind, sort_order), " +
        "program_services(is_included, sort_order, services(id, name, slug, category, description, price_usd, duration_min))",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .eq("active", true)
    .maybeSingle()

  if (error || !data) notFound()

  const program = data as unknown as ProgramDetail
  const [pageHero] = await resolveHeroes([program as any])
  program.hero_image_url = pageHero.url

  const { data: reviewRows } = await supabaseAdmin
    .from("reviews")
    .select("*, programs(name, slug)")
    .eq("status", "published")
    .in("visibility", ["both", "en"])
    .not("rating", "is", null)
    .order("created_at", { ascending: false })
  const programReviews = ((reviewRows ?? []) as any[]).filter((r) => {
    const progs = Array.isArray(r.programs) ? r.programs : [r.programs]
    return progs.some((p: any) => p?.slug === program.slug)
  })

  const confirmedBooking =
    sp.booking === "paid" && sp.session_id
      ? await confirmCheckoutSession(sp.session_id, program.id)
      : null

  // Pull accommodations for all linked properties
  const propertyIds = program.program_properties
    .map((pp) => pp.properties?.id)
    .filter((x): x is string => typeof x === "string")

  let accommodations: AccommodationItem[] = []
  if (propertyIds.length > 0) {
    const { data: accData } = await supabaseAdmin
      .from("accommodation_rates")
      .select("id, property_id, room_type, capacity, has_pool, price_thb_per_night, description, sort_order, properties(id, name)")
      .in("property_id", propertyIds)
      .eq("active", true)
      .order("property_id")
      .order("sort_order")
    accommodations = (accData ?? []) as unknown as AccommodationItem[]
  }

  // Gallery photos: prefer photos tied directly to this program, fall back to the primary property's gallery.
  let galleryImages: { url: string; alt: string }[] = []
  const { data: programMedia } = await supabaseAdmin
    .from("media_assets")
    .select("public_url, alt_en, alt_ru, title_ru")
    .eq("program_id", program.id)
    .eq("active", true)
    .eq("asset_type", "gallery")
    .order("sort_order")

  if (programMedia && programMedia.length > 0) {
    galleryImages = (programMedia as unknown as Array<{ public_url: string; alt_en?: string | null; alt_ru: string | null; title_ru: string | null }>)
      .filter((m) => m.public_url && m.public_url.startsWith("http"))
      .map((m) => ({ url: m.public_url, alt: m.alt_en || m.alt_ru || m.title_ru || program.name }))
  } else if (propertyIds.length > 0) {
    const { data: propMedia } = await supabaseAdmin
      .from("media_assets")
      .select("public_url, alt_en, alt_ru, title_ru")
      .in("property_id", propertyIds)
      .eq("active", true)
      .eq("asset_type", "gallery")
      .order("sort_order")
    galleryImages = ((propMedia ?? []) as unknown as Array<{ public_url: string; alt_en?: string | null; alt_ru: string | null; title_ru: string | null }>)
      .filter((m) => m.public_url && m.public_url.startsWith("http"))
      .map((m) => ({ url: m.public_url, alt: m.alt_en || m.alt_ru || m.title_ru || program.name }))
  }

  const activeVariants = (program.program_variants ?? []).filter((v) => v.active)
  const lowestPrice = activeVariants.length > 0 ? Math.min(...activeVariants.map((v) => v.price_basic_usd)) : null
  const primaryProperty = program.program_properties?.[0]?.properties
  const avgProgramRating =
    programReviews.length > 0
      ? programReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / programReviews.length
      : null
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    additionalType: "https://schema.org/TouristTrip",
    name: program.name,
    description: program.summary ?? program.goal ?? undefined,
    image: program.hero_image_url ?? undefined,
    url: `https://dreamislands.org/programs/${program.slug}`,
    ...(lowestPrice != null
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "USD",
            price: lowestPrice,
            availability: "https://schema.org/InStock",
            url: `https://dreamislands.org/programs/${program.slug}`,
          },
        }
      : {}),
    ...(primaryProperty
      ? {
          brand: {
            "@type": "Organization",
            name: primaryProperty.name,
          },
        }
      : {}),
    ...(programReviews.length > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Math.round(avgProgramRating! * 100) / 100,
            reviewCount: programReviews.length,
            bestRating: 5,
            worstRating: 1,
          },
          review: programReviews.map((r: any) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.guest_name || "Guest" },
            reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
            ...(r.text_en || r.text_ru ? { reviewBody: r.text_en || r.text_ru } : {}),
            ...(r.created_at ? { datePublished: String(r.created_at).slice(0, 10) } : {}),
          })),
        }
      : {}),
  }
  type ReviewRow = { id: string; guest_name: string | null; guest_title: string | null; country: string | null; text_en: string | null; rating: number | null; created_at: string | null }
  const reviewsForView: ProgramReview[] = (programReviews as ReviewRow[])
    .filter((r) => r.text_en)
    .map((r) => ({
      id: String(r.id),
      name: enOnly(r.guest_name) ?? "Guest",
      meta: [enOnly(r.guest_title), enOnly(r.country)].filter(Boolean).join(", ") || null,
      text: r.text_en as string,
      rating: Number(r.rating) || 5,
      date: r.created_at,
    }))
  const allPrograms = await loadPrograms()
  const related = allPrograms.filter((p) => p.id !== program.id && (primaryProperty ? p.propertyIds.includes(primaryProperty.id) : p.cohort === program.cohort))

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script dangerouslySetInnerHTML={{ __html: dataLayerScript("view_program", { program_id: program.id, program_name: program.name, property_id: primaryProperty?.id, property_name: primaryProperty?.name, destination_country: primaryProperty?.country }) }} />
      <ProgramView program={program} accommodations={accommodations} confirmedBooking={confirmedBooking} galleryImages={galleryImages} reviews={reviewsForView} related={related} />
    </>
  )
}
