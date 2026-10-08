import Link from "next/link"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import { mapProgram, type DbProgramRow } from "../../_lib/programMapping"
import ProgramCard from "../../_components/ProgramCard"
export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Sport & Chill Programs in Asia",
  description:
    "What the Sport & Chill track actually involves — structured activity plus recovery for guests who want an active holiday, not a program to fix something. Who it's for, real matched programs in Singapore, and where the category goes next.",
  alternates: { canonical: "/tracks/sport-chill" },
  openGraph: {
    title: "Sport & Chill Programs in Asia | Dream Islands",
    description:
      "An active, restorative holiday — sport, recovery and leisure, no problem to fix. Who it's for, real matched programs and what's next for the category.",
    url: "https://dreamislands.org/tracks/sport-chill",
  },
}
const WHAT_IT_INVOLVES = [
  "Real activity, not just a spa week — structured runs, monitored open-water swimming, sports festivals built around the resort's own sporting infrastructure",
  "Recovery built in alongside the activity, not instead of it — spa sessions, a guided performance review, downtime between activity blocks",
  "No diagnostics, no biomarker panels, no take-home protocol — this track is paced as a holiday, not a health intervention",
  "An easy, short-haul location for a quick escape — currently Sentosa, Singapore, close to the city",
  "A newer, growing category — expect more activity types and destinations added over time as it expands beyond today's single property",
]
const WHO_ITS_FOR = [
  "You're already reasonably healthy and just want a better holiday than a standard beach resort — more movement, more structure, still relaxing",
  "You want a short, easy trip rather than a longer wellness protocol",
  "You like the idea of wellness travel but don't want to be assessed, diagnosed or put through a program",
  "You want some real activity and some real downtime in the same trip, without picking one or the other",
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
    name: "Sport & Chill, short break",
    bestFor: "A quick active escape from Singapore city — running tracks, monitored open-water swimming, sports festivals",
    duration: "3 days",
    price: "from $840",
    location: "Sentosa, Singapore",
  },
  {
    name: "Sport & Chill, with recovery",
    bestFor: "The same activity base, plus structured spa recovery and a guided performance review",
    duration: "5 days",
    price: "from $1,350",
    location: "Sentosa, Singapore",
  },
]
const TRACK_SLUGS = [
  "village-hotel-sentosa-sport-chill-3d",
  "village-hotel-sentosa-sport-chill-5d",
]
const FAQS = [
  {
    q: "Is Sport & Chill a wellness program or just an active holiday?",
    a: "It's positioned as an active holiday first. There's no diagnostic assessment, no biomarker panel and no take-home protocol — just structured activity (running, swimming, sports festivals) with recovery time built in, for guests who want to move more on a trip without entering a formal wellness program.",
  },
  {
    q: "Do I need to be fit or athletic to join?",
    a: "No. The activity is structured but not competitive — it's built for guests who want an active break, not for training toward a specific event. If you're looking for structured training or event prep specifically, the Performance track is the better fit.",
  },
  {
    q: "How is this different from the Performance track?",
    a: "Performance is built around training capacity, diagnostics and event prep — it assumes you're working toward a specific fitness or health goal. Sport & Chill assumes the opposite: you're already fine and just want a more active version of a normal holiday.",
  },
  {
    q: "Where is Sport & Chill available today?",
    a: "Currently at Village Hotel Sentosa in Singapore, as a 3-day or 5-day stay. This is a new track for Dream Islands, and we expect to add more destinations and activity types over time.",
  },
]
export default async function SportChillTrackPage() {
  const { data: rows } = await supabaseAdmin
    .from("programs")
    .select(
      "id, name, slug, summary, cohort, tier, duration_days, price_usd, outcomes, is_composite, hero_image_url, " +
        "program_properties(role, properties(id, name, island, country, contact_wa)), " +
        "program_variants(duration_days, duration_nights, price_basic_usd, price_vip_usd, active)",
    )
    .in("slug", TRACK_SLUGS)
    .eq("active", true)
    .eq("status", "published")
  const programs = ((rows ?? []) as unknown as DbProgramRow[]).map(mapProgram)
  const bySlug = new Map(programs.map((p) => [p.slug, p]))
  const orderedPrograms = TRACK_SLUGS.map((s) => bySlug.get(s)).filter((p): p is NonNullable<typeof p> => !!p)
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
        <div className="eyebrow" style={{ marginBottom: 12 }}>Track guide</div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 8vw, 60px)", margin: "0 0 20px", color: "var(--ink)", maxWidth: 900 }}>
          Sport & Chill <span className="display-italic">programs in Asia</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          An active, restorative holiday — not a program to fix something. Here's what this track
          actually involves, who it's for, the programme types available, and which real programs match.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <Link href="/start" className="btn btn-primary btn-lg">
            Get your WS →
          </Link>
          <Link href="/programs?track=SportChill" className="btn btn-ghost btn-lg">
            Browse all Sport & Chill programs
          </Link>
        </div>
          <div style={{ display: "flex", gap: 16, marginTop: 28, flexWrap: "wrap" }}><img src="/mascots/dreamer_sport-chill_paddleboard_woman.png" alt="" style={{ width: 140, height: "auto" }} /><img src="/mascots/dreamer_sport-chill_beach-volleyball_man.png" alt="" style={{ width: 140, height: "auto" }} /></div>
      </section>
      {/* WHAT IT INVOLVES */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>What this track actually involves</h2>
          <p className="body-sm" style={{ marginBottom: 16, color: "var(--ink-2)" }}>
            The specifics vary as the category grows, but Sport & Chill programs share a common shape.
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {WHAT_IT_INVOLVES.map((s) => (
              <li key={s} style={{ display: "flex", gap: 10 }}>
                <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--sport)", marginTop: 8 }} />
                <span className="body-sm">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      {/* WHO IT'S FOR */}
      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>Who it's for</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {WHO_ITS_FOR.map((c) => (
              <li key={c} className="body-sm" style={{ display: "flex", gap: 10 }}>
                <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--sport)", marginTop: 8 }} />
                {c}
              </li>
            ))}
          </ul>
          <p className="body-sm" style={{ marginTop: 14, color: "var(--ink-3)", fontStyle: "italic" }}>
            Dream Islands is a Destination Marketing Organization promoting wellness travel — not a medical
            institution. This is not medical advice.
          </p>
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
        <section className="shell" style={{ paddingTop: 56 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Real matched programs</div>
              <h2>Actual Sport & Chill <span className="display-italic">programs</span>.</h2>
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
            background: "var(--sport)",
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
    </div>
  )
}
