import Link from "next/link"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import { mapProgram, type DbProgramRow } from "../../_lib/programMapping"
import ProgramCard from "../../_components/ProgramCard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Wellness Travel Guide: Wudang Mountain, China",
  description:
    "A practical guide to wellness travel in Wudang Mountain, China — Taiji, Qigong and TCM programs at a UNESCO World Heritage Daoist mountain, what a program actually involves, typical duration and price, and real matched programs.",
  alternates: { canonical: "/guides/wudang-mountain-wellness-guide" },
  openGraph: {
    title: "Wellness Travel Guide: Wudang Mountain, China | Dream Islands",
    description:
      "Taiji, Qigong and TCM programs at a UNESCO World Heritage Daoist mountain — what to expect, programme types, duration, price and real matched programs.",
    url: "https://dreamislands.org/guides/wudang-mountain-wellness-guide",
  },
}

const WHY_WUDANG = [
  "A UNESCO World Heritage Site in Hubei Province, China, and one of the country's most important centers of Daoist culture",
  "The birthplace of Wudang-style internal martial arts, including the lineage that Tai Chi (Taijiquan) traces back to",
  "A working monastic complex, not a recreated tourist set — temples, monks and daily Daoist practice are still active on the mountain",
  "A genuinely quiet, low-stimulation environment — most programs include a digital-detox or no-devices component built around that",
]

const WHAT_IT_INVOLVES = [
  "Daily Taiji and Qigong instruction, often from teachers trained within the mountain's own lineage",
  "TCM diagnosis and treatment — pulse and tongue reading, herbal protocols, cupping or acupuncture depending on the program",
  "Temple visits and, in longer programs, direct exposure to the mountain's monastic community",
  "In several programs, a structured digital detox or no-devices protocol as part of the daily schedule",
  "For the most advanced program, private teacher guidance in inner alchemy (nei gong) rather than group classes",
]

type ProgrammeType = {
  name: string
  bestFor: string
  duration: string
  price: string
}

const PROGRAMME_TYPES: ProgrammeType[] = [
  {
    name: "3-Day Mind Reset",
    bestFor: "First-timers wanting a low-commitment introduction to Daoist practice",
    duration: "3 days",
    price: "from $650",
  },
  {
    name: "5-Day Dao Wellness",
    bestFor: "Daily Taiji and Qigong with TCM treatment and temple tours",
    duration: "5 days",
    price: "from $1,200",
  },
  {
    name: "Executive Burnout Recovery",
    bestFor: "A structured protocol combining digital detox, coaching, Qigong and TCM diagnosis",
    duration: "5 days",
    price: "from $2,000",
  },
  {
    name: "7-Day Tai Chi & Longevity",
    bestFor: "Deep Taiji training paired with longevity herbal protocols",
    duration: "7 days",
    price: "from $1,800",
  },
  {
    name: "10-Day Deep Internal Practice",
    bestFor: "Advanced practitioners ready for inner alchemy and daily private teaching",
    duration: "10 days",
    price: "from $3,200",
  },
  {
    name: "Xi'an & Wudang Wellness Journey",
    bestFor: "Combining ancient-capital culture in Xi'an with Wudang Taoist practice",
    duration: "11 days",
    price: "from $920",
  },
  {
    name: "Xi'an & Wudang Closed Retreat",
    bestFor: "A strict no-devices protocol paired with Xi'an TCM diagnostics",
    duration: "10 days",
    price: "from $2,192",
  },
]

const DESTINATION_SLUGS = [
  "wudang-3-day-mind-reset",
  "wudang-5-day-dao-wellness",
  "wudang-executive-burnout-recovery",
  "wudang-7-day-tai-chi-longevity",
  "wudang-10-day-deep-internal-practice",
  "xian-wudang-wellness-journey-11d",
  "xian-wudang-closed-retreat-10d",
]

const FAQS = [
  {
    q: "Do I need prior experience with Taiji or Qigong to visit Wudang Mountain?",
    a: "No. Most programs, including the 3-Day Mind Reset and 5-Day Dao Wellness, are built for genuine beginners. The 10-Day Deep Internal Practice program is the exception — it's recommended for people who've already done a shorter Wudang program and want to go deeper into inner alchemy (nei gong).",
  },
  {
    q: "What's the difference between the Wudang-only programs and the Xi'an & Wudang combined ones?",
    a: "The Wudang-only programs stay on the mountain for the full duration. The Xi'an & Wudang programs split the stay between Xi'an's ancient-capital culture and TCM diagnostics, and Wudang Mountain's Daoist practice — useful if you want cultural context alongside the mountain retreat.",
  },
  {
    q: "Is the TCM component in these programs a form of medical treatment?",
    a: "TCM diagnosis and treatment — pulse and tongue reading, herbal protocols, cupping or acupuncture — is a traditional wellness practice included in several programs. It is not a substitute for medical diagnosis or treatment from a licensed physician. Dream Islands is a Destination Marketing Organization, not a medical institution, and this is not medical advice.",
  },
  {
    q: "How long should I stay at Wudang Mountain?",
    a: "3 days is enough for an introduction to the practice and environment. Most people see a more durable shift in practice and in physical/mental state at 5-7 days. The 10-11 day programs are for people who want to go significantly deeper, either into the practice itself or into a combined cultural and wellness itinerary.",
  },
]

export default async function WudangDestinationGuidePage() {
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
  const orderedPrograms = DESTINATION_SLUGS.map((s) => bySlug.get(s)).filter((p): p is NonNullable<typeof p> => !!p)

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
        <div className="eyebrow" style={{ marginBottom: 12 }}>Destination guide · China</div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 8vw, 60px)", margin: "0 0 20px", color: "var(--ink)", maxWidth: 900 }}>
          Wellness travel in <span className="display-italic">Wudang Mountain</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          A working Daoist mountain, not a recreated retreat set. Here's why people come here for wellness
          specifically, what a program actually involves, and which real programs match.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <Link href="/start" className="btn btn-primary btn-lg">
            Get your WS →
          </Link>
          <Link href="/tracks/island-immersion" className="btn btn-ghost btn-lg">
            Browse Island Immersion programs
          </Link>
        </div>
      </section>

      {/* WHY WUDANG */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Why Wudang Mountain specifically</h2>
          <ul style={{ margin: "16px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {WHY_WUDANG.map((s) => (
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
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>What a Wudang program actually involves</h2>
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
            <div className="eyebrow" style={{ marginBottom: 8 }}>All Wudang programs</div>
            <h2>Comparing your <span className="display-italic">options</span>.</h2>
          </div>
        </div>
        <div className="card" style={{ padding: 0, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 560 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
                {["Programme", "Best for", "Duration", "Approx. price"].map((h) => (
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

      {/* ACTUAL PROGRAMS */}
      {orderedPrograms.length > 0 && (
        <section className="shell" style={{ paddingTop: 56 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Real matched programs</div>
              <h2>Actual Wudang Mountain <span className="display-italic">programs</span>.</h2>
            </div>
          </div>
          <div className="rail">
            {orderedPrograms.map((p) => (
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
