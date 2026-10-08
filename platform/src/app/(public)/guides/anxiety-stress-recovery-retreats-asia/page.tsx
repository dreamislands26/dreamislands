import Link from "next/link"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import { mapProgram, type DbProgramRow } from "../../_lib/programMapping"
import ProgramCard from "../../_components/ProgramCard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Anxiety and Stress Recovery Retreats in Asia",
  description:
    "A practical guide to anxiety and stress recovery retreats across Asia — signs to watch for, what a retreat can and can't fix, programme types, typical duration, and real matched programs from Vietnam, Indonesia, Thailand and the Philippines.",
  alternates: { canonical: "/guides/anxiety-stress-recovery-retreats-asia" },
  openGraph: {
    title: "Anxiety and Stress Recovery Retreats in Asia | Dream Islands",
    description:
      "Signs, what a retreat can and can't fix, programme types, duration, destinations and real matched programs for anxiety and stress recovery across Asia.",
    url: "https://dreamislands.org/guides/anxiety-stress-recovery-retreats-asia",
  },
}

const SIGNS = [
  "A low-grade sense of dread or overwhelm that doesn't match what's actually happening",
  "Racing thoughts or rumination, or difficulty being present even on days off",
  "Physical tension — jaw clenching, shallow breathing, tight shoulders — that doesn't ease with a massage",
  "Snapping at people you care about, or withdrawing from things you used to enjoy",
  "Using work, scrolling or alcohol to avoid sitting with how you're actually feeling",
  "A recent life transition, loss, or prolonged high-stress period with no real recovery time since",
]

const CAN_DO = [
  "Create real distance from the triggers — inbox, deadlines, family dynamics — driving the stress response",
  "Use structured practice, including breathwork, meditation, movement or TCM, to shift you out of sympathetic overdrive",
  "Give unstructured time and trained facilitators space to process what's actually going on, not just distract from it",
  "Offer a group or solo format depending on what actually helps — some people need community, others need real solitude",
  "Send you home with a specific practice, not just the memory of feeling calmer for a week",
]

const CANNOT_DO = [
  "Replace therapy or psychiatric care for a diagnosed anxiety disorder, PTSD, or clinical depression",
  "Process acute grief or trauma in a way that substitutes for grief counseling or trauma-informed therapy — some programs support this work, none replace it",
  "Guarantee the anxiety won't return once you're back in the environment that produced it, without follow-through",
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
    name: "Long-stay emotional recalibration",
    bestFor: "Deep, unresolved stress or a major life transition",
    duration: "21 days",
    medical: "Full emotional recalibration, therapeutic support",
    price: "from $2,835",
    location: "Phu Quoc, Vietnam",
  },
  {
    name: "Structured emotional recovery",
    bestFor: "Grief processing, life transitions, a deeper therapeutic layer",
    duration: "14 days",
    medical: "Grief processing, life-transition support",
    price: "from $1,960",
    location: "Phu Quoc, Vietnam",
  },
  {
    name: "Yoga & emotional reset",
    bestFor: "Stress held in the body, wanting movement-based release",
    duration: "7 days",
    medical: "Yoga, sound healing, water healing, no clinical component",
    price: "from $910",
    location: "Bali, Indonesia",
  },
  {
    name: "Fasting & mental clarity",
    bestFor: "Wanting a structured protocol, not just relaxation",
    duration: "7 days",
    medical: "Intermittent and extended fasting, meditation",
    price: "from $805",
    location: "Bali, Indonesia",
  },
  {
    name: "Group mindfulness reset",
    bestFor: "People who recover better with community and shared practice",
    duration: "7 days",
    medical: "Structured yoga, meditation, personal-growth workshops",
    price: "from $1,225",
    location: "Boracay, Philippines",
  },
  {
    name: "Short acute-stress reset",
    bestFor: "Immediate relief, minimal time commitment",
    duration: "3 days",
    medical: "Silent meditation, breathwork",
    price: "from $450",
    location: "Koh Phangan, Thailand",
  },
]

const ANXIETY_SLUGS = [
  "the-shells-resort-spa-phu-quoc-long-stay-mental-reset-21d",
  "the-shells-resort-spa-phu-quoc-emotional-recovery-14d",
  "udara-bali-yoga-detox-spa-emotional-reset-7d",
  "mokka-bali-fasting-clarity-7d",
  "movenpick-resort-spa-boracay-mindfulness-reset-7d",
  "why-nam-beach-meditation-reset-3d",
  "langkawi-nature-retreat-nature-detox-7d",
]

const FAQS = [
  {
    q: "Is this therapy, or a substitute for therapy?",
    a: "No. These are wellness travel programs, not clinical mental health treatment. They can create distance from stress triggers and support structured practices like breathwork and meditation, but they do not diagnose or treat anxiety disorders, PTSD or clinical depression. Dream Islands is a Destination Marketing Organization, not a medical institution, and this is not medical advice.",
  },
  {
    q: "What's the difference between an anxiety/stress retreat and a general wellness retreat?",
    a: "A general wellness retreat is built around broad relaxation — spa, food, scenery. A stress-recovery program is built specifically around down-regulating the nervous system: structured breathwork, meditation, movement or TCM, often with a therapeutic or facilitated-processing component, in either a solo or group format depending on the program.",
  },
  {
    q: "How long should I go for?",
    a: "A 3-day program can provide acute relief and a reset for immediate overwhelm. Most people see a more durable shift at 7 days, with time to actually process rather than just decompress. For deep, unresolved stress or a major life transition, 14–21 day programs go further into structured emotional recalibration.",
  },
  {
    q: "Should I go alone or with a group?",
    a: "Depends on what actually helps you. Some programs are explicitly community-based — shared workshops, group reflection — for people who recover better with peer support. Others are solitary and self-paced for people who need real distance from other people, not more social interaction.",
  },
]

export default async function AnxietyStressGuidePage() {
  const { data: rows } = await supabaseAdmin
    .from("programs")
    .select(
      "id, name, slug, summary, cohort, tier, duration_days, price_usd, outcomes, is_composite, hero_image_url, " +
        "program_properties(role, properties(id, name, island, country, contact_wa)), " +
        "program_variants(duration_days, duration_nights, price_basic_usd, price_vip_usd, active)",
    )
    .in("slug", ANXIETY_SLUGS)
    .eq("active", true)
    .eq("status", "published")

  const programs = ((rows ?? []) as unknown as DbProgramRow[]).map(mapProgram)
  const bySlug = new Map(programs.map((p) => [p.slug, p]))
  const orderedPrograms = ANXIETY_SLUGS.map((s) => bySlug.get(s)).filter((p): p is NonNullable<typeof p> => !!p)

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
          Anxiety and stress recovery retreats in <span className="display-italic">Asia</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          Real distance from what's driving the stress response, plus structured practice to come down from it.
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
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Signs you might need a stress recovery reset</h2>
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
        <section className="shell" style={{ paddingTop: 56 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Real matched programs</div>
              <h2>Actual anxiety &amp; stress recovery <span className="display-italic">programs</span>.</h2>
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
