import Link from "next/link"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import { mapProgram, type DbProgramRow } from "../../_lib/programMapping"
import ProgramCard from "../../_components/ProgramCard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Sleep and Nervous System Reset Retreats in Asia",
  description:
    "A practical guide to sleep and nervous-system reset retreats across Asia — signs you need one, what a retreat can and can't fix, programme types, typical duration, and real matched programs from Thailand, Malaysia, Singapore and China.",
  alternates: { canonical: "/guides/sleep-reset-retreats-asia" },
  openGraph: {
    title: "Sleep and Nervous System Reset Retreats in Asia | Dream Islands",
    description:
      "Signs you need a sleep reset, what a retreat can and can't fix, programme types, duration, destinations and real matched programs across Asia.",
    url: "https://dreamislands.org/guides/sleep-reset-retreats-asia",
  },
}

const SIGNS = [
  "Falling asleep fine but waking at 2–4am wired, unable to get back down",
  "Feeling “tired but wired” — exhausted all day, unable to switch off at night",
  "Relying on screens, alcohol or sleep aids just to fall asleep",
  "Waking up as tired as when you went to bed, even after 7–8 hours",
  "Heart rate or mind racing at bedtime with no clear trigger",
  "Recovery metrics that haven't improved despite taking rest days",
]

const CAN_DO = [
  "Rebuild a consistent sleep-wake rhythm using structured light exposure, movement timing and a screen-free wind-down",
  "Down-regulate an overactive nervous system through breathwork, TCM diagnosis or sound therapy rather than sedatives",
  "Give you objective sleep and recovery data instead of guesswork",
  "Remove the environment — notifications, late meetings, blue light — that's keeping your nervous system in a low-grade alert state",
  "Hand you a specific take-home sleep protocol, not just a few good nights away",
]

const CANNOT_DO = [
  "Diagnose or treat a clinical sleep disorder such as sleep apnea or chronic insomnia disorder — that needs a sleep-medicine specialist",
  "Fix a sleep environment or schedule at home that's fundamentally incompatible with rest — shift work, a newborn, a noisy city bedroom",
  "Produce a lasting result from one trip if the habits that broke your sleep in the first place don't change afterward",
]

type ProgrammeType = {
  name: string
  bestFor: string
  duration: string
  medical: string
  price: string
  location: string
}

const PROGRAMME_TYPES: ProgrammeType[] = [
  {
    name: "Dedicated sleep & nervous-system protocol",
    bestFor: "People whose main issue is sleep architecture specifically",
    duration: "8 days",
    medical: "Sleep-focused clinical sessions, sound therapy",
    price: "from $1,790",
    location: "Koh Samui, Thailand",
  },
  {
    name: "Short mind-reset intro",
    bestFor: "First-timers wanting a low-commitment introduction to Daoist practice",
    duration: "3 days",
    medical: "Taiji, Qigong, meditation, no clinical component",
    price: "from $650",
    location: "Wudang Mountain, China",
  },
  {
    name: "Full digital detox",
    bestFor: "Screen-driven overstimulation and a racing mind at night",
    duration: "10 days",
    medical: "No screens, structured silence, nature immersion",
    price: "from $1,050",
    location: "Langkawi, Malaysia",
  },
  {
    name: "Executive reset with sleep protocol",
    bestFor: "C-suite and founders who need a biometric baseline plus a concrete sleep plan",
    duration: "5 days",
    medical: "Biometric baseline, structured sleep protocol, follow-up plan",
    price: "from $1,700",
    location: "Singapore",
  },
  {
    name: "Meditation-led reset",
    bestFor: "Lower-cost, nature-based nervous-system down-regulation",
    duration: "5 days",
    medical: "Guided meditation, sound healing, journaling",
    price: "from $750",
    location: "Koh Phangan, Thailand",
  },
]


const FAQS = [
  {
    q: "How is a sleep-reset retreat different from a regular wellness retreat?",
    a: "A sleep-reset program is built specifically around sleep architecture and nervous-system regulation — structured light exposure, movement timing, a screen-free wind-down, and often TCM diagnosis or sound therapy — rather than general relaxation. It's a targeted protocol, not a vacation with better bedding.",
  },
  {
    q: "Can a retreat actually fix insomnia?",
    a: "It depends on the cause. Situational sleep disruption — driven by stress, travel, screens, or an overactive nervous system — often responds well to a structured reset. A diagnosed clinical insomnia disorder or sleep apnea needs a sleep-medicine specialist. Dream Islands is a Destination Marketing Organization, not a medical institution, and this is not medical advice.",
  },
  {
    q: "How many days does it actually take to reset a sleep cycle?",
    a: "A 3-day program introduces the practice and can shift acute stress. Most people see a measurable change by day 5–8, once light exposure, movement timing and a screen-free wind-down have run for long enough to matter. Longer, more clinical protocols go deeper into diagnostics and follow-through.",
  },
  {
    q: "Will jet lag undo the reset before it even starts?",
    a: "For some people, yes — which is why a zero-travel-friction option exists: a 5-day executive protocol in Singapore needs no long-haul flight. If you can travel further, the trade-off is a deeper protocol and, in places like Wudang Mountain or Koh Samui, a more immersive environment to rebuild the rhythm in.",
  },
]

export default async function SleepResetGuidePage() {
  const { data: poRows } = await supabaseAdmin
    .from("program_outcomes")
    .select("program_id")
    .eq("outcome_slug", "restore-sleep")
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
        <div className="eyebrow" style={{ marginBottom: 12 }}>Outcome guide · Mind Balance</div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 8vw, 60px)", margin: "0 0 20px", color: "var(--ink)", maxWidth: 900 }}>
          Sleep and nervous system reset retreats in <span className="display-italic">Asia</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          A structured protocol for sleep architecture and an overactive nervous system, not just a quiet room.
          Here's how to tell if you need one, what it can and can't fix, the programme types available across Asia,
          and which real programs match.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <Link href="/start" className="btn btn-primary btn-lg">
            Get your WS →
          </Link>
          <Link href="/programs?track=Mind" className="btn btn-ghost btn-lg">
            Browse Mind Balance programs
          </Link>
        </div>
      </section>

      {/* SIGNS */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Signs you might need a sleep reset</h2>
          <p className="body-sm" style={{ marginBottom: 16, color: "var(--ink-2)" }}>
            None of these are a diagnosis — they're common signals people describe before booking a Mind Balance
            program.
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
            <h2 style={{ fontSize: 20, marginBottom: 14 }}>What a retreat can do</h2>
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
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 720 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
                {["Type", "Best for", "Duration", "Medical component", "Approx. price", "Location"].map((h) => (
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
                  <td style={{ padding: "14px 16px", color: "var(--ink-2)" }}>{t.medical}</td>
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
              <h2>Actual sleep &amp; nervous-system <span className="display-italic">programs</span>.</h2>
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
