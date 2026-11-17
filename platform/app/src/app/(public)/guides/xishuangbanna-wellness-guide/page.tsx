import Link from "@/lib/i18n-link"
import type { Metadata } from "next"
import { supabaseCatalog as supabaseAdmin } from "@/lib/supabase-catalog" // cached public catalog reads
import { type DbProgramRow } from "../../_lib/programMapping"
import { mapProgramsResolved } from "../../_lib/programMappingResolved"
import ProgramCard from "../../_components/ProgramCard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Xishuangbanna Wellness Guide: Hot Springs & Dai Culture",
  description:
    "Tropical Yunnan wellness in Xishuangbanna: open-air hot springs, Dai culture, botanical garden and Wild Elephant Valley. How to plan it, what is included and which programmes match.",
  alternates: { canonical: "/guides/xishuangbanna-wellness-guide" },
  openGraph: {
    title: "Xishuangbanna Wellness Guide: Hot Springs & Dai Culture | Dream Islands",
    description:
      "Open-air hot springs, Dai culture, tropical botanical garden and Wild Elephant Valley in Xishuangbanna, Yunnan. What to expect, what is included and real matched programmes.",
    url: "https://dreamislands.org/guides/xishuangbanna-wellness-guide",
  },
}

const PHOTO_PATHS = [
  "yunnan/wyndham-jinghong/wyndham-jinghong-resort-pool-and-main-building-xishuangbanna-yunnan-01.png",
  "yunnan/xishuangbanna/yunnan-xishuangbanna-botanical-garden-palms-pond-01-2560.jpg",
  "yunnan/xishuangbanna/yunnan-xishuangbanna-rainforest-giant-tree-roots-04.png",
  "yunnan/xishuangbanna/yunnan-xishuangbanna-botanical-garden-giant-water-lilies-08.jpg",
  "yunnan/wyndham-jinghong/wyndham-jinghong-resort-pool-mountains-xishuangbanna-yunnan-04.png",
  "yunnan/xishuangbanna/yunnan-xishuangbanna-wild-elephant-valley-aerial-walkway-02-2560.jpg",
]

const WHY_XISHUANGBANNA = [
  "A warm, green contrast to northern China: tropical rainforest, palm gardens and a slow resort rhythm in Jinghong, in the far south of Yunnan",
  "Open-air hot-spring bathing and the resort's own leisure facilities set the baseline of each stay: a relaxed pace rather than a packed itinerary",
  "Dai culture is part of the programme, not a side trip: village visits, tea, music, aroma and handicraft sessions led by local hosts",
  "Gentle, low-intensity days suit a first China trip, couples, families and groups who want nature and culture without a demanding schedule",
]

const WHAT_IT_INVOLVES = [
  "3 or 5 days based at a resort in Jinghong (Wyndham Jinghong Resort or an equivalent 5-star, subject to availability), twin-share rooms",
  "Open-air hot springs and the hotel's public leisure facilities, morning stretching and free time",
  "A Dai culture day: a village or heritage visit plus a tea, music, aroma or crafts session",
  "On the 5-day programme, one nature-education day: the Tropical Botanical Garden, a rainforest trail or Wild Elephant Valley",
  "Local transport, programme meals, a guide and travel insurance. Optional add-ons are paid separately: an English-language botanical garden tour, Dai Park with the water-splashing experience, Wild Elephant Valley, and Dai heritage sessions",
]

type Experience = { name: string; note: string }

const EXPERIENCES: Experience[] = [
  { name: "Dai tea ritual", note: "A slow tea session in the Dai tradition. A relaxation practice, not a treatment." },
  { name: "Dai music experience", note: "Live instruments and singing in a small group setting." },
  { name: "Dai “Nine Senses” evening ritual", note: "A calm evening session built around sound, scent and touch." },
  { name: "Dai rainforest aroma experience", note: "Plant scents and herbal aromas of the tropical forest." },
  { name: "Palm-leaf manuscript blessing ritual", note: "A cultural ceremony based on traditional Dai palm-leaf scripts." },
]

const DESTINATION_SLUGS = ["xishuangbanna-hotsprings-dai-wellness", "puer-xishuangbanna-combined-journey"]

const FAQS = [
  {
    q: "What is a Xishuangbanna wellness programme with Dream Islands?",
    a: "A 3 to 5 day nature and culture trip based in Jinghong, in tropical southern Yunnan. It combines open-air hot springs, Dai cultural experiences and gentle time in nature. It is a cultural and leisure programme, not a clinical one, and is operated by Xi’an Overseas Tourism Co., Ltd.",
  },
  {
    q: "How long are the programmes and what is included?",
    a: "The Xishuangbanna programme runs 3 or 5 days. The combined Pu’er and Xishuangbanna route runs 7 to 10 days. Included: hotel, programme meals, local transport, a guide, entrance fees listed on the programme page and travel insurance. Extras such as Wild Elephant Valley or a botanical garden tour with an English guide are optional add-ons. See the programme page for the exact schedule.",
  },
  {
    q: "Will I see wild elephants in Wild Elephant Valley?",
    a: "Wild Elephant Valley is a nature reserve and forest walkway. We cannot promise an elephant sighting: it depends on conditions and season.",
  },
  {
    q: "Who is it for, and who is it not for?",
    a: "It suits guests who want a calm reset, a first trip to China, or nature and culture without a hard schedule. It is not a medical programme and does not replace diagnosis or treatment. Hot-spring bathing: speak to your doctor first if you have a cardiovascular condition, are pregnant or are sensitive to heat.",
  },
  {
    q: "Xishuangbanna or Pu’er: how do they differ?",
    a: "Pu’er is cooler and quieter: forest, tea hills and slow mornings. Xishuangbanna is warmer and tropical: hot springs, palm gardens and Dai heritage. The combined route covers both.",
  },
  {
    q: "Can I book directly, and when is the best time to go?",
    a: "Programmes are confirmed on request: dates, room type and availability are checked for every booking. Prices are recalculated around the Dai New Year (water-splashing festival) and Chinese public holidays.",
  },
]

export default async function XishuangbannaGuidePage() {
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
        name: "Xishuangbanna Wellness Guide",
        item: "https://dreamislands.org/guides/xishuangbanna-wellness-guide",
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
          Wellness travel in <span className="display-italic">Xishuangbanna</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          Tropical Yunnan at an easy pace: open-air hot springs, Dai culture, a botanical garden and Wild Elephant
          Valley. Here is how a stay is built, what is included and which real programmes match.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <Link href="/start" className="btn btn-primary btn-lg">
            Get your WS →
          </Link>
          <Link href="/programs/xishuangbanna-hotsprings-dai-wellness" className="btn btn-ghost btn-lg">
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
                alt={ph.alt_en ?? "Xishuangbanna, Yunnan"}
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
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Why Xishuangbanna specifically</h2>
          <ul style={{ margin: "16px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {WHY_XISHUANGBANNA.map((s) => (
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
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>What a Xishuangbanna programme involves</h2>
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

      {/* DAI EXPERIENCES */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Culture</div>
            <h2>Dai <span className="display-italic">experiences</span>.</h2>
          </div>
        </div>
        <div className="card" style={{ padding: 28 }}>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
            {EXPERIENCES.map((e) => (
              <li key={e.name} className="body-sm" style={{ display: "flex", gap: 10 }}>
                <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--accent)", marginTop: 8 }} />
                <span>
                  <strong style={{ color: "var(--ink)" }}>{e.name}.</strong> {e.note}
                </span>
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
