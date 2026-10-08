import Link from "next/link"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import { mapProgram, type DbProgramRow } from "../../_lib/programMapping"
import ProgramCard from "../../_components/ProgramCard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Reset & Recovery Programs in Asia",
  description:
    "What the Reset & Recovery track actually involves — detox protocols, sleep and nervous-system work, who it's for, typical duration and price, and real matched programs across Thailand, Singapore, Malaysia and China.",
  alternates: { canonical: "/tracks/reset-recovery" },
  openGraph: {
    title: "Reset & Recovery Programs in Asia | Dream Islands",
    description:
      "What Reset & Recovery involves, who it's for, programme types, duration, destinations and real matched programs across Asia.",
    url: "https://dreamislands.org/tracks/reset-recovery",
  },
}

const WHAT_IT_INVOLVES = [
  "A structured detox protocol — diet, cleanse, TCM or spa treatments — aimed at measurable markers like inflammation, energy and sleep quality",
  "Daily clinical or wellness sessions rather than unstructured downtime",
  "A circadian reset: consistent sleep-wake timing, light exposure, and often a screen-free wind-down",
  "In several programs, a biometric or diagnostic baseline you can track against",
  "A concrete take-home protocol, not just a few relaxed days away",
]

const WHO_ITS_FOR = [
  "You're running on chronic fatigue that a normal weekend doesn't fix",
  "You want a genuine physical reset — detox, sleep, inflammation — before addressing anything else",
  "You're dealing with burnout or sustained stress and need to interrupt the pattern, not just rest inside it",
  "You want a structured, clinically-informed protocol rather than an unstructured spa holiday",
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
    name: "Structured multi-stage detox",
    bestFor: "First-timers who want a proven, flexible-length protocol",
    duration: "10 days",
    price: "from $2,085",
    location: "Koh Samui, Thailand",
  },
  {
    name: "Mountain TCM recovery",
    bestFor: "Deeper digital detox with traditional Chinese medicine diagnosis",
    duration: "5 days",
    price: "from $2,000",
    location: "Wudang Mountain, China",
  },
  {
    name: "Urban executive reset",
    bestFor: "C-suite and founders who can't take a long trip away",
    duration: "5 days",
    price: "from $1,700",
    location: "Singapore",
  },
  {
    name: "Nature / forest detox",
    bestFor: "Lower-cost entry point, less clinical, more nature-led",
    duration: "5 days",
    price: "from $600",
    location: "Penang, Malaysia",
  },
  {
    name: "Medical-grade hot springs reset",
    bestFor: "Combining detox with a functional-medicine introduction",
    duration: "5 days",
    price: "from $2,200",
    location: "Mile, Yunnan, China",
  },
]

const TRACK_SLUGS = [
  "detox-reset",
  "wudang-executive-burnout-recovery",
  "como-shambala-executive-burnout-reset-5d",
  "happi-village-penang-forest-detox-5n",
  "mile-5d4n-wellness-escape",
]

const FAQS = [
  {
    q: "What does \"Reset & Recovery\" actually mean as a track?",
    a: "It's the cohort of programs built around a structured physical reset — detox, sleep architecture, nervous-system down-regulation — rather than fitness performance, emotional processing, or a longer composite protocol. Most run 3-10 days and combine a clinical or TCM component with daily structure.",
  },
  {
    q: "Is Reset & Recovery the same as a detox retreat?",
    a: "Overlapping but not identical. Every program in this track has some detox or reset component, but some lean more toward burnout recovery and sleep specifically, others toward general physical detox. The programme comparison above shows the range.",
  },
  {
    q: "How is this different from the Performance track?",
    a: "Reset & Recovery is about down-regulating — undoing accumulated stress and depletion. Performance is about building capacity back up once you're not running on empty. Some people do a Reset & Recovery program first, then a Performance program later.",
  },
  {
    q: "Do these programs involve medical treatment?",
    a: "Some include a medical or TCM diagnostic component (bloodwork, biometric baseline, TCM consultation); none provide medical treatment or diagnosis of a clinical condition. Dream Islands is a Destination Marketing Organization, not a medical institution, and this is not medical advice.",
  },
]

export default async function ResetRecoveryTrackPage() {
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
          Reset &amp; Recovery <span className="display-italic">programs in Asia</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          Down-regulate, detox, re-sleep. Here's what this track actually involves, who it's for,
          the programme types available across Asia, and which real programs match.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <Link href="/start" className="btn btn-primary btn-lg">
            Get your WS →
          </Link>
          <Link href="/programs?track=Reset" className="btn btn-ghost btn-lg">
            Browse all Reset & Recovery programs
          </Link>
        </div>
          <div style={{ display: "flex", gap: 16, marginTop: 28, flexWrap: "wrap" }}><img src="/mascots/dreamer_reset-recovery_iv-therapy_woman.png" alt="" style={{ width: 140, height: "auto" }} /><img src="/mascots/dreamer_reset-recovery_doctor-blood-panel_man.png" alt="" style={{ width: 140, height: "auto" }} /></div>
      </section>

      {/* WHAT IT INVOLVES */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>What this track actually involves</h2>
          <p className="body-sm" style={{ marginBottom: 16, color: "var(--ink-2)" }}>
            The specifics vary by program and destination, but Reset & Recovery programs share a common shape.
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {WHAT_IT_INVOLVES.map((s) => (
              <li key={s} style={{ display: "flex", gap: 10 }}>
                <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--reset)", marginTop: 8 }} />
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
                <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--reset)", marginTop: 8 }} />
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
              <h2>Actual Reset &amp; Recovery <span className="display-italic">programs</span>.</h2>
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
    </div>
  )
}
