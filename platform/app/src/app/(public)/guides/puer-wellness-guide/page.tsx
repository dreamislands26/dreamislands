import Link from "@/lib/i18n-link"
import type { Metadata } from "next"
import { supabaseCatalog as supabaseAdmin } from "@/lib/supabase-catalog" // cached public catalog reads
import { type DbProgramRow } from "../../_lib/programMapping"
import { mapProgramsResolved } from "../../_lib/programMappingResolved"
import ProgramCard from "../../_components/ProgramCard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Pu'er Wellness Retreat Guide: Forest & Tea, Yunnan",
  description:
    "Plan a Pu'er wellness stay in Yunnan: tea plantations, forest trails, slow mornings and breathwork. Programs, season and how to book.",
  alternates: { canonical: "/guides/puer-wellness-guide" },
  openGraph: {
    title: "Pu'er Wellness Retreat Guide: Forest & Tea, Yunnan | Dream Islands",
    description:
      "Forest trails, tea hills and slow mornings in Pu'er, Yunnan. What a 3 or 5 day stay involves, what is included and real matched programmes.",
    url: "https://dreamislands.org/guides/puer-wellness-guide",
  },
}

const PHOTO_PATHS = [
  "yunnan/puer/yunnan-puer-forest-base-aerial-lake-01.png",
  "yunnan/puer/yunnan-puer-forest-base-lake-pines-03.png",
  "yunnan/puer/yunnan-puer-forest-base-wooden-cabin-05.png",
  "yunnan/puer/yunnan-puer-forest-base-aerial-valley-02.png",
  "yunnan/puer/yunnan-puer-forest-base-wooden-room-08.png",
  "yunnan/puer/yunnan-puer-forest-base-terrace-table-09.png",
]

const WHY_PUER = [
  "Forest and tea hills in one place: a cooler, quieter side of Yunnan built around green space rather than sightseeing",
  "Pu'er is the home of Pu'er tea, so the tea plantation visit and tea-making are part of the local culture, not an add-on",
  "Low-intensity days: forest walks, breathing practice in the morning and tea in the afternoon",
  "A small forest base with wooden lodges and a lake, well suited to groups who want calm and fresh air",
]

const WHAT_IT_INVOLVES = [
  "3 days / 2 nights or 5 days / 4 nights at the Pu'er forest base (APFNet) or an equivalent 4-star hotel, twin-share rooms",
  "Arrival, a light forest walk and a welcome tea session on day one",
  "Morning breathing practice, a tea hill visit and an introduction to how Pu'er tea is made, with optional tea picking or pressing in season",
  "On the 5-day programme, a deeper nature day: a rainforest trail, a coffee farm or a medicinal-plant base",
  "Local transport, programme meals, a guide and travel insurance. Optional add-ons are paid separately: tea picking and making, a tea cake to take home, rainforest trekking, a coffee pour-over session and light traditional-medicine experiences",
]

const SEASON = [
  "Tea picking usually runs from March to December, depending on plantation opening and the weather",
  "Prices are recalculated for Chinese public holidays and peak dates",
  "Quotes are based on groups from 10 paying guests; smaller groups and single rooms are priced on request",
]

const DESTINATION_SLUGS = ["puer-forest-tea-wellness", "puer-xishuangbanna-combined-journey"]

const FAQS = [
  {
    q: "What is a Pu'er wellness programme with Dream Islands?",
    a: "A 3 or 5 day forest and tea-culture stay in Pu'er, southern Yunnan. It combines forest walks, breathing practice, tea plantation visits and quiet time at a forest base. It is a tourism and wellness programme, not a clinical one, and is operated by Xi’an Overseas Tourism Co., Ltd.",
  },
  {
    q: "How long is the stay and what is included?",
    a: "The Pu'er programme runs 3 days / 2 nights or 5 days / 4 nights. Included: forest-base or equivalent 4-star accommodation, programme meals, local transport, a guide, basic activities and travel insurance. Tea picking, rainforest trekking and similar activities are optional add-ons. See the programme page for the exact schedule.",
  },
  {
    q: "When is the best time to visit Pu'er?",
    a: "Tea picking is usually possible from March to December, depending on plantation opening. Exact activities are confirmed against your dates.",
  },
  {
    q: "Who is it for, and who is it not for?",
    a: "It suits guests who want slow mornings, fresh air, nature and tea culture without a demanding schedule. It is not a medical programme and does not replace diagnosis or treatment. Light traditional-medicine experiences, where offered, are assessed on site by a licensed provider with informed consent.",
  },
  {
    q: "Pu'er or Xishuangbanna: how do they differ?",
    a: "Pu'er is cooler and quieter: forest, tea hills and slow mornings. Xishuangbanna is warmer and tropical: hot springs, palm gardens and Dai heritage. A combined 7 to 10 day route covers both.",
  },
  {
    q: "Can I book directly?",
    a: "Programmes are confirmed on request. Dates, room type and availability are checked for every booking, and the final price is recalculated by date, group size, room type and the activities you choose.",
  },
]

export default async function PuerGuidePage() {
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
      {
        "@type": "ListItem",
        position: 2,
        name: "Pu'er Wellness Guide",
        item: "https://dreamislands.org/guides/puer-wellness-guide",
      },
    ],
  }

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* HERO */}
      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Destination guide · China</div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 8vw, 60px)", margin: "0 0 20px", color: "var(--ink)", maxWidth: 900 }}>
          Wellness travel in <span className="display-italic">Pu&apos;er</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          Forest, tea hills and slow mornings in southern Yunnan. Here is how a stay is built, what is included and
          which real programmes match.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <Link href="/start" className="btn btn-primary btn-lg">
            Get your WS →
          </Link>
          <Link href="/programs/puer-forest-tea-wellness" className="btn btn-ghost btn-lg">
            See the programme
          </Link>
        </div>
      </section>

      {/* PHOTOS */}
      {photos.length > 0 && (
        <section className="shell" style={{ paddingTop: 40 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {photos.map((ph) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={ph.path}
                src={ph.public_url as string}
                alt={ph.alt_en ?? "Pu'er, Yunnan"}
                loading="lazy"
                style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: 14 }}
              />
            ))}
          </div>
        </section>
      )}

      {/* WHY */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Why Pu&apos;er specifically</h2>
          <ul style={{ margin: "16px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {WHY_PUER.map((s) => (
              <li key={s} style={{ display: "flex", gap: 10 }}>
                <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--accent)", marginTop: 8 }} />
                <span className="body-sm">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* WHAT IT INVOLVES */}
      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>What a Pu&apos;er programme involves</h2>
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

      {/* SEASON */}
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

      {/* MATCHED PROGRAMMES */}
      {matched.length > 0 && (
        <section className="shell" style={{ paddingTop: 56 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Real matched programmes</div>
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

      {/* CTA */}
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

      {/* FAQ */}
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
