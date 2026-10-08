import Link from "next/link"
import type { Metadata } from "next"
export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Boost Energy Retreats in Asia",
  description:
    "A practical guide to boosting energy through wellness travel in Asia — signs of low energy worth addressing, what a retreat can and can't fix, and how to find the right starting point across Dream Islands' Asia-wide program catalogue.",
  alternates: { canonical: "/guides/boost-energy-retreats-asia" },
  openGraph: {
    title: "Boost Energy Retreats in Asia | Dream Islands",
    description:
      "Signs of low energy worth addressing, what a retreat can and can't fix, and how to find the right starting point across Asia.",
    url: "https://dreamislands.org/guides/boost-energy-retreats-asia",
  },
}
const SIGNS = [
  "Waking up tired no matter how much sleep you get",
  "Afternoon energy crashes that coffee doesn't fix",
  "Low motivation or drive that's crept in over months, not days",
  "Physically capable but mentally or energetically flat",
  "Wanting to feel more \"switched on\" day to day, without a specific problem to point to",
]
const CAN_DO = [
  "Several existing programs — sleep-focused resets, detox protocols, stress-recovery retreats — touch on energy indirectly, since fatigue is often downstream of poor sleep, chronic stress or metabolic load",
  "A free WS assessment can flag whether your energy issue is more of a sleep, stress or metabolic pattern, and point you to the program built for that root cause",
  "Structured environments — regular meals, daylight, movement, fewer screens — reliably shift energy for most people within days",
]
const CANNOT_DO = [
  "We don't yet have a program built specifically with energy as the primary, headline goal — we'd rather say that plainly than map you to something that's a loose fit",
  "Diagnose or treat a medical cause of fatigue, such as anemia, a thyroid condition or sleep apnea — that needs a physician",
  "Guarantee a specific energy outcome from any program",
]
const FAQS = [
  {
    q: "Do you have a program specifically for boosting energy?",
    a: "Not yet as a dedicated, purpose-built program. Dream Islands' catalogue is built around outcomes people book for directly, and today none of our programs are designed with energy as the primary, headline goal — most of the fatigue relief guests report comes as a side effect of a sleep, stress or metabolic reset. We'd rather tell you that clearly than stretch a loose match to look like a fit.",
  },
  {
    q: "Which existing programs would help with low energy?",
    a: "It depends on the root cause. If your fatigue tracks with poor sleep, the Sleep Reset guide is the more precise starting point. If it tracks with chronic stress or burnout, the Burnout Recovery guide is closer. If it's tied to weight or digestion, the Metabolic Health guide may fit better. The WS is the fastest way to work out which of these is actually driving your energy, rather than guessing.",
  },
  {
    q: "Will a dedicated energy program be added later?",
    a: "This is a new and still-growing part of our program taxonomy. As we add programs designed specifically around energy, they'll appear here with real matched options — we won't backfill this page with anything that isn't a genuine primary match.",
  },
]
export default function BoostEnergyGuidePage() {
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
        <div className="eyebrow" style={{ marginBottom: 12 }}>Outcome guide</div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 8vw, 60px)", margin: "0 0 20px", color: "var(--ink)", maxWidth: 900 }}>
          Boost energy through wellness travel in <span className="display-italic">Asia</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          Low energy usually has a root cause — sleep, stress or metabolic load — rather than being its
          own separate problem. Here's how to tell what's really driving it, what wellness travel can and
          can't do about it, and the fastest way to find the right starting point.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <Link href="/start" className="btn btn-primary btn-lg">
            Get your WS →
          </Link>
        </div>
      </section>
      {/* SIGNS */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Signs your energy is worth addressing</h2>
          <p className="body-sm" style={{ marginBottom: 16, color: "var(--ink-2)" }}>
            None of these are a diagnosis — they're common signals people describe before working out what's
            actually behind their fatigue.
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
            <h2 style={{ fontSize: 20, marginBottom: 14 }}>What wellness travel can do</h2>
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
            <h2 style={{ fontSize: 20, marginBottom: 14 }}>What it can't do — yet</h2>
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
      {/* WHERE TO START INSTEAD */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Where to start instead</div>
            <h2>Find the <span className="display-italic">real</span> root cause.</h2>
          </div>
        </div>
        <div className="card" style={{ padding: 28 }}>
          <p className="body-sm" style={{ marginBottom: 16, color: "var(--ink-2)" }}>
            Rather than guess, most guests get a faster and more accurate answer from one of these three
            starting points:
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
            <li className="body-sm" style={{ display: "flex", gap: 10 }}>
              <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--accent)", marginTop: 8 }} />
              <span>
                Fatigue tied to poor or unrestorative sleep →{" "}
                <Link href="/guides/sleep-reset-retreats-asia" style={{ color: "var(--accent-deep)", fontWeight: 600 }}>
                  Sleep and nervous system reset retreats
                </Link>
              </span>
            </li>
            <li className="body-sm" style={{ display: "flex", gap: 10 }}>
              <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--accent)", marginTop: 8 }} />
              <span>
                Fatigue tied to chronic stress or burnout →{" "}
                <Link href="/guides/burnout-recovery-retreats-southeast-asia" style={{ color: "var(--accent-deep)", fontWeight: 600 }}>
                  Burnout recovery retreats
                </Link>
              </span>
            </li>
            <li className="body-sm" style={{ display: "flex", gap: 10 }}>
              <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--accent)", marginTop: 8 }} />
              <span>
                Fatigue tied to weight, digestion or metabolic load →{" "}
                <Link href="/guides/metabolic-health-retreats-asia" style={{ color: "var(--accent-deep)", fontWeight: 600 }}>
                  Weight loss and metabolic health retreats
                </Link>
              </span>
            </li>
          </ul>
        </div>
      </section>
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
