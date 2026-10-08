import Link from "next/link"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import { mapProgram, type DbProgramRow } from "../../_lib/programMapping"
import ProgramCard from "../../_components/ProgramCard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Longevity and Executive Health Retreats in Asia",
  description:
    "A practical guide to longevity and executive health retreats across Asia — who they're for, what a program can and can't do, programme types, typical duration and price, and real matched programs from China.",
  alternates: { canonical: "/guides/longevity-executive-health-retreats-asia" },
  openGraph: {
    title: "Longevity and Executive Health Retreats in Asia | Dream Islands",
    description:
      "Who it's for, what a program can and can't do, programme types, duration, destinations and real matched programs for longevity and executive health across Asia.",
    url: "https://dreamislands.org/guides/longevity-executive-health-retreats-asia",
  },
}

const SIGNS = [
  "You haven't had a full biomarker panel or comprehensive check-up in over a year",
  "You're performing well at work but running on reserves you can't see — energy, sleep and recovery all quietly declining",
  "A family history of a condition you haven't proactively screened for",
  "You want data — real bloodwork and diagnostics — not just a feeling that you should “do something” about your health",
  "You're approaching a major life stage — a new role, a milestone birthday, retirement — and want a baseline before you commit to it",
  "You've optimized diet and exercise on your own and want the next layer: a clinical read on what's actually happening internally",
]

const CAN_DO = [
  "Run comprehensive diagnostics — full biomarker panels, functional medicine assessments — most people never get access to",
  "Combine Western preventive medicine with traditional approaches, including TCM diagnosis, Taiji and herbal protocols, for a fuller picture",
  "Give you an objective baseline you can track against over years, not just how you feel this week",
  "Compress what would be months of appointments into a single structured trip",
  "Hand you a concrete, personalized protocol to take home, not just a report you file away",
]

const CANNOT_DO = [
  "Diagnose or treat an existing medical condition — that requires your own physician and ongoing clinical care",
  "Replace regular check-ups with your primary doctor; this is a proactive, preventive layer, not a substitute for continuity of care",
  "Guarantee longevity outcomes — biomarker optimization is grounded in real science, but individual results vary and no program can promise a specific outcome",
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
    name: "Executive health & recovery check-up",
    bestFor: "Comprehensive diagnostics plus a functional recovery protocol",
    duration: "7 days",
    medical: "Full biomarker panel, functional medicine",
    price: "from $5,500",
    location: "Mile, Yunnan, China",
  },
  {
    name: "Luxury preventive health program",
    bestFor: "Fully bespoke diagnostics with an extended, personalized protocol",
    duration: "10 days",
    medical: "Comprehensive diagnostics, bespoke protocol",
    price: "from $10,000",
    location: "Mile, Yunnan, China",
  },
  {
    name: "TCM-conditioned medical wellness journey",
    bestFor: "Combining Western diagnostics with traditional Chinese medicine",
    duration: "10 days",
    medical: "TCM conditioning, medical-wellness diagnostics",
    price: "from $2,095",
    location: "Xi'an & Mile, Yunnan, China",
  },
  {
    name: "Tai Chi & longevity protocol",
    bestFor: "A movement- and herb-based longevity approach, less clinical",
    duration: "7 days",
    medical: "Taiji training, longevity herbal protocols, daily TCM treatment",
    price: "from $1,800",
    location: "Wudang Mountain, China",
  },
  {
    name: "Extended medical wellness protocol",
    bestFor: "A deeper, multi-day medical-wellness deep-dive",
    duration: "7 days",
    medical: "Functional medicine, extended diagnostics",
    price: "from $4,500",
    location: "Mile, Yunnan, China",
  },
]


const FAQS = [
  {
    q: "What's the difference between a \"longevity retreat\" and an executive health check-up?",
    a: "There's real overlap. Longevity-focused programs often combine Western diagnostics with traditional approaches — TCM, herbal protocols, Taiji — aimed at long-term biomarker trends. An executive health check-up leans more heavily on comprehensive diagnostics and a functional-medicine read of your current state. Several programs blend both.",
  },
  {
    q: "Is this a substitute for seeing my own doctor?",
    a: "No. This is a proactive, preventive layer — comprehensive diagnostics and a structured protocol you wouldn't easily get through routine care. It doesn't replace ongoing care with your own physician. Dream Islands is a Destination Marketing Organization, not a medical institution, and this is not medical advice.",
  },
  {
    q: "Why are these so much more expensive than other wellness programs?",
    a: "The price reflects the depth of clinical work: full biomarker panels, functional medicine assessments and specialist time cost significantly more than a typical spa or detox protocol. This is diagnostic and preventive medicine delivered in a retreat setting, not a luxury markup on a standard wellness stay.",
  },
  {
    q: "How often should I do a longevity or executive health reset?",
    a: "As a general practice, many people find annual or biennial comprehensive diagnostics useful, with lighter check-ins between. This is general guidance, not a personalized medical recommendation — talk to your own physician about what cadence makes sense for you.",
  },
]

export default async function LongevityExecutiveHealthGuidePage() {
  const { data: poRows } = await supabaseAdmin
    .from("program_outcomes")
    .select("program_id")
    .eq("outcome_slug", "healthy-ageing")
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
          Longevity and executive health retreats in <span className="display-italic">Asia</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          Comprehensive diagnostics and a proactive protocol, not a guess about what your body needs.
          Here's who this is for, what a program can and can't do, the programme types available across Asia,
          and which real programs match.
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
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Who this is for</h2>
          <p className="body-sm" style={{ marginBottom: 16, color: "var(--ink-2)" }}>
            This isn't symptom-driven the way a burnout or sleep reset is — it's proactive. These are the signals
            people describe before booking a Performance program built around diagnostics.
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
              <h2>Actual longevity &amp; executive health <span className="display-italic">programs</span>.</h2>
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
