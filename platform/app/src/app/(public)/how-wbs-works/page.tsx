import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "How the Wellbeing & Wellness Score (WS) Works",
  description: "23 questions across 6 sections produce your Wellbeing & Wellness Score (WS) and match you to one of six wellness program focus areas.",
  alternates: { canonical: "/how-wbs-works" },
  openGraph: {
    title: "How the Wellbeing & Wellness Score (WS) Works | Dream Islands",
    description: "23 questions across 6 sections produce your Wellbeing & Wellness Score (WS) and match you to one of six wellness program focus areas.",
    url: "https://dreamislands.org/how-wbs-works",
  },
}

const SECTIONS = [
  { label: "Your Goal", detail: "One question about what brought you here - it sets your starting focus area." },
  { label: "Movement & Physical Load", detail: "Steps, cardio minutes, strength training, muscle mass, endurance training." },
  { label: "Sleep & Recovery", detail: "Sleep duration, sleep quality, daytime energy, ability to disconnect." },
  { label: "Lifestyle & Risk", detail: "Smoking, alcohol, processed meat, digestive comfort." },
  { label: "Social & Emotional", detail: "Quality time with close people, relationship satisfaction, stress, life satisfaction." },
  { label: "Body & Medical Context", detail: "Sex, age, height and weight, cardiovascular and cancer history." },
]

const FAQS = [
  {
    q: "Is the Wellbeing & Wellness Score a medical diagnosis?",
    a: "No. Dream Islands operates as a Destination Marketing Organization promoting wellness travel. We do not provide medical or psychiatric services and are not a medical institution. WS is a self-reported wellness assessment used to personalize program recommendations.",
  },
  {
    q: "How many questions are in the assessment?",
    a: "23 questions across 6 sections, plus a height and weight entry used to calculate BMI as part of the Metabolic subscale.",
  },
  {
    q: "Does an AI decide my program?",
    a: "No. Matching uses a fixed, rules-based scoring formula - your stated goal plus your four subscale scores are checked against a lookup table of six focus areas, not a machine-learning model.",
  },
  {
    q: "What happens if my score triggers a medical review?",
    a: "Certain answers - such as a cancer history, heavy alcohol use, or a very low subscale score - automatically flag your assessment so our team reviews it before any program is confirmed.",
  },
]


export default function HowWbsWorksPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to take the Dream Islands Wellbeing & Wellness Score (WS) assessment",
    description:
      "23 questions across 6 sections produce your Wellness Baseline Score (WBS) and match you to a wellness program.",
    totalTime: "PT5M",
    step: [
      ...SECTIONS.map((s) => ({
        "@type": "HowToStep",
        name: s.label,
        text: s.detail,
      })),
      {
        "@type": "HowToStep",
        name: "Get your matched program",
        text:
          "Your initial focus area plus your subscale scores are checked against a fixed, rules-based scoring formula to recommend a program and stay length.",
      },
    ],
  }

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Our methodology</div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 8vw, 60px)", margin: "0 0 20px", color: "var(--ink)" }}>
          How the score is <span className="display-italic">built</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 40, maxWidth: 700 }}>
          Your <Link href="/wellness-baseline-score" style={{ color: "var(--accent)" }}>Wellbeing &amp; Wellness Score (WS)</Link> comes from 23 short questions across 6 sections, taking about 2 minutes to complete.
        </p>

        <div className="card" style={{ padding: 28, marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>The six sections</h2>
          <div style={{ display: "grid", gap: 14 }}>
            {SECTIONS.map((s) => (
              <div key={s.label}>
                <strong>{s.label}</strong>
                <div className="body-sm">{s.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 28, marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>From answers to a program</h2>
          <p className="body-sm">
            Your first answer sets an initial focus area - Body & Detox, Sleep & Recovery, Weight & Metabolic
            Health, Beauty & Aesthetics, Longevity, or Performance & Energy. That focus area, combined with your
            subscale scores, determines a recommended program and stay length through a fixed, rules-based
            scoring formula - not a machine-learning model. If you skip the goal question, we route you by
            whichever subscale scored lowest.
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>Frequently asked</h2>
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
        </div>

        <Link href="/start" className="btn btn-primary" style={{ display: "inline-flex" }}>
          Take the assessment {"→"}
        </Link>
      </section>
    </div>
  )
}
