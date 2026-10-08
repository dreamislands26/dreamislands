import Link from "next/link"
import type { Metadata } from "next"
import { Icon } from "../_components/Icon"

export const metadata: Metadata = {
  title: "Partnership / B2B / MICE",
  description: "Partner with Dream Islands — wellness property onboarding, B2B distribution, and MICE wellness programs across Asia.",
  alternates: { canonical: "/partners" },
  openGraph: {
    title: "Partnership / B2B / MICE | Dream Islands",
    description: "Wellness property onboarding, B2B distribution, and MICE wellness programs across Asia.",
    url: "https://dreamislands.org/partners",
  },
}

export const dynamic = "force-dynamic"

const OFFERINGS: Array<[string, string]> = [
  [
    "White label API",
    "Plug your property or clinic into Dream Islands' guest-matching and booking infrastructure — under your own brand. We handle intake, program matching and follow-up; you handle delivery.",
  ],
  [
    "Corporate retreats (MICE)",
    "Structured wellness offsites and incentive travel for companies — group programs, on-site coordination, and outcome reporting for HR and leadership teams.",
  ],
  [
    "Program & inventory packaging",
    "We help properties turn loose treatments and activities into standardized, bookable wellness programs — priced, scheduled, and ready to match against real guest demand.",
  ],
]

const WHY_PARTNER: Array<[string, string]> = [
  ["Less OTA dependency", "Guests come to you already matched by goal, not by who bid highest on an ad."],
  ["Real differentiation", "A standardized program framework instead of \"spa + yoga\" that looks the same everywhere."],
  ["Pre-qualified demand", "Every referral has already completed a Wellbeing & Wellness Score (WS) — no cold walk-ins."],
  ["Outcome data", "We track what guests actually experience, so you learn which programs perform and which don't."],
]

export default function PartnersPage() {
  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Partnership · B2B · MICE</div>
        <h1
          className="display"
          style={{ fontSize: "clamp(38px, 9vw, 64px)", margin: "0 0 20px", color: "var(--ink)" }}
        >
          Bring your property{" "}
          <span className="display-italic">into the network</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 44, maxWidth: 720 }}>
          Dream Islands works directly with wellness properties, activity providers, and corporate
          travel buyers across Asia — standardizing programs, matching pre-qualified
          guests to the right offering, and tracking outcomes over time.
        </p>

        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>What we offer</div>
            <h2>Three ways to <span className="display-italic">work with us</span>.</h2>
          </div>
        </div>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginBottom: 56 }}>
          {OFFERINGS.map(([t, b]) => (
            <div key={t} className="card" style={{ padding: 24 }}>
              <h3 style={{ margin: "0 0 10px", fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 22, color: "var(--ink)" }}>
                {t}
              </h3>
              <p className="body-sm" style={{ margin: 0 }}>{b}</p>
            </div>
          ))}
        </div>

        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Why partner with us</div>
            <h2>Built for <span className="display-italic">properties</span>, not just guests.</h2>
          </div>
        </div>
        <div className="card" style={{ padding: 28, marginBottom: 48 }}>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {WHY_PARTNER.map(([t, b]) => (
              <li key={t} style={{ display: "flex", gap: 12 }}>
                <span style={{ minWidth: 8, height: 8, borderRadius: 4, background: "var(--accent)", marginTop: 8 }} />
                <div>
                  <div style={{ fontWeight: 600, color: "var(--ink)" }}>{t}</div>
                  <div className="body-sm">{b}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Let&apos;s talk</div>
          <h2 style={{ marginBottom: 20 }}>Start a <span className="display-italic">partnership conversation</span>.</h2>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="https://wa.me/message/HOF2AFIBDYY5J1"
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary btn-lg"
            >
              <Icon.wa width={16} height={16} /> Message on WhatsApp
            </a>
            <a className="btn btn-ghost btn-lg" href="mailto:hello@dreamislands.org">
              hello@dreamislands.org
            </a>
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
        <div style={{ marginBottom: 16 }}>
          <p className="body-sm">Running a wellness property instead? <a href="/for-properties" style={{ color: "var(--accent)" }}>Explore the platform</a>.</p>
        </div>
          <Link href="/about" className="btn btn-ghost" style={{ padding: "10px 16px", fontSize: 13 }}>
            {"←"} About Dream Islands
          </Link>
        </div>
      </section>
    </div>
  )
}
