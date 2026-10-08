import Link from "next/link"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import { mapProgram, type DbProgramRow } from "../../_lib/programMapping"
import ProgramCard from "../../_components/ProgramCard"
export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Fitness and Sports Recovery Retreats in Asia",
  description:
    "A practical guide to fitness, training and sports-recovery retreats across Asia — signs you need a structured training block, what a program can and can't do, programme types, typical duration, and real matched programs from the Philippines and Indonesia.",
  alternates: { canonical: "/guides/fitness-recovery-retreats-asia" },
  openGraph: {
    title: "Fitness and Sports Recovery Retreats in Asia | Dream Islands",
    description:
      "Signs you need a structured training block, what a program can and can't do, programme types, duration, destinations and real matched programs across Asia.",
    url: "https://dreamislands.org/guides/fitness-recovery-retreats-asia",
  },
}
const SIGNS = [
  "Training capacity, strength or endurance has plateaued or quietly declined",
  "Coming back from an injury, overtraining or a long stretch of inactivity",
  "Preparing for an endurance event — triathlon, Ironman, marathon — and want a structured block",
  "Chronic soreness, tightness or slow recovery between sessions",
  "Wanting a measurable performance baseline, not just \"getting back into shape\" vaguely",
]
const CAN_DO = [
  "Provide structured training blocks with real coaching, not just gym access",
  "Combine training load with active-recovery protocols — spa, hot springs, mobility work — so you build capacity without breaking down",
  "Run event-specific prep, including triathlon and Ironman blocks, with a realistic taper and load plan",
  "Give you a performance baseline and a take-home training plan",
  "Balance high-output days with genuine recovery days, built into the schedule rather than left to chance",
]
const CANNOT_DO = [
  "Diagnose or treat a sports injury — that needs a physiotherapist or sports-medicine physician",
  "Replace a full training cycle if you're starting event prep with very little base fitness — talk to the team about a realistic timeline first",
  "Guarantee a specific race result — training response varies by person",
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
    name: "Active Recovery",
    bestFor: "Lower-intensity recovery focus for depleted or overtrained guests",
    duration: "5 days",
    price: "from $550",
    location: "Cebu, Philippines",
  },
  {
    name: "Performance Reset",
    bestFor: "A general strength and conditioning reset, not event-specific",
    duration: "5–6 days",
    price: "from $1,150",
    location: "Bintan, Indonesia",
  },
  {
    name: "Ironman Prep Camp",
    bestFor: "Structured multi-discipline training for an upcoming Ironman",
    duration: "7–14 days",
    price: "from $1,330",
    location: "Cebu, Philippines",
  },
  {
    name: "Triathlon Prep",
    bestFor: "Triathlon-specific training block with coaching",
    duration: "7–14 days",
    price: "from $1,540",
    location: "Bintan, Indonesia",
  },
  {
    name: "Sport & Recovery Cycle",
    bestFor: "Balancing structured training with dedicated recovery days",
    duration: "10 days",
    price: "from $2,150",
    location: "Bintan, Indonesia",
  },
]
const FAQS = [
  {
    q: "Do I need to already be an athlete to join?",
    a: "No. Programs span a range of intensities — Active Recovery is built for lower-intensity, depleted or overtrained guests, while Ironman and Triathlon Prep camps assume an existing training base for an upcoming event.",
  },
  {
    q: "How is this different from a normal gym holiday?",
    a: "These programs combine real coaching and structured training load with dedicated recovery protocols — spa, hot springs, mobility work — built into the schedule, rather than just giving you facility access and leaving recovery up to you.",
  },
  {
    q: "Can I use these for injury recovery?",
    a: "Active-recovery-focused programs can support a return to training, but this isn't a substitute for physiotherapy or sports-medicine care. If you're recovering from a specific injury, check with your physician before booking a training-focused program.",
  },
  {
    q: "What's the difference between the 7-day and 14-day Ironman or Triathlon prep camps?",
    a: "The 7-day camp is a focused training block. The 14-day camp allows a deeper training cycle with more progression and taper time built in — better suited if you have more lead time before your event.",
  },
]
export default async function RebuildYourBodyGuidePage() {
  const { data: poRows } = await supabaseAdmin
    .from("program_outcomes")
    .select("program_id")
    .eq("outcome_slug", "rebuild-your-body")
    .eq("weight", "primary")
  const programIds = (poRows ?? []).map((r: { program_id: string }) => r.program_id)
  const { data: rows } = programIds.length
    ? await supabaseAdmin
        .from("programs")
        .select(
          "id, name, slug, summary, cohort, tier, duration_days, price_usd, outcomes, is_composite, hero_image_url, " +
            "program_properties(role, properties(id, name, island, country, contact_wa)), " +
            "program_variants(duration_days, duration_nights, price_basic_usd, price_vip_usd, active)",
        )
        .in("id", programIds)
        .eq("active", true)
        .eq("status", "published")
        .order("sort_order")
        .order("cohort")
        .order("duration_days")
    : { data: [] as DbProgramRow[] }
  const orderedPrograms = ((rows ?? []) as unknown as DbProgramRow[]).map(mapProgram)
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
        <div className="eyebrow" style={{ marginBottom: 12 }}>Outcome guide · Performance</div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 8vw, 60px)", margin: "0 0 20px", color: "var(--ink)", maxWidth: 900 }}>
          Fitness and sports recovery retreats in <span className="display-italic">Asia</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          Structured training with real recovery built in — not a gym holiday. Here's how to tell if you
          need one, what it can and can't do, the programme types available across Asia, and which real
          programs match.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <Link href="/start" className="btn btn-primary btn-lg">
            Get your WS →
          </Link>
          <Link href="/programs?track=Performance" className="btn btn-ghost btn-lg">
            Browse Performance programs
          </Link>
        </div>
      </section>
      {/* SIGNS */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Signs you might need a structured training block</h2>
          <p className="body-sm" style={{ marginBottom: 16, color: "var(--ink-2)" }}>
            None of these are a diagnosis — they're common signals people describe before booking a
            Performance program built around rebuilding capacity.
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {SIGNS.map((s) => (
              <li key={s} style={{ display: "flex", gap: 10 }}>
                <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--accent)", marginTop: 8 }} />
                <span className="body-sm">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      {/* CAN / CANNOT */}
      <section className="shell" style={{ paddingTop: 24 }}>
        <div style={{ display: "grid", gap: 16 }} className="two-col">
          <div className="card" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 20, marginBottom: 14 }}>What a program can do</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
              {CAN_DO.map((c) => (
                <li key={c} className="body-sm" style={{ display: "flex", gap: 10 }}>
                  <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--accent)", marginTop: 8 }} />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="card" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 20, marginBottom: 14 }}>What it can't do</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
              {CANNOT_DO.map((c) => (
                <li key={c} className="body-sm" style={{ display: "flex", gap: 10 }}>
                  <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--ink-3)", marginTop: 8 }} />
                  {c}
                </li>
              ))}
            </ul>
            <p className="body-sm" style={{ marginTop: 14, color: "var(--ink-3)", fontStyle: "italic" }}>
              Dream Islands is a Destination Marketing Organization promoting wellness travel — not a medical
              institution. This is not medical advice.
            </p>
          </div>
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
        <section id="matched-programs" className="shell" style={{ paddingTop: 56, scrollMarginTop: 90 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Real matched programs</div>
              <h2>Actual fitness &amp; recovery <span className="display-italic">programs</span>.</h2>
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
      <style>{`
        @media (min-width: 800px) {
          .two-col { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  )
}
