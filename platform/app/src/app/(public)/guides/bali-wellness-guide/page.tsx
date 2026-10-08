import Link from "next/link"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import { mapProgram, type DbProgramRow } from "../../_lib/programMapping"
import ProgramCard from "../../_components/ProgramCard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Wellness Travel Guide: Bali",
  description:
    "A practical guide to wellness travel in Bali — yoga and emotional-reset retreats at Udara Bali, fasting and creative-clarity retreats at Mokka Bali, what each actually involves, typical duration and price, and real matched programs.",
  alternates: { canonical: "/guides/bali-wellness-guide" },
  openGraph: {
    title: "Wellness Travel Guide: Bali | Dream Islands",
    description:
      "Yoga, emotional reset and fasting retreats in Bali — what to expect, programme types, duration, price and real matched programs.",
    url: "https://dreamislands.org/guides/bali-wellness-guide",
  },
}

const WHY_BALI = [
  "Bali is Asia's most established yoga and wellness destination — a deep bench of specialized studios and retreat centers, not a hotel with a spa bolted on",
  "Two genuinely different formats live here: Udara Bali's yoga-and-emotional-reset track, and Mokka Bali's fasting-and-creative-clarity track",
  "A real range of length — from a 5-day reset for frequent flyers to a 14-day deep burnout recovery",
  "Every Bali programme sits under Dream Islands' Mind Balance track — built around emotional and nervous-system reset rather than clinical protocols",
]

const WHAT_IT_INVOLVES = [
  "At Udara Bali: daily yoga (Hatha, Vinyasa, Yin or aerial depending on programme), sound healing, water healing, sauna and steam, and plant-based detox nutrition",
  "At Mokka Bali: structured intermittent or extended fasting, daily meditation, and an art or jewellery immersion led by local creative partners",
  "No clinical or medical component on either property — these are yoga- and mindfulness-based resets, not medically supervised protocols",
  "A communal, retreat-style format rather than private clinical check-ins",
]

type ProgrammeType = {
  name: string
  bestFor: string
  duration: string
  price: string
}

const PROGRAMME_TYPES: ProgrammeType[] = [
  {
    name: "Yoga Detox 5D (Udara Bali)",
    bestFor: "Frequent flyers wanting a quick, focused reset",
    duration: "5 days",
    price: "$675",
  },
  {
    name: "Yoga Detox 10D (Udara Bali)",
    bestFor: "A deeper Ayurvedic nutrition layer and a full body-mind cleanse",
    duration: "10 days",
    price: "$1,300",
  },
  {
    name: "Emotional Reset 7D (Udara Bali)",
    bestFor: "Sound healing and daily meditation for a focused emotional reset",
    duration: "7 days",
    price: "$910",
  },
  {
    name: "Emotional Reset 14D (Udara Bali)",
    bestFor: "Long-term burnout recovery, with aerial yoga and full spa access",
    duration: "14 days",
    price: "$1,750",
  },
  {
    name: "Fasting & Clarity 7D (Mokka Bali)",
    bestFor: "Structured fasting and meditation aimed at mental clarity",
    duration: "7 days",
    price: "$805",
  },
  {
    name: "Creative Reset 10D (Mokka Bali)",
    bestFor: "Creatives and founders wanting fasting plus an art immersion",
    duration: "10 days",
    price: "$1,200",
  },
]

const UDARA_SLUGS = [
  "udara-bali-yoga-detox-spa-yoga-detox-5d",
  "udara-bali-yoga-detox-spa-yoga-detox-10d",
  "udara-bali-yoga-detox-spa-emotional-reset-7d",
  "udara-bali-yoga-detox-spa-emotional-reset-14d",
]

const MOKKA_SLUGS = ["mokka-bali-fasting-clarity-7d", "mokka-bali-creative-reset-10d"]

const DESTINATION_SLUGS = [...UDARA_SLUGS, ...MOKKA_SLUGS]

const FAQS = [
  {
    q: "Should I choose Udara Bali or Mokka Bali?",
    a: "Udara Bali is a movement-based reset — daily yoga, sound healing and detox nutrition, best if you want to stay active. Mokka Bali is built around fasting and stillness, paired with an art or jewellery immersion, best if you want mental clarity and a creative reset rather than a physical practice.",
  },
  {
    q: "Is the fasting at Mokka Bali medically supervised?",
    a: "It's structured — intermittent or extended fasting with guided meditation — but it is not a medically supervised clinical protocol. Please disclose any medical conditions, medications or pregnancy at booking so we can advise whether the programme is a good fit.",
  },
  {
    q: "What's the difference between the 7-day and 14-day Emotional Reset?",
    a: "The 7-day version is a focused reset — daily yoga, sound healing, water healing. The 14-day version goes deeper, adding aerial yoga, full spa access and communal reflection, and is aimed at longer-term burnout recovery rather than a short reset.",
  },
  {
    q: "Are these programs a substitute for ongoing medical or psychiatric care?",
    a: "No. The yoga, fasting and meditation programmes in Bali are a structured wellness reset, not medical treatment or diagnosis. Dream Islands is a Destination Marketing Organization, not a medical institution, and this is not medical advice.",
  },
]

export default async function BaliDestinationGuidePage() {
  const { data: rows } = await supabaseAdmin
    .from("programs")
    .select(
      "id, name, slug, summary, cohort, tier, duration_days, price_usd, outcomes, is_composite, hero_image_url, " +
        "program_properties(role, properties(id, name, island, country, contact_wa)), " +
        "program_variants(duration_days, duration_nights, price_basic_usd, price_vip_usd, active)",
    )
    .in("slug", DESTINATION_SLUGS)
    .eq("active", true)
    .eq("status", "published")

  const programs = ((rows ?? []) as unknown as DbProgramRow[]).map(mapProgram)
  const bySlug = new Map(programs.map((p) => [p.slug, p]))
  const udaraPrograms = UDARA_SLUGS.map((s) => bySlug.get(s)).filter((p): p is NonNullable<typeof p> => !!p)
  const mokkaPrograms = MOKKA_SLUGS.map((s) => bySlug.get(s)).filter((p): p is NonNullable<typeof p> => !!p)

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* HERO */}
      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Destination guide · Indonesia</div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 8vw, 60px)", margin: "0 0 20px", color: "var(--ink)", maxWidth: 900 }}>
          Wellness travel in <span className="display-italic">Bali</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          Yoga and emotional reset at Udara Bali, fasting and creative clarity at Mokka Bali. Here's what each
          actually involves and which real programs match.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <Link href="/start" className="btn btn-primary btn-lg">
            Get your WS →
          </Link>
          <Link href="/tracks/mind-balance" className="btn btn-ghost btn-lg">
            Browse Mind Balance programs
          </Link>
        </div>
      </section>

      {/* WHY BALI */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Why Bali specifically</h2>
          <ul style={{ margin: "16px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {WHY_BALI.map((s) => (
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
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>What a Bali program actually involves</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {WHAT_IT_INVOLVES.map((c) => (
              <li key={c} className="body-sm" style={{ display: "flex", gap: 10 }}>
                <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--accent)", marginTop: 8 }} />
                {c}
              </li>
            ))}
          </ul>
          <p className="body-sm" style={{ marginTop: 14, color: "var(--ink-3)", fontStyle: "italic" }}>
            Dream Islands is a Destination Marketing Organization promoting wellness travel — not a medical
            institution. This is not medical advice.
          </p>
        </div>
      </section>

      {/* PROGRAMME TYPES TABLE */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>All Bali programs</div>
            <h2>Comparing your <span className="display-italic">options</span>.</h2>
          </div>
        </div>
        <div className="card" style={{ padding: 0, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 560 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
                {["Programme", "Best for", "Duration", "Price"].map((h) => (
                  <th key={h} style={{ padding: "14px 16px", color: "var(--ink-2)", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PROGRAMME_TYPES.map((t) => (
                <tr key={t.name} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 600, color: "var(--ink)" }}>{t.name}</td>
                  <td style={{ padding: "14px 16px", color: "var(--ink-2)" }}>{t.bestFor}</td>
                  <td style={{ padding: "14px 16px" }}>{t.duration}</td>
                  <td style={{ padding: "14px 16px" }}>{t.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* UDARA BALI PROGRAMS */}
      {udaraPrograms.length > 0 && (
        <section className="shell" style={{ paddingTop: 56 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Real matched programs</div>
              <h2>Actual Udara Bali <span className="display-italic">programs</span>.</h2>
            </div>
          </div>
          <div className="rail">
            {udaraPrograms.map((p) => (
              <ProgramCard key={p.id} program={p} variant="rail" />
            ))}
          </div>
        </section>
      )}

      {/* MOKKA BALI PROGRAMS */}
      {mokkaPrograms.length > 0 && (
        <section className="shell" style={{ paddingTop: 56 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Real matched programs</div>
              <h2>Actual Mokka Bali <span className="display-italic">programs</span>.</h2>
            </div>
          </div>
          <div className="rail">
            {mokkaPrograms.map((p) => (
              <ProgramCard key={p.id} program={p} variant="rail" />
            ))}
          </div>
        </section>
      )}

      {/* WHICH ONE */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div
          className="card"
          style={{
            padding: "36px 28px",
            background: "var(--accent)",
            color: "var(--accent-ink)",
            border: 0,
          }}
        >
          <div className="eyebrow" style={{ color: "rgba(255,255,255,.7)" }}>Not sure which one fits?</div>
          <p className="display" style={{ fontSize: "clamp(24px, 5vw, 36px)", margin: "12px 0 20px", maxWidth: 560 }}>
            <span className="display-italic">Free WS</span>, matched program, real humans on WhatsApp.
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
