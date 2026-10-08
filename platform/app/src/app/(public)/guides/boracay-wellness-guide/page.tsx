import Link from "next/link"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import { mapProgram, type DbProgramRow } from "../../_lib/programMapping"
import ProgramCard from "../../_components/ProgramCard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Wellness Travel Guide: Boracay",
  description:
    "A practical guide to wellness travel in Boracay — mindfulness and community-wellness retreats at Movenpick Resort & Spa Boracay, what each actually involves, typical duration and price, and real matched programs.",
  alternates: { canonical: "/guides/boracay-wellness-guide" },
  openGraph: {
    title: "Wellness Travel Guide: Boracay | Dream Islands",
    description:
      "Mindfulness and community-wellness retreats on Boracay's white sand. What to expect, programme types, duration, price and real matched programs.",
    url: "https://dreamislands.org/guides/boracay-wellness-guide",
  },
}

const WHY_BORACAY = [
  "Boracay is one of Asia's most recognized white-sand beach destinations — a genuinely different setting from the clinical or detox-focused hubs elsewhere in the network",
  "All three Boracay programmes run at Movenpick Resort & Spa Boracay and share a common thread: mindfulness and community, not clinical protocols",
  "The Community Wellness Week is built specifically for isolation-driven burnout — a distinct framing from the individual, solo resets offered elsewhere",
  "A beachfront, resort-format setting rather than a wellness-clinic compound, for guests who want their reset to feel like a holiday",
]

const WHAT_IT_INVOLVES = [
  "Structured daily yoga and meditation across all three programmes",
  "Personal growth workshops on the Mindfulness Reset programmes, expanding to peer-group workshops and community-driven reflection on the 10-day version",
  "On Community Wellness Week specifically: a group format built around social connection, aimed at guests whose burnout is tied to isolation rather than overwork alone",
  "No clinical or medical component — yoga, mindfulness and group work in a white-sand resort setting",
]

type ProgrammeType = {
  name: string
  bestFor: string
  duration: string
  price: string
}

const PROGRAMME_TYPES: ProgrammeType[] = [
  {
    name: "Mindfulness Reset 7D",
    bestFor: "A structured yoga and meditation reset with personal growth workshops",
    duration: "7 days",
    price: "$1,225",
  },
  {
    name: "Mindfulness Reset 10D",
    bestFor: "The same reset, with added community-driven reflection and peer group workshops",
    duration: "10 days",
    price: "$1,700",
  },
  {
    name: "Community Wellness Week 7D",
    bestFor: "Isolation-driven burnout, built around social connection in a group format",
    duration: "7 days",
    price: "$1,260",
  },
]

const DESTINATION_SLUGS = [
  "movenpick-resort-spa-boracay-mindfulness-reset-7d",
  "movenpick-resort-spa-boracay-mindfulness-reset-10d",
  "movenpick-resort-spa-boracay-community-wellness-week-7d",
]

const FAQS = [
  {
    q: "What makes Boracay different from the other Mind Balance destinations?",
    a: "It's the beach-resort setting and the community focus. Where Bali leans yoga-and-fasting and Koh Phangan leans silent meditation, Boracay's programmes are built around structured mindfulness practice plus group and community work — including a programme designed specifically for isolation-driven burnout.",
  },
  {
    q: "Should I choose Mindfulness Reset or Community Wellness Week?",
    a: "Mindfulness Reset is more individually focused — yoga, meditation and personal growth workshops. Community Wellness Week is a group-format programme specifically for guests whose burnout is tied to isolation or lack of social connection, not just overwork.",
  },
  {
    q: "What's the difference between the 7-day and 10-day Mindfulness Reset?",
    a: "The 7-day version covers the core programme — structured yoga, meditation and personal growth workshops. The 10-day version adds community-driven reflection and peer group workshops on top of that.",
  },
  {
    q: "Are these programs a substitute for ongoing mental health care?",
    a: "No. The mindfulness and community-wellness programmes in Boracay are a structured wellness reset, not a substitute for therapy or psychiatric care. Dream Islands is a Destination Marketing Organization, not a medical institution, and this is not medical advice.",
  },
]

export default async function BoracayDestinationGuidePage() {
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
        <div className="eyebrow" style={{ marginBottom: 12 }}>Destination guide · Philippines</div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 8vw, 60px)", margin: "0 0 20px", color: "var(--ink)", maxWidth: 900 }}>
          Wellness travel in <span className="display-italic">Boracay</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          Mindfulness and community wellness on Boracay's white sand. Here's what each program actually
          involves and which real programs match.
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

      {/* WHY BORACAY */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Why Boracay specifically</h2>
          <ul style={{ margin: "16px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {WHY_BORACAY.map((s) => (
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
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>What a Boracay program actually involves</h2>
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
            <div className="eyebrow" style={{ marginBottom: 8 }}>All Boracay programs</div>
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

      {/* ACTUAL PROGRAMS */}
      {orderedPrograms.length > 0 && (
        <section className="shell" style={{ paddingTop: 56 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Real matched programs</div>
              <h2>Actual Boracay <span className="display-italic">programs</span>.</h2>
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
