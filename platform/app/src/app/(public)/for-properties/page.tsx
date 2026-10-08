import Link from "next/link"
import type { Metadata } from "next"
import PlatformTabs from "./_components/PlatformTabs"
import DemoForm from "./_components/DemoForm"
import { PageViewTracker, ViewTracker, TrackedAnchor, TrackedLink } from "./_components/Analytics"

export const metadata: Metadata = {
  title: "Wellness Platform for Hotels, Resorts & Retreats",
  description:
    "Qualify wellness guests, configure tailored programs, coordinate practitioners and build repeat journeys with the Dream Islands platform.",
  alternates: { canonical: "/for-properties" },
  openGraph: {
    title: "Wellness Platform for Hotels, Resorts & Retreats | Dream Islands",
    description:
      "Qualify wellness guests, configure tailored programs, coordinate practitioners and build repeat journeys with the Dream Islands platform.",
    url: "https://dreamislands.org/for-properties",
  },
}

const PROBLEM_POINTS = [
  "Guest goals and constraints arrive through manual sales conversations.",
  "Fixed packages require manual changes after booking.",
  "Practitioner capacity sits outside the guest journey.",
  "Progress and satisfaction disappear between departments.",
  "Checkout ends the relationship before the next journey is defined.",
]

const WORKFLOW: Array<[string, string, string]> = [
  ["01", "Qualify", "Capture goal, travel dates, preferences, intensity and relevant constraints."],
  ["02", "Plan", "Configure an approved program with suitable services and experiences."],
  ["03", "Resource", "Assign practitioners and confirm delivery capacity."],
  ["04", "Deliver", "Coordinate the stay, check-ins and operational actions."],
  ["05", "Continue", "Record the next recommendation and create a reason to return."],
]

const PROPERTY_JOBS: Array<[string, string, string]> = [
  ["Track guest progress", "Track guest goals, check-ins and agreed progress signals.", "/mascots/dreamer_partner_guest-performance_tracking.png"],
  ["Manage practitioners", "Manage practitioners, ownership and delivery capacity.", "/mascots/dreamer_partner_practitioner-management.png"],
  ["Build tailored packages", "Create tailored experiences and packages from approved components.", "/mascots/dreamer_partner_tailored-experiences-packages.png"],
  ["Operationalize sleep & recovery", "Make sleep and recovery part of operational delivery.", "/mascots/dreamer_partner_quality-sleep.png"],
  ["See revenue clearly", "Improve conversion, repeat journeys and revenue visibility.", "/mascots/dreamer_partner_revenue-growth.png"],
]

const CONTROL: { coordinates: string[]; controls: string[] } = {
  coordinates: [
    "Program and content structure",
    "Guest qualification and journey handoff",
    "Platform workflow",
    "Permissioned insights as the product develops",
  ],
  controls: [
    "Guest suitability and practitioner judgment",
    "Program design",
    "Availability and capacity",
    "Pricing and commercial terms",
    "On-site delivery",
  ],
}

const PARTNER_FIT = [
  "Properties with a real wellness program, not only rooms and amenities.",
  "Teams with named practitioners, modalities, diagnostics or structured protocols.",
  "Properties seeking qualified demand and repeat journeys.",
  "Teams willing to maintain accurate program and availability information.",
]

const FAQ: Array<[string, string]> = [
  [
    "How is this different from the existing Partnerships / B2B / MICE page?",
    "/partners covers the broader partnership ecosystem — MICE, corporate retreats, activity providers, white-label/API and general partnership enquiries. This page is for wellness properties and resorts that want to run structured wellness programs on the Dream Islands platform.",
  ],
  [
    "What part of the platform is live today?",
    "The core operating system — admin, partner and user views managing supply, programs, bookings and guest journeys — is live production software today. Wellness Intelligence, the guest and partner insight dashboards, is a product prototype built on real, anonymized production data.",
  ],
  [
    "What does implementation require from our property?",
    "Accurate, current program and availability information, and named practitioners or modalities on file.",
  ],
  [
    "Does the platform require PMS or medical-record integration?",
    "No. Programs, availability and practitioner information are managed directly in the platform.",
  ],
  [
    "Who controls guest suitability and program delivery?",
    "The property. Dream Islands coordinates qualification, journey handoff and platform workflow — the property retains guest suitability and practitioner judgment, program design, availability, pricing and on-site delivery.",
  ],
  [
    "What guest information can a partner see?",
    "Aggregated satisfaction and program-performance insight by default. Individual guest progress is visible only where the guest has given consent and the property has permission.",
  ],
  [
    "How does the commercial model work?",
    "Commercial terms are set directly with each property during onboarding.",
  ],
  [
    "What is Wellness Intelligence and when will it be available?",
    "The next product layer, turning guest, program and journey data into longitudinal insight for both guests and partners — currently a product prototype built on real, anonymized data.",
  ],
]

export default function ForPropertiesPage() {
  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <PageViewTracker event="platform_page_view" />
      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>For Wellness Properties</div>
        <h1 className="display" style={{ fontSize: "clamp(34px, 8vw, 58px)", margin: "0 0 20px", color: "var(--ink)" }}>
          Run every wellness stay as a{" "}
          <span className="display-italic">program</span>, not a package code.
        </h1>
        <p className="body-lg" style={{ marginBottom: 28, maxWidth: 680 }}>
          Dream Islands gives wellness properties one operating layer to qualify guests, tailor the
          journey, coordinate practitioners, follow delivery and turn a successful stay into the next
          journey.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <TrackedAnchor href="#demo" event="platform_demo_click" className="btn btn-primary btn-lg">
            Request a platform demo
          </TrackedAnchor>
          <a href="#live-platform" className="btn btn-ghost btn-lg">See the platform</a>
        </div>
        <p className="body-sm" style={{ marginBottom: 56 }}>
          Looking for corporate retreats, MICE or another partnership model?{" "}
          <TrackedLink href="/partners" event="partners_crosslink_click" className="footer-link">
            Explore partnerships.
          </TrackedLink>
        </p>

        {/* Problem */}
        <div className="section-head">
          <div>
            <h2>Your booking engine knows the room.<br />It does not know the <span className="display-italic">guest&apos;s goal</span>.</h2>
          </div>
        </div>
        <div className="card" style={{ padding: 28, marginBottom: 56 }}>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
            {PROBLEM_POINTS.map((p) => (
              <li key={p} style={{ display: "flex", gap: 12 }}>
                <span style={{ minWidth: 8, height: 8, borderRadius: 4, background: "var(--accent)", marginTop: 8 }} />
                <span className="body-sm">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Workflow */}
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>How it works</div>
            <h2>One connected <span className="display-italic">operational flow</span>.</h2>
          </div>
        </div>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 56 }}>
          {WORKFLOW.map(([n, t, b]) => (
            <div key={t} className="card" style={{ padding: 20 }}>
              <div className="eyebrow" style={{ marginBottom: 10, color: "var(--accent)" }}>{n}</div>
              <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 20, color: "var(--ink)" }}>{t}</h3>
              <p className="body-sm" style={{ margin: 0 }}>{b}</p>
            </div>
          ))}
        </div>

        {/* Live platform proof */}
        <div id="live-platform" className="section-head" style={{ scrollMarginTop: 24 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Live platform</div>
            <h2>The Dream Islands platform <span className="display-italic">is live</span>.</h2>
            <p className="body-sm" style={{ marginTop: 8, maxWidth: 600 }}>
              One operating system connects supply, programs, bookings and guest journeys across the network.
            </p>
          </div>
        </div>
        <div style={{ marginBottom: 56 }}>
          <PlatformTabs />
        </div>

        {/* Property jobs */}
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>For your team</div>
            <h2>Five jobs the platform <span className="display-italic">supports</span>.</h2>
          </div>
        </div>
        <ViewTracker event="platform_capability_view">
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginBottom: 56 }}>
            {PROPERTY_JOBS.map(([t, b, img]) => (
              <div key={t} className="card" style={{ padding: 22 }}>
                <img src={img} alt="" style={{ width: "100%", maxWidth: 180, height: "auto", marginBottom: 14 }} />
                <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 20, color: "var(--ink)" }}>{t}</h3>
                <p className="body-sm" style={{ margin: 0 }}>{b}</p>
              </div>
            ))}
          </div>
        </ViewTracker>

        {/* Wellness Intelligence */}
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>What&apos;s next</div>
            <h2>The live platform creates the foundation for <span className="display-italic">wellness intelligence</span>.</h2>
          </div>
        </div>
        <div className="card" style={{ padding: 28, marginBottom: 20 }}>
          <p className="body-sm" style={{ marginBottom: 16 }}>
            <strong style={{ color: "var(--ink)" }}>Live product:</strong> the operating panel above.{" "}
            <strong style={{ color: "var(--ink)" }}>Product prototype:</strong> the Wellness Intelligence
            dashboard below, built on real, anonymized production data.
          </p>
          <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            <div>
              <h3 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 18, color: "var(--ink)" }}>My Wellness Journey</h3>
              <p className="body-sm" style={{ margin: 0 }}>The guest sees how wellbeing changes before, during and after a journey.</p>
            </div>
            <div>
              <h3 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 18, color: "var(--ink)" }}>Program & Guest Insights</h3>
              <p className="body-sm" style={{ margin: 0 }}>The partner sees aggregated program performance, plus only the individual information permitted by guest consent.</p>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 56 }}>
          {["Product prototype", "Production data", "Aggregate pattern", "Not yet collected", "Future integration"].map((l) => (
            <span
              key={l}
              className="eyebrow"
              style={{ padding: "6px 12px", borderRadius: 999, border: "1px solid var(--border, #e6e9e7)", fontSize: 11 }}
            >
              {l}
            </span>
          ))}
        </div>

        {/* What properties control */}
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Boundaries</div>
            <h2>What each side <span className="display-italic">controls</span>.</h2>
          </div>
        </div>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginBottom: 56 }}>
          <div className="card" style={{ padding: 24 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Dream Islands coordinates</div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
              {CONTROL.coordinates.map((c) => (
                <li key={c} className="body-sm">{c}</li>
              ))}
            </ul>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>The property controls</div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
              {CONTROL.controls.map((c) => (
                <li key={c} className="body-sm">{c}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Partner fit */}
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Fit</div>
            <h2>Who this is <span className="display-italic">for</span>.</h2>
          </div>
        </div>
        <div className="card" style={{ padding: 28, marginBottom: 56 }}>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
            {PARTNER_FIT.map((p) => (
              <li key={p} style={{ display: "flex", gap: 12 }}>
                <span style={{ minWidth: 8, height: 8, borderRadius: 4, background: "var(--accent)", marginTop: 8 }} />
                <span className="body-sm">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* FAQ */}
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>FAQ</div>
            <h2>Common <span className="display-italic">questions</span>.</h2>
          </div>
        </div>
        <div style={{ display: "grid", gap: 10, marginBottom: 56 }}>
          {FAQ.map(([q, a]) => (
            <details key={q} className="card" style={{ padding: 18 }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--ink)", fontSize: 15 }}>{q}</summary>
              <p className="body-sm" style={{ margin: "12px 0 0" }}>{a}</p>
            </details>
          ))}
        </div>

        {/* Form */}
        <div id="demo" className="section-head" style={{ scrollMarginTop: 24 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Get started</div>
            <h2>Show us one program you want to <span className="display-italic">improve</span>.</h2>
          </div>
        </div>
        <DemoForm />

        <div style={{ marginTop: 32 }}>
          <TrackedLink href="/partners" event="partners_crosslink_click" className="btn btn-ghost">
            Explore other partnership models →
          </TrackedLink>
        </div>
      </section>
    </div>
  )
}
