import Link from "@/lib/i18n-link"
import type { Metadata } from "next"
import { supabaseCatalog as supabaseAdmin } from "@/lib/supabase-catalog" // cached public catalog reads
import { type DbProgramRow } from "../../_lib/programMapping"
import { mapProgramsResolved } from "../../_lib/programMappingResolved"
import ProgramCard from "../../_components/ProgramCard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Sanya Wellness Guide: Island Reset & TCM Culture, Hainan",
  description:
    "Plan a 6 or 10 day island reset in Sanya, Hainan: beach time, Nanshan, Yanoda rainforest and optional traditional Chinese medicine experiences. What is included and which programmes match.",
  alternates: { canonical: "/guides/sanya-wellness-guide" },
  openGraph: {
    title: "Sanya Wellness Guide: Island Reset & TCM Culture, Hainan | Dream Islands",
    description:
      "Beach, Nanshan Cultural Zone, Yanoda rainforest and optional traditional Chinese medicine experiences in Sanya, Hainan. What to expect and real matched programmes.",
    url: "https://dreamislands.org/guides/sanya-wellness-guide",
  },
}

const PHOTO_PATHS = [
  "sanya/ruijia-futai-hotel/sanya-ruijia-futai-hotel-hotel-03.jpg",
  "sanya/nanshan-cultural-zone/sanya-nanshan-cultural-zone-temple-06.jpg",
  "sanya/nanshan-cultural-zone/sanya-nanshan-cultural-zone-guanyin-statue-04.jpg",
  "sanya/yanoda-rainforest/sanya-yanoda-rainforest-hotel-02.jpg",
  "sanya/yanoda-rainforest/sanya-yanoda-rainforest-three-valley-gorge-03.jpg",
  "sanya/yanoda-rainforest/sanya-yanoda-rainforest-wetland-02.jpg",
]

const WHY = [
  "A warm-weather holiday with a wellness layer: sea, rainforest and culture, rather than a strict programme",
  "Nanshan Cultural Zone and the Yanoda rainforest give the days structure without making them long or demanding",
  "Traditional Chinese medicine is offered as an optional, voluntary menu on top of the holiday, never as the core of the trip",
  "Sanya has an international airport and a long beach season, which makes it an easy add-on to a longer China trip",
]

const WHAT_IT_INVOLVES = [
  "6 days / 5 nights in a 3-star hotel, or 10 days / 9 nights in a 4-star hotel, twin-share rooms; the exact hotel is confirmed per group",
  "Nanshan Cultural Zone and the coastline, a light Yanoda rainforest programme with breathing or nature education, and free time at the sea",
  "One day of traditional Chinese medicine culture: a basic health talk and an introduction to TCM, with light practices such as massage or moxibustion only if you choose them",
  "On the 10-day programme, Monkey Island or Lingshui, two wellness blocks and more beach rest",
  "Breakfast and the meals listed in the programme, local transport, a guide, first entrance tickets and travel insurance. Optional add-ons are paid separately: a physician consultation, acupuncture, moxibustion, massage, cupping, scraping or herbal baths",
]

const SEASON = [
  "Peak island season, Chinese New Year and the October national holiday are repriced individually",
  "Quotes are based on groups from 10 paying guests; smaller groups and single rooms are priced on request",
  "Medicated meals are not included in the base price and are quoted by menu and group size",
]

const DESTINATION_SLUGS = ["sanya-island-tcm-wellness"]

const FAQS = [
  {
    q: "What is a Sanya wellness programme with Dream Islands?",
    a: "A 6 or 10 day island reset in Sanya, Hainan. It combines beach time, Nanshan Cultural Zone, the Yanoda rainforest and an optional menu of traditional Chinese medicine experiences. It is a tourism and wellness programme, not a clinical one, and is operated by Xi’an Overseas Tourism Co., Ltd.",
  },
  {
    q: "Are the traditional Chinese medicine treatments part of the trip?",
    a: "The base programme includes a TCM culture talk and a basic health conversation. Treatments such as massage, moxibustion, cupping or acupuncture are optional extras. Anything involving the body or needles is assessed on site by a licensed provider and requires your informed consent.",
  },
  {
    q: "How long is the stay and what is included?",
    a: "6 days / 5 nights or 10 days / 9 nights. Included: hotel with breakfast, programme meals, local transport, a guide, first entrance tickets for the listed sights, a basic TCM culture session and travel insurance. See the programme page for the exact schedule.",
  },
  {
    q: "Who is it for, and who is it not for?",
    a: "It suits guests who want a beach holiday with some culture and light wellness. It is not a medical programme and does not replace diagnosis or treatment. If you have a medical condition, speak to your doctor before choosing any treatment.",
  },
  {
    q: "When is the best time to go?",
    a: "Sanya is warm most of the year. Peak season, Chinese New Year and the October holiday are priced separately, so ask for dates before comparing prices.",
  },
  {
    q: "Can I book directly?",
    a: "Programmes are confirmed on request. Dates, room type and availability are checked for every booking, and the final price is recalculated by date, group size, hotel category and the options you choose.",
  },
]

export default async function SanyaGuidePage() {
  const [{ data: rows }, { data: photoRows }] = await Promise.all([
    supabaseAdmin
      .from("programs")
      .select(
        "id, name, slug, summary, cohort, tier, duration_days, price_usd, outcomes, is_composite, hero_image_url, " +
          "program_properties(role, properties(id, name, island, country, contact_wa)), " +
          "program_variants(duration_days, duration_nights, price_basic_usd, price_vip_usd, active)",
      )
      .in("slug", DESTINATION_SLUGS)
      .eq("active", true)
      .eq("status", "published"),
    supabaseAdmin
      .from("media_assets")
      .select("path, public_url, alt_en")
      .eq("bucket", "properties")
      .eq("active", true)
      .in("path", PHOTO_PATHS),
  ])

  const programs = await mapProgramsResolved((rows ?? []) as unknown as DbProgramRow[])
  const bySlug = new Map(programs.map((p) => [p.slug, p]))
  const matched = DESTINATION_SLUGS.map((s) => bySlug.get(s)).filter((p): p is NonNullable<typeof p> => !!p)

  const photoByPath = new Map((photoRows ?? []).map((r: { path: string; public_url: string | null; alt_en: string | null }) => [r.path, r]))
  const photos = PHOTO_PATHS.map((p) => photoByPath.get(p)).filter((r): r is NonNullable<typeof r> => !!r && !!r.public_url)

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Guides", item: "https://dreamislands.org/guides" },
      { "@type": "ListItem", position: 2, name: "Sanya Wellness Guide", item: "https://dreamislands.org/guides/sanya-wellness-guide" },
    ],
  }

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Destination guide · China</div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 8vw, 60px)", margin: "0 0 20px", color: "var(--ink)", maxWidth: 900 }}>
          Wellness travel in <span className="display-italic">Sanya</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          A warm island reset on Hainan: sea, rainforest, Nanshan and an optional menu of traditional Chinese medicine
          experiences. Here is how a stay is built, what is included and which real programme matches.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <Link href="/start" className="btn btn-primary btn-lg">
            Get your WS →
          </Link>
          <Link href="/programs/sanya-island-tcm-wellness" className="btn btn-ghost btn-lg">
            See the programme
          </Link>
        </div>
      </section>

      {photos.length > 0 && (
        <section className="shell" style={{ paddingTop: 40 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {photos.map((ph) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={ph.path}
                src={ph.public_url as string}
                alt={ph.alt_en ?? "Sanya, Hainan"}
                loading="lazy"
                style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: 14 }}
              />
            ))}
          </div>
        </section>
      )}

      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Why Sanya specifically</h2>
          <ul style={{ margin: "16px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {WHY.map((s) => (
              <li key={s} style={{ display: "flex", gap: 10 }}>
                <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--accent)", marginTop: 8 }} />
                <span className="body-sm">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>What a Sanya programme involves</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {WHAT_IT_INVOLVES.map((c) => (
              <li key={c} className="body-sm" style={{ display: "flex", gap: 10 }}>
                <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--accent)", marginTop: 8 }} />
                {c}
              </li>
            ))}
          </ul>
          <p className="body-sm" style={{ marginTop: 14, color: "var(--ink-3)", fontStyle: "italic" }}>
            A tourism and wellness programme, not a medical one. It does not replace diagnosis or treatment. Dream
            Islands is a Destination Marketing Organization, not a medical institution.
          </p>
        </div>
      </section>

      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>Season and booking basics</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {SEASON.map((c) => (
              <li key={c} className="body-sm" style={{ display: "flex", gap: 10 }}>
                <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--accent)", marginTop: 8 }} />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {matched.length > 0 && (
        <section className="shell" style={{ paddingTop: 56 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Real matched programme</div>
              <h2>Plan your <span className="display-italic">stay</span>.</h2>
            </div>
          </div>
          <div className="rail">
            {matched.map((p) => (
              <ProgramCard key={p.id} program={p} variant="rail" />
            ))}
          </div>
        </section>
      )}

      <section className="shell" style={{ paddingTop: 56 }}>
        <div
          className="card"
          style={{ padding: "36px 28px", background: "var(--accent)", color: "var(--accent-ink)", border: 0 }}
        >
          <div className="eyebrow" style={{ color: "rgba(255,255,255,.7)" }}>Not sure which one fits?</div>
          <p className="display" style={{ fontSize: "clamp(24px, 5vw, 36px)", margin: "12px 0 20px", maxWidth: 560 }}>
            <span className="display-italic">Free WS</span>, matched programme, real humans on WhatsApp.
          </p>
          <Link href="/start" className="btn" style={{ background: "var(--accent-ink)", color: "var(--accent-deep)" }}>
            Get your WS →
          </Link>
        </div>
      </section>

      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Frequently asked</div>
            <h2>Before you <span className="display-italic">book</span>.</h2>
          </div>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {FAQS.map((f) => (
            <details key={f.q} className="card" style={{ padding: "16px 20px" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 15, color: "var(--ink)", listStyle: "none" }}>
                {f.q}
              </summary>
              <p className="body-sm" style={{ margin: "10px 0 0" }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
