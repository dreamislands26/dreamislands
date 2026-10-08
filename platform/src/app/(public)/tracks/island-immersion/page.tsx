import Link from "next/link"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import { mapProgram, type DbProgramRow } from "../../_lib/programMapping"
import ProgramCard from "../../_components/ProgramCard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Island Immersion Programs in Asia",
  description:
    "What the Island Immersion track actually involves — composite, longer-stay protocols combining Taiji, TCM, medical wellness and deep internal practice, who it's for, typical duration and price, and real matched programs in China.",
  alternates: { canonical: "/tracks/island-immersion" },
  openGraph: {
    title: "Island Immersion Programs in Asia | Dream Islands",
    description:
      "What Island Immersion involves, who it's for, programme types, duration, destinations and real matched programs across Asia.",
    url: "https://dreamislands.org/tracks/island-immersion",
  },
}

const WHAT_IT_INVOLVES = [
  "A composite protocol — several practices combined (Taiji, Qigong, TCM diagnosis, meditation, medical wellness) rather than one single focus",
  "A longer stay, typically 6-11 days, long enough to go past an initial reset into deeper conditioning",
  "Daily structured practice, often built around traditional Chinese wellness disciplines",
  "In several programs, a medical-wellness or diagnostic layer alongside the physical practice",
  "A full immersion in place — most Island Immersion programs are set in a single destination for the whole stay, not a multi-stop itinerary",
]

const WHO_ITS_FOR = [
  "You've done a shorter reset before and want to go deeper, not just repeat it",
  "You want a genuine immersion in one place and one practice, not a sampler of everything",
  "You have 6-11 days available and want to use all of it on a structured, composite protocol",
  "You're drawn to traditional Chinese wellness practice (Taiji, Qigong, TCM) as a serious discipline, not a one-off activity",
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
    name: "Composite reset (Koh Samui)",
    bestFor: "A full multi-pillar protocol without leaving Thailand",
    duration: "6 days",
    price: "from $1,500",
    location: "Koh Samui, Thailand",
  },
  {
    name: "Tai Chi & longevity protocol",
    bestFor: "A movement- and herb-based longevity approach",
    duration: "7 days",
    price: "from $1,800",
    location: "Wudang Mountain, China",
  },
  {
    name: "Deep recovery (medical wellness)",
    bestFor: "A comprehensive medical-wellness protocol with functional medicine",
    duration: "7 days",
    price: "from $4,500",
    location: "Mile, Yunnan, China",
  },
  {
    name: "Culture & TCM combined journey",
    bestFor: "Combining ancient-capital culture with TCM conditioning and Taiji",
    duration: "11 days",
    price: "from $920",
    location: "Xi'an & Wudang, China",
  },
  {
    name: "Deep internal practice",
    bestFor: "The most advanced protocol — inner alchemy and advanced Qigong",
    duration: "10 days",
    price: "from $3,200",
    location: "Wudang Mountain, China",
  },
]

const TRACK_SLUGS = [
  "performance-reset",
  "wudang-7-day-tai-chi-longevity",
  "mile-7d6n-deep-recovery",
  "xian-wudang-wellness-journey-11d",
  "wudang-10-day-deep-internal-practice",
]

const FAQS = [
  {
    q: "What does the Island Immersion track actually mean?",
    a: "It's the cohort of composite, longer-stay programs — 6-11 days, combining several practices (Taiji, TCM, medical wellness, meditation) into one structured protocol at a single destination, rather than a short single-focus reset.",
  },
  {
    q: "Is Island Immersion the same as a longer version of Reset & Recovery?",
    a: "Related but not the same. Reset & Recovery is about down-regulating from stress and depletion. Island Immersion is broader — it combines multiple practices and disciplines over a longer stay, often including traditional Chinese wellness practice as a serious, sustained discipline rather than a single detox protocol.",
  },
  {
    q: "Do I need prior experience with Taiji or Qigong?",
    a: "No. Most programs are structured for genuine beginners, with the most advanced protocol (10-Day Deep Internal Practice) recommended for people who've already done a shorter Wudang program and want to go deeper.",
  },
  {
    q: "Is the medical-wellness component in these programs a substitute for my own doctor?",
    a: "No. Where a program includes diagnostics or a medical-wellness layer, it's a proactive, preventive addition to the stay, not a substitute for ongoing care with your own physician. Dream Islands is a Destination Marketing Organization, not a medical institution, and this is not medical advice.",
  },
]

export default async function IslandImmersionTrackPage() {
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
          Island Immersion <span className="display-italic">programs in Asia</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          Composite, longer-stay protocols. Here's what this track actually involves, who it's for,
          the programme types available across Asia, and which real programs match.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <Link href="/start" className="btn btn-primary btn-lg">
            Get your WS →
          </Link>
          <Link href="/programs?track=Immersion" className="btn btn-ghost btn-lg">
            Browse all Island Immersion programs
          </Link>
        </div>
          <div style={{ display: "flex", gap: 16, marginTop: 28, flexWrap: "wrap" }}><img src="/mascots/dreamer_island-immersion_cultural-forest_woman.png" alt="" style={{ width: 140, height: "auto" }} /><img src="/mascots/dreamer_island-immersion_explorer_man.png" alt="" style={{ width: 140, height: "auto" }} /></div>
      </section>

      {/* WHAT IT INVOLVES */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>What this track actually involves</h2>
          <p className="body-sm" style={{ marginBottom: 16, color: "var(--ink-2)" }}>
            The specifics vary by program and destination, but Island Immersion programs share a common shape.
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {WHAT_IT_INVOLVES.map((s) => (
              <li key={s} style={{ display: "flex", gap: 10 }}>
                <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--accent)", marginTop: 8 }} />
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
                <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--accent)", marginTop: 8 }} />
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
              <h2>Actual Island Immersion <span className="display-italic">programs</span>.</h2>
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
