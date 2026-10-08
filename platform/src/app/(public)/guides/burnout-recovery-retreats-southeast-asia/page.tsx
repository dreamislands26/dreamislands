import Link from "next/link"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import { mapProgram, type DbProgramRow } from "../../_lib/programMapping"
import ProgramCard from "../../_components/ProgramCard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Burnout Recovery Retreats in Southeast Asia",
  description:
    "A practical guide to burnout recovery retreats across Southeast and East Asia — symptoms to watch for, what a retreat can and can't fix, programme types, typical duration, and real matched programs from Thailand, Singapore, Malaysia and China.",
  alternates: { canonical: "/guides/burnout-recovery-retreats-southeast-asia" },
  openGraph: {
    title: "Burnout Recovery Retreats in Southeast Asia | Dream Islands",
    description:
      "Symptoms, what a retreat can and can't fix, programme types, duration, destinations and real matched programs for burnout recovery across Asia.",
    url: "https://dreamislands.org/guides/burnout-recovery-retreats-southeast-asia",
  },
}

const SYMPTOMS = [
  "Chronic fatigue that a normal weekend off doesn't fix",
  "Sleep that's technically long enough but doesn't feel restorative",
  "Cognitive fog, slower decision-making, trouble focusing on deep work",
  "Irritability or emotional flatness that's new for you",
  "Loss of motivation for things that used to feel rewarding",
  "Physical signals — headaches, digestive changes, low libido, getting sick more often",
]

const CAN_DO = [
  "Force a genuine break from the environment and inputs that are driving the load",
  "Put structure around sleep, movement and nutrition for long enough to see a measurable shift",
  "Give you objective data — a baseline score, sometimes bloodwork — instead of just a feeling",
  "Pair you with people (coaches, TCM practitioners, clinicians) whose job is to notice what you can't see in yourself",
  "Hand you a concrete post-trip protocol, not just a nice memory",
]

const CANNOT_DO = [
  "Replace therapy or psychiatric care if what you're dealing with is clinical depression or an anxiety disorder, not situational burnout",
  "Fix a job or life structure that's fundamentally unsustainable — the reset can reveal that clearly, but the change has to happen after you're home",
  "Produce a permanent result from a single short trip with no follow-through",
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
    name: "Executive / urban reset",
    bestFor: "C-suite and founders who can't take two weeks away",
    duration: "3–5 days",
    medical: "Medical-grade, biometric baseline",
    price: "$1,050–$1,700",
    location: "Singapore",
  },
  {
    name: "Mountain TCM retreat",
    bestFor: "Deeper digital detox with traditional Chinese medicine diagnosis",
    duration: "5 days",
    medical: "TCM diagnosis, daily coaching",
    price: "~$2,000",
    location: "Wudang Mountain, China",
  },
  {
    name: "Nature / forest detox",
    bestFor: "Lower-cost entry point, less clinical, more nature-led",
    duration: "5–7 days",
    medical: "Cultural + nature-based, no medical component",
    price: "$600–$875",
    location: "Penang, Malaysia",
  },
  {
    name: "Structured multi-stage detox",
    bestFor: "First-timers who want a proven, flexible-length protocol",
    duration: "6–11 days",
    medical: "Daily clinical sessions, circadian reset",
    price: "$990–$2,390",
    location: "Koh Samui, Thailand · Bintan, Indonesia",
  },
  {
    name: "Medical-grade hot springs reset",
    bestFor: "Combining detox with a functional-medicine introduction",
    duration: "3–5 days",
    medical: "TCM consultation, medical baseline",
    price: "$1,200–$2,200",
    location: "Mile, Yunnan, China",
  },
]


const FAQS = [
  {
    q: "How long does a burnout recovery retreat actually need to be?",
    a: "It depends on what you're trying to shift. A 3-day executive reset can improve sleep and reduce acute stress markers if you need something you can fit around work. Most people see a more durable shift at 5–7 days, where there's time to establish new sleep and movement patterns, not just rest. Composite protocols of 8–11 days go further — deeper detox work plus a structured take-home plan.",
  },
  {
    q: "Is a wellness retreat a substitute for therapy?",
    a: "No. A retreat can reset physical baseline — sleep, energy, inflammation markers, stress load — and give you space to think clearly. It is not a substitute for therapy or psychiatric treatment if what you're experiencing is clinical depression, an anxiety disorder, or another condition that needs diagnosis and ongoing care. Dream Islands is a Destination Marketing Organization, not a medical institution, and our programs are wellness travel, not medical treatment.",
  },
  {
    q: "What's the difference between a detox retreat and a burnout recovery program?",
    a: "A detox retreat is usually built around a specific physical protocol — diet, cleanse, TCM or spa treatments — aimed at markers like inflammation, energy or weight. A burnout recovery program is built around the stress/recovery cycle specifically: sleep architecture, nervous system regulation, digital detox and often a coaching or biometric component. Several programs combine both.",
  },
  {
    q: "Do I need to travel far for burnout recovery if I'm based in Singapore, Hong Kong or another Asian city?",
    a: "No. Several programs are designed specifically for zero-travel-friction resets — a 3–5 day executive protocol in Singapore, for example, needs no long-haul flight and no jet lag to recover from before you've even started.",
  },
]

export default async function BurnoutRecoveryGuidePage() {
  const { data: poRows } = await supabaseAdmin
    .from("program_outcomes")
    .select("program_id")
    .eq("outcome_slug", "stress-anxiety")
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
          Burnout recovery retreats in <span className="display-italic">Southeast Asia</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          A structured reset, not a vacation. Here's how to tell if you need one, what it can and can't fix,
          the different programme types available across Asia, and which real programs match.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <Link href="/start" className="btn btn-primary btn-lg">
            Get your WS →
          </Link>
          <Link href="/programs?track=Reset" className="btn btn-ghost btn-lg">
            Browse Reset &amp; Recovery programs
          </Link>
        </div>
      </section>

      {/* SYMPTOMS */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Signs you might need a structured reset</h2>
          <p className="body-sm" style={{ marginBottom: 16, color: "var(--ink-2)" }}>
            None of these are a diagnosis — they're common signals people describe before booking a Reset &amp;
            Recovery program.
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {SYMPTOMS.map((s) => (
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
              <h2>Actual burnout-recovery <span className="display-italic">programs</span>.</h2>
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
