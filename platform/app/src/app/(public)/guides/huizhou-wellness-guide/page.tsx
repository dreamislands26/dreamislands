import Link from "@/lib/i18n-link"
import type { Metadata } from "next"
import { supabaseCatalog as supabaseAdmin } from "@/lib/supabase-catalog" // cached public catalog reads
import { type DbProgramRow } from "../../_lib/programMapping"
import { mapProgramsResolved } from "../../_lib/programMappingResolved"
import ProgramCard from "../../_components/ProgramCard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Huizhou Wellness Guide: Lakeside Reset in Guangdong",
  description:
    "Plan a 6 day lakeside reset in Huizhou, Guangdong: morning Taiji and Baduanjin, West Lake, Lingnan culture, tea and a mugwort workshop. Easy to join from Guangzhou or Shenzhen.",
  alternates: { canonical: "/guides/huizhou-wellness-guide" },
  openGraph: {
    title: "Huizhou Wellness Guide: Lakeside Reset in Guangdong | Dream Islands",
    description:
      "Morning practice by West Lake, Lingnan culture, tea ceremony and a mugwort workshop in Huizhou, Guangdong. What to expect and real matched programmes.",
    url: "https://dreamislands.org/guides/huizhou-wellness-guide",
  },
}

const PHOTO_PATHS = [
  "huizhou/wellness-tour/04-huizhou-china-group-morning-wellness-exercise.jpg",
  "huizhou/wellness-tour/35-huizhou-china-group-tea-ceremony.jpg",
  "huizhou/wellness-tour/24-huizhou-guangdong-china-wellness-room-singing-bowls.jpg",
  "huizhou/tcm-clinic/huizhou-wormwood-hammer-class-setup-02.webp",
  "huizhou/tcm-clinic/huizhou-finished-wormwood-massage-hammer-14.webp",
  "huizhou/wellness-tour/39-huizhou-guangdong-group-meditation-tea-ceremony.jpg",
]

const WHY = [
  "A short, slow-paced trip that connects easily with Guangzhou or Shenzhen, with no long internal flights",
  "A lakeside setting with daily morning practice rather than a packed sightseeing schedule",
  "Lingnan culture is hands-on: tea, a mugwort workshop and local craft sessions led by local hosts",
  "Run for Russian-speaking groups, with a Russian-speaking guide arranged from Guangzhou",
]

const WHAT_IT_INVOLVES = [
  "6 days / 5 nights in a 4-star hotel in Huizhou (Jinyuan International or an equivalent), twin-share rooms",
  "Morning practice by the lake: Baduanjin, Taiji or a meditation basics class, plus Huizhou West Lake and the old town",
  "A coastal nature day with light walking and rest by the sea",
  "A culture day: mugwort and herbal craft, a Song-style tea ceremony or another local session, with optional treatments in the afternoon",
  "5 breakfasts and 9 main meals, transport, a Russian-speaking guide, sights and travel insurance. Optional add-ons are paid separately: massage, moxibustion, carbonated-spring bath, head relaxation, hydrogen capsule, spine adjustment and herbal-diet dinners",
]

const SEASON = [
  "The Russian-speaking guide is usually arranged from Guangzhou, so the final price depends on dates and guide availability",
  "Quotes are based on Russian-language groups from 10 paying guests; smaller groups and single rooms are priced on request",
  "Chinese public holidays are repriced individually",
]

const DESTINATION_SLUGS = ["huizhou-lingnan-lakeside-wellness"]

const FAQS = [
  {
    q: "What is a Huizhou wellness programme with Dream Islands?",
    a: "A 6 day lakeside reset in Huizhou, Guangdong. It combines morning practice, Lingnan culture, tea and a coastal day, and is built for guests connecting through Guangzhou or Shenzhen. It is a tourism and wellness programme, not a clinical one, and is operated by Xi’an Overseas Tourism Co., Ltd.",
  },
  {
    q: "How long is the stay and what is included?",
    a: "6 days / 5 nights. Included: 4-star hotel, 5 breakfasts and 9 main meals, transport, a Russian-speaking guide, three half-day wellness modules, two culture experiences, sights and travel insurance. Treatments and special diet meals are optional extras. See the programme page for the exact schedule.",
  },
  {
    q: "What is the mugwort workshop?",
    a: "A hands-on craft session where guests assemble a mugwort massage tool and learn about the plant from a local instructor. It is a cultural activity. Any hands-on treatment is optional and is assessed on site by a licensed provider with your informed consent.",
  },
  {
    q: "Who is it for, and who is it not for?",
    a: "It suits guests who want a short, calm trip with gentle movement and culture. It is not a medical programme and does not replace diagnosis or treatment. If you have a medical condition, speak to your doctor before choosing any treatment.",
  },
  {
    q: "How do I get to Huizhou?",
    a: "Guests are met in Guangzhou or Shenzhen and transferred to Huizhou, and taken back to the airport or station at the end. Flights into China are not included.",
  },
  {
    q: "Can I book directly?",
    a: "Programmes are confirmed on request. Dates, room type and availability are checked for every booking, and the final price is recalculated by date, group size and the options you choose.",
  },
]

export default async function HuizhouGuidePage() {
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
      { "@type": "ListItem", position: 2, name: "Huizhou Wellness Guide", item: "https://dreamislands.org/guides/huizhou-wellness-guide" },
    ],
  }

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Destination guide · China</div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 8vw, 60px)", margin: "0 0 20px", color: "var(--ink)", maxWidth: 900 }}>
          Wellness travel in <span className="display-italic">Huizhou</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          A calm lakeside reset in Guangdong: morning practice, Lingnan culture, tea and a coastal day, easy to join
          from Guangzhou or Shenzhen. Here is how a stay is built, what is included and which real programme matches.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <Link href="/start" className="btn btn-primary btn-lg">
            Get your WS →
          </Link>
          <Link href="/programs/huizhou-lingnan-lakeside-wellness" className="btn btn-ghost btn-lg">
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
                alt={ph.alt_en ?? "Huizhou, Guangdong"}
                loading="lazy"
                style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: 14 }}
              />
            ))}
          </div>
        </section>
      )}

      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Why Huizhou specifically</h2>
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
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>What a Huizhou programme involves</h2>
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
