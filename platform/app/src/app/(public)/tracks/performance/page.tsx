import Link from "next/link"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import { mapProgram, type DbProgramRow } from "../../_lib/programMapping"
import ProgramCard from "../../_components/ProgramCard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Performance Programs in Asia",
  description:
    "What the Performance track actually involves — training, executive health diagnostics, event prep and recovery cycles, who it's for, typical duration and price, and real matched programs across Indonesia, the Philippines and China.",
  alternates: { canonical: "/tracks/performance" },
  openGraph: {
    title: "Performance Programs in Asia | Dream Islands",
    description:
      "What Performance involves, who it's for, programme types, duration, destinations and real matched programs across Asia.",
    url: "https://dreamislands.org/tracks/performance",
  },
}

const WHAT_IT_INVOLVES = [
  "Structured training — sport-specific prep, periodised loading, or general capacity building depending on the program",
  "In several programs, comprehensive diagnostics: full biomarker panels, functional-medicine assessments",
  "Active recovery built into the schedule, not bolted on — mobility, soft-tissue work, hydrotherapy",
  "For event-prep programs, race-simulation days and taper planning ahead of a specific goal (a triathlon, an Ironman)",
  "A concrete, personalized protocol to take home, not just a week of hard training",
]

const WHO_ITS_FOR = [
  "You've optimized diet and exercise on your own and want the next layer — real diagnostics, not guesswork",
  "You're training for a specific event and need a structured camp, not a generic gym holiday",
  "You're a high-performing professional whose energy, sleep and recovery are quietly declining under load",
  "You want to rebuild capacity after a period of depletion, rather than just resting",
]

type ProgrammeType = {
  name: string
  bestFor: string
  duration: string
  price: string
  location: string
}

const PROGRAMME_TYPES: ProgrammeType[] = [
  {
    name: "Professional performance reset",
    bestFor: "Active professionals wanting structured training plus recovery",
    duration: "5 days",
    price: "from $1,150",
    location: "Bintan, Indonesia",
  },
  {
    name: "Event-specific prep camp",
    bestFor: "Training for a triathlon or Ironman with race-simulation days",
    duration: "7 days",
    price: "from $1,330",
    location: "Cebu, Philippines",
  },
  {
    name: "Executive health & recovery",
    bestFor: "Comprehensive diagnostics plus a functional recovery protocol",
    duration: "7 days",
    price: "from $5,500",
    location: "Mile, Yunnan, China",
  },
  {
    name: "Active recovery cycle",
    bestFor: "Post-race or mid-training-block deload",
    duration: "5 days",
    price: "from $550",
    location: "Cebu, Philippines",
  },
]

const TRACK_SLUGS = [
  "club-med-bintan-performance-reset-5d",
  "movenpick-cebu-ironman-prep-camp-7d",
  "mile-executive-health-recovery",
  "ayo-ayo-wellness-active-recovery-5d",
]

const FAQS = [
  {
    q: "What does the Performance track actually mean?",
    a: "It's the cohort of programs built around training, diagnostics and recovery capacity — either for a specific athletic goal (an Ironman, a triathlon) or general executive health and energy. It's distinct from Reset & Recovery, which is about down-regulating rather than building capacity.",
  },
  {
    q: "Do I need to already be an athlete for these programs?",
    a: "No. Some programs are built specifically for event prep (triathlon, Ironman), but others — like the professional performance reset or executive health check-ups — are for anyone wanting structured training and real diagnostics, athlete or not.",
  },
  {
    q: "What's the difference between the executive health programs and a regular check-up?",
    a: "Comprehensive diagnostics — full biomarker panels, functional medicine assessments, specialist time — go significantly deeper than a routine check-up, and are delivered in a structured multi-day format rather than a single appointment. This is a proactive, preventive layer, not a substitute for your own physician.",
  },
  {
    q: "Is this a substitute for training with my own coach?",
    a: "No. These are structured, time-boxed programs — useful for a reset, a diagnostic baseline, or event-specific preparation — not a replacement for ongoing coaching or medical care. Dream Islands is a Destination Marketing Organization, not a medical institution, and this is not medical advice.",
  },
]

export default async function PerformanceTrackPage() {
  const { data: rows } = await supabaseAdmin
    .from("programs")
    .select(
      "id, name, slug, summary, cohort, tier, duration_days, price_usd, outcomes, is_composite, hero_image_url, " +
        "program_properties(role, properties(id, name, island, country, contact_wa)), " +
        "program_variants(duration_days, duration_nights, price_basic_usd, price_vip_usd, active)",
    )
    .in("slug", TRACK_SLUGS)
    .eq("active", true)
    .eq("status", "published")

  const programs = ((rows ?? []) as unknown as DbProgramRow[]).map(mapProgram)
  const bySlug = new Map(programs.map((p) => [p.slug, p]))
  const orderedPrograms = TRACK_SLUGS.map((s) => bySlug.get(s)).filter((p): p is NonNullable<typeof p> => !!p)

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
        <div className="eyebrow" style={{ marginBottom: 12 }}>Track guide</div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 8vw, 60px)", margin: "0 0 20px", color: "var(--ink)", maxWidth: 900 }}>
          Performance <span className="display-italic">programs in Asia</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          Train smarter, rebuild capacity. Here's what this track actually involves, who it's for,
          the programme types available across Asia, and which real programs match.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <Link href="/start" className="btn btn-primary btn-lg">
            Get your WS →
          </Link>
          <Link href="/programs?track=Performance" className="btn btn-ghost btn-lg">
            Browse all Performance programs
          </Link>
        </div>
          <div style={{ display: "flex", gap: 16, marginTop: 28, flexWrap: "wrap" }}><img src="/mascots/dreamer_performance_strength-mobility_woman.png" alt="" style={{ width: 140, height: "auto" }} /><img src="/mascots/dreamer_performance_endurance-run_man.png" alt="" style={{ width: 140, height: "auto" }} /></div>
      </section>

      {/* WHAT IT INVOLVES */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>What this track actually involves</h2>
          <p className="body-sm" style={{ marginBottom: 16, color: "var(--ink-2)" }}>
            The specifics vary by program and destination, but Performance programs share a common shape.
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {WHAT_IT_INVOLVES.map((s) => (
              <li key={s} style={{ display: "flex", gap: 10 }}>
                <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--accent)", marginTop: 8 }} />
                <span className="body-sm">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>Who it's for</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {WHO_ITS_FOR.map((c) => (
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
            <div className="eyebrow" style={{ marginBottom: 8 }}>Programme types</div>
            <h2>Comparing your <span className="display-italic">options</span>.</h2>
          </div>
        </div>
        <div className="card" style={{ padding: 0, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 640 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
                {["Type", "Best for", "Duration", "Approx. price", "Location"].map((h) => (
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
                  <td style={{ padding: "14px 16px", color: "var(--ink-2)" }}>{t.location}</td>
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
              <h2>Actual Performance <span className="display-italic">programs</span>.</h2>
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
