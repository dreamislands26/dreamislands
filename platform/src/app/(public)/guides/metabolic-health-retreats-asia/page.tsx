import Link from "next/link"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import { mapProgram, type DbProgramRow } from "../../_lib/programMapping"
import ProgramCard from "../../_components/ProgramCard"
export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Weight Loss and Metabolic Health Retreats in Asia",
  description:
    "A practical guide to weight loss and metabolic health retreats across Asia — signs you need a structured reset, what a retreat can and can't fix, programme types, typical duration, and real matched programs from Thailand, Malaysia and Indonesia.",
  alternates: { canonical: "/guides/metabolic-health-retreats-asia" },
  openGraph: {
    title: "Weight Loss and Metabolic Health Retreats in Asia | Dream Islands",
    description:
      "Signs of a metabolic reset worth taking, what a retreat can and can't fix, programme types, duration, destinations and real matched programs across Asia.",
    url: "https://dreamislands.org/guides/metabolic-health-retreats-asia",
  },
}
const SIGNS = [
  "Weight that hasn't shifted despite genuine diet and exercise changes",
  "Bloating, sluggish digestion or low-grade inflammation that doesn't resolve",
  "Energy crashes after meals, sugar cravings, or blood sugar that feels unstable",
  "A cluttered relationship with food — restriction-and-binge cycles, constant snacking",
  "Wanting a structured, supervised reset instead of another diet you have to police yourself",
  "Suspecting stress or poor sleep has quietly driven weight gain you can't out-exercise",
]
const CAN_DO = [
  "Run a structured, supervised detox or reset protocol — not just calorie restriction",
  "Reset eating patterns and digestion with whole-food meal plans and guided fasting or cleanse protocols",
  "Address the sleep, stress and inflammation drivers that often sit behind stubborn weight, not just the number on the scale",
  "Give you an objective starting point instead of guesswork",
  "Hand you a concrete take-home protocol so the reset doesn't unwind in week two",
]
const CANNOT_DO = [
  "Diagnose or treat a metabolic or endocrine condition — thyroid issues, PCOS, diabetes — that needs your own physician",
  "Produce large or lasting weight loss from a single short trip if eating patterns revert immediately afterward",
  "Replace a monitored medical weight-loss program for significant weight loss — this is a wellness reset, not a bariatric or GLP-1-level intervention",
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
    name: "Forest Detox",
    bestFor: "A lower-cost, nature-based reset for digestion and inflammation",
    duration: "5 days",
    price: "from $600",
    location: "Penang, Malaysia",
  },
  {
    name: "Weight Reset",
    bestFor: "A dedicated weight and metabolic protocol with structured coaching",
    duration: "8 days",
    price: "from $1,690",
    location: "Koh Samui, Thailand",
  },
  {
    name: "Detox Reset",
    bestFor: "A deeper, multi-stage detox combining fasting protocols with a metabolic reset",
    duration: "10 days",
    price: "from $2,085",
    location: "Koh Samui, Thailand · Bintan, Indonesia",
  },
]
const FAQS = [
  {
    q: "Will this actually make me lose weight?",
    a: "A short structured reset can meaningfully shift bloating, energy and eating patterns within days, and many guests do lose weight during the program itself. How much sticks depends on what changes when you're home — the take-home protocol matters more than the trip alone.",
  },
  {
    q: "Is this a medical weight-loss program, like GLP-1 medication or bariatric treatment?",
    a: "No. Dream Islands is a Destination Marketing Organization promoting wellness travel, not a medical institution. These are structured detox and metabolic-reset protocols, not medical weight-loss treatment. This is not medical advice.",
  },
  {
    q: "What's the difference between Detox Reset and Weight Reset?",
    a: "Detox Reset is a broader, deeper multi-stage cleanse protocol aimed at digestion, inflammation and toxin load generally. Weight Reset is more specifically built around metabolic and weight outcomes, with more structured coaching around eating patterns.",
  },
  {
    q: "Do I need to fast the entire time?",
    a: "It depends on the program. Some protocols include guided fasting windows or juice-cleanse phases; others use structured whole-food meal plans instead. Ask the team which approach a specific program uses before booking if fasting is a concern for you.",
  },
]
export default async function MetabolicHealthGuidePage() {
  const { data: poRows } = await supabaseAdmin
    .from("program_outcomes")
    .select("program_id")
    .eq("outcome_slug", "metabolic-health")
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
        <div className="eyebrow" style={{ marginBottom: 12 }}>Outcome guide · Reset &amp; Recovery</div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 8vw, 60px)", margin: "0 0 20px", color: "var(--ink)", maxWidth: 900 }}>
          Weight loss and metabolic health retreats in <span className="display-italic">Asia</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          A structured, supervised reset — not another diet you have to police yourself. Here's how to
          tell if you need one, what it can and can't fix, the programme types available across Asia,
          and which real programs match.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <Link href="/start" className="btn btn-primary btn-lg">
            Get your WS →
          </Link>
          <Link href="/programs" className="btn btn-ghost btn-lg">
            Browse all programs
          </Link>
        </div>
      </section>
      {/* SIGNS */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Signs you might need a metabolic reset</h2>
          <p className="body-sm" style={{ marginBottom: 16, color: "var(--ink-2)" }}>
            None of these are a diagnosis — they're common signals people describe before booking a
            metabolic-health program.
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
              <h2>Actual metabolic-health <span className="display-italic">programs</span>.</h2>
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
