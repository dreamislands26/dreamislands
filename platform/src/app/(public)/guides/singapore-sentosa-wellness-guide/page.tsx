import Link from "next/link"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import { mapProgram, type DbProgramRow } from "../../_lib/programMapping"
import ProgramCard from "../../_components/ProgramCard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Wellness Travel Guide: Singapore & Sentosa",
  description:
    "A practical guide to wellness travel in Singapore and Sentosa — zero-travel-friction executive resets and sport recovery programs for SG/HK/KL professionals, what a program actually involves, typical duration and price, and real matched programs.",
  alternates: { canonical: "/guides/singapore-sentosa-wellness-guide" },
  openGraph: {
    title: "Wellness Travel Guide: Singapore & Sentosa | Dream Islands",
    description:
      "Executive resets and sport recovery in Singapore and Sentosa — what to expect, programme types, duration, price and real matched programs.",
    url: "https://dreamislands.org/guides/singapore-sentosa-wellness-guide",
  },
}

const WHY_SINGAPORE = [
  "Zero travel friction for professionals based in Singapore, Hong Kong or Kuala Lumpur — no long-haul flight, no jet lag to recover from before you've even started",
  "Medical-grade urban wellness infrastructure, built for executives who can't take two weeks away",
  "Sentosa — a resort island a short causeway or cable-car ride from the city — gives genuine physical distance from work without leaving the country",
  "A realistic option for a 3-day reset squeezed around a working week, not just a long-haul retreat",
]

const WHAT_IT_INVOLVES = [
  "For the Como Shambala programs: a medical-grade executive burnout reset with biometric baseline and a structured sleep protocol",
  "For the Village Hotel Sentosa programs: running tracks, monitored open-water swimming and sports festivals, with structured recovery sessions built in",
  "Urban, city-adjacent settings rather than a remote nature retreat — the trade-off for zero travel friction",
  "A full follow-up plan on the longer programs, not just a few structured days",
]

type ProgrammeType = {
  name: string
  bestFor: string
  duration: string
  price: string
}

const PROGRAMME_TYPES: ProgrammeType[] = [
  {
    name: "Executive Burnout Reset 3D",
    bestFor: "SG/HK/KL C-suite wanting a medical-grade reset with zero travel friction",
    duration: "3 days",
    price: "from $1,050",
  },
  {
    name: "Executive Burnout Reset 5D",
    bestFor: "The same reset, with a biometric baseline and full follow-up plan added",
    duration: "5 days",
    price: "from $1,700",
  },
  {
    name: "Sport & Chill 3D",
    bestFor: "An urban escape with running, open-water swimming and sports festivals",
    duration: "3 days",
    price: "from $840",
  },
  {
    name: "Sport & Chill 5D",
    bestFor: "The same format plus structured recovery sessions and a guided performance review",
    duration: "5 days",
    price: "from $1,350",
  },
]

const DESTINATION_SLUGS = [
  "como-shambala-executive-burnout-reset-3d",
  "como-shambala-executive-burnout-reset-5d",
  "village-hotel-sentosa-sport-chill-3d",
  "village-hotel-sentosa-sport-chill-5d",
]

const FAQS = [
  {
    q: "Is a Singapore-based program actually different from flying to Thailand or Bali?",
    a: "Yes, mainly in trade-offs. You get zero travel friction and a genuinely medical-grade or structured urban setting, but a more compact, city-adjacent environment rather than a remote nature retreat. For SG/HK/KL professionals who can't take two weeks away, that trade-off is usually the point.",
  },
  {
    q: "What's the difference between the Como Shambala and Village Hotel Sentosa programs?",
    a: "Como Shambala's Executive Burnout Reset programs are medical-grade, focused on stress recovery with a biometric baseline and sleep protocol. Village Hotel Sentosa's Sport & Chill programs are built around active recovery — running, open-water swimming, structured spa recovery — for people whose reset is more physical than clinical.",
  },
  {
    q: "Do I need to be based in Singapore to book one of these?",
    a: "No, but the format is specifically designed to minimize travel friction for people already in the region — Singapore, Hong Kong, Kuala Lumpur and similar. If you're traveling further, a longer program elsewhere in Asia may make more sense given the flight time either way.",
  },
  {
    q: "Are these programs a substitute for ongoing medical or psychiatric care?",
    a: "No. The biometric baseline and sleep protocol in the Como Shambala programs are a structured wellness reset, not medical treatment or diagnosis. Dream Islands is a Destination Marketing Organization, not a medical institution, and this is not medical advice.",
  },
]

export default async function SingaporeDestinationGuidePage() {
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
        <div className="eyebrow" style={{ marginBottom: 12 }}>Destination guide · Singapore</div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 8vw, 60px)", margin: "0 0 20px", color: "var(--ink)", maxWidth: 900 }}>
          Wellness travel in <span className="display-italic">Singapore &amp; Sentosa</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          Zero travel friction for SG/HK/KL professionals. Here's why people choose Singapore for a reset
          specifically, what a program actually involves, and which real programs match.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <Link href="/start" className="btn btn-primary btn-lg">
            Get your WS →
          </Link>
          <Link href="/tracks/reset-recovery" className="btn btn-ghost btn-lg">
            Browse Reset & Recovery programs
          </Link>
        </div>
      </section>

      {/* WHY SINGAPORE */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Why Singapore &amp; Sentosa specifically</h2>
          <ul style={{ margin: "16px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {WHY_SINGAPORE.map((s) => (
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
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>What a Singapore program actually involves</h2>
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
            <div className="eyebrow" style={{ marginBottom: 8 }}>All Singapore &amp; Sentosa programs</div>
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
              <h2>Actual Singapore &amp; Sentosa <span className="display-italic">programs</span>.</h2>
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
