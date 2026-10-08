import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Wellbeing & Wellness Score (WS)",
  description: "The Wellbeing & Wellness Score (WS) is Dream Islands proprietary 0-100 wellness assessment, combining Body, Recovery, Metabolic Health and Mind subscales to personalize your retreat program.",
  alternates: { canonical: "/wellness-baseline-score" },
  openGraph: {
    title: "Wellbeing & Wellness Score (WS) | Dream Islands",
    description: "A proprietary 0-100 wellness assessment used to personalize your retreat program.",
    url: "https://dreamislands.org/wellness-baseline-score",
  },
}

export default function WbsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "@id": "https://dreamislands.org/wellness-baseline-score#term",
    name: "Wellbeing & Wellness Score (WS)",
    alternateName: "WS",
    description: "A proprietary 0-100 wellness assessment developed by Dream Islands, combining four weighted subscales - Body, Recovery, Metabolic Health, and Mind - plus a Risk factor, used to personalize wellness travel program recommendations.",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "Dream Islands Wellness Methodology",
      url: "https://dreamislands.org",
    },
    url: "https://dreamislands.org/wellness-baseline-score",
  }

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Our methodology</div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 8vw, 60px)", margin: "0 0 20px", color: "var(--ink)" }}>
          Your Wellbeing &amp; Wellness <span className="display-italic">Score</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 40, maxWidth: 700 }}>
          WS is a 0-100 score calculated from a short self-reported assessment, used to personalize
          which program and duration we recommend. It is not a medical diagnosis - Dream Islands is a
          Destination Marketing Organization, not a medical institution.
        </p>

        <div className="card" style={{ padding: 28, marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>Four subscales, one total</h2>
          <p className="body-sm" style={{ marginBottom: 16 }}>
            Your answers are combined into four weighted subscales, plus a separate Risk factor:
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            <div><strong>Body</strong> (20%) - movement, strength training, muscle mass, and general physical load.</div>
            <div><strong>Recovery</strong> (25%) - sleep duration and quality, daytime energy, and ability to disconnect.</div>
            <div><strong>Metabolic</strong> (20%) - BMI, alcohol intake, processed food, and digestive comfort.</div>
            <div><strong>Mind</strong> (20%) - stress, life satisfaction, relationships, and quality time.</div>
            <div><strong>Risk</strong> (15%, inverted) - smoking, alcohol, diet, age, and medical history.</div>
          </div>
        </div>

        <div className="card" style={{ padding: 28, marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>Confidence and medical safety</h2>
          <p className="body-sm">
            Each score comes with a confidence rating (40-95) that drops slightly for every not sure
            answer. Certain answers - a cancer history, heavy alcohol use, or a very low subscale score -
            automatically flag your assessment for medical review before any program is confirmed.
          </p>
        </div>

        <Link href="/how-wbs-works" className="btn btn-primary" style={{ display: "inline-flex" }}>
          See how the assessment works {"→"}
        </Link>
      </section>
    </div>
  )
}
