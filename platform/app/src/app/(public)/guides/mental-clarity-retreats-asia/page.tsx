import Link from "next/link"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import { mapProgram, type DbProgramRow } from "../../_lib/programMapping"
import ProgramCard from "../../_components/ProgramCard"
export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Mental Clarity Retreats in Asia",
  description:
    "A practical guide to mental clarity retreats across Asia — signs of mental clutter and decision fatigue, what a retreat can and can't fix, programme types, typical duration, and real matched programs from Thailand, Malaysia, Indonesia, the Philippines and Vietnam.",
  alternates: { canonical: "/guides/mental-clarity-retreats-asia" },
  openGraph: {
    title: "Mental Clarity Retreats in Asia | Dream Islands",
    description:
      "Signs of mental clutter and decision fatigue, what a retreat can and can't fix, programme types, duration, destinations and real matched programs across Asia.",
    url: "https://dreamislands.org/guides/mental-clarity-retreats-asia",
  },
}
const SIGNS = [
  "Constant mental noise — trouble finishing a thought or a task without switching tracks in your head",
  "Decision fatigue, where even small choices feel exhausting",
  "Creative or strategic thinking has gone flat — you're running on habit, not insight",
  "Screens and notifications have quietly taken over most of your attention",
  "You know what to do but can't focus long enough to actually do it",
  "A nagging sense you haven't had an unstructured, undistracted thought in months",
]
const CAN_DO = [
  "Remove the input overload — screens, notifications, decisions — for long enough that your attention actually resets",
  "Use structured meditation, mindfulness or guided-fasting protocols to quiet mental noise, not just \"relaxation\"",
  "Give unstructured time and space back, which is often what creative or strategic thinking actually needs",
  "Build a daily practice — meditation, journaling, movement — you can realistically keep at home",
  "Combine mental-clarity work with real environment change: nature, quiet, distance from routine",
]
const CANNOT_DO = [
  "Diagnose or treat ADHD, an anxiety disorder or a mood disorder — see a licensed professional for that",
  "Substitute for addressing an unsustainable workload or environment once you're back",
  "Produce a lasting shift from a single short trip with no ongoing practice afterward",
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
    name: "Meditation Reset",
    bestFor: "A lower-cost, focused meditation practice for a quick reset",
    duration: "5 days",
    price: "from $750",
    location: "Koh Phangan, Thailand",
  },
  {
    name: "Fasting & Clarity",
    bestFor: "Combining guided fasting with mental-clarity coaching",
    duration: "7 days",
    price: "from $805",
    location: "Bali, Indonesia",
  },
  {
    name: "Mindfulness Reset",
    bestFor: "Structured daily mindfulness practice, beginner-friendly",
    duration: "7–10 days",
    price: "from $1,225",
    location: "Boracay, Philippines",
  },
  {
    name: "Digital Detox",
    bestFor: "Full removal of screens and notifications for a deep reset",
    duration: "10 days",
    price: "from $1,050",
    location: "Langkawi, Malaysia",
  },
  {
    name: "Long Stay Mental Reset",
    bestFor: "An extended reset aimed at a genuinely new baseline, not just a break",
    duration: "21 days",
    price: "from $2,835",
    location: "Phu Quoc, Vietnam",
  },
]
const FAQS = [
  {
    q: "How is Mental Clarity different from Reduce Stress & Anxiety?",
    a: "Stress and anxiety programs target the nervous system and emotional load directly. Mental clarity programs target focus, decision fatigue and creative capacity — the cognitive side rather than the emotional side. Many guests benefit from both, and some programs touch on both outcomes.",
  },
  {
    q: "Do I need meditation experience to join?",
    a: "No. Most programs on this page are built for beginners, with guided daily sessions rather than assuming a prior practice.",
  },
  {
    q: "How long until I notice a difference in focus?",
    a: "Most guests report a shift within the first few days once screens and decision load are removed. A longer stay — 10 to 21 days — gives more time to build a practice that actually holds once you're back to normal life.",
  },
  {
    q: "Can a digital detox work if I still need to check email for work?",
    a: "Some programs allow limited, scheduled connectivity; others are fully screen-free. Ask the team about a specific program's policy before booking if staying reachable is a requirement for you.",
  },
]
export default async function MentalClarityGuidePage() {
  const { data: poRows } = await supabaseAdmin
    .from("program_outcomes")
    .select("program_id")
    .eq("outcome_slug", "mental-clarity")
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
          Mental clarity retreats in <span className="display-italic">Asia</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          Structured space to quiet the noise, not just a quiet room. Here's how to tell if you need one,
          what it can and can't fix, the programme types available across Asia, and which real programs match.
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
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Signs you might need a mental-clarity reset</h2>
          <p className="body-sm" style={{ marginBottom: 16, color: "var(--ink-2)" }}>
            None of these are a diagnosis — they're common signals people describe before booking a Mind
            Balance program built for clarity and focus.
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
              <h2>Actual mental-clarity <span className="display-italic">programs</span>.</h2>
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
