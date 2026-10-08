import Link from "next/link"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import { mapProgram, type DbProgramRow } from "../../_lib/programMapping"
import ProgramCard from "../../_components/ProgramCard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Mind Balance Programs in Asia",
  description:
    "What the Mind Balance track actually involves — meditation, yoga, digital detox and nervous-system regulation, who it's for, typical duration and price, and real matched programs across Thailand, Indonesia, Malaysia and China.",
  alternates: { canonical: "/tracks/mind-balance" },
  openGraph: {
    title: "Mind Balance Programs in Asia | Dream Islands",
    description:
      "What Mind Balance involves, who it's for, programme types, duration, destinations and real matched programs across Asia.",
    url: "https://dreamislands.org/tracks/mind-balance",
  },
}

const WHAT_IT_INVOLVES = [
  "Daily meditation, breathwork or yoga practice — structured, not optional add-ons",
  "In several programs, a digital-detox component: no screens, structured silence",
  "TCM diagnosis, sound healing or other nervous-system down-regulation practices depending on the program",
  "Space and trained facilitators to actually process what's going on, not just distract from it",
  "A specific take-home practice, not just the memory of feeling calmer for a week",
]

const WHO_ITS_FOR = [
  "Racing thoughts or a mind that won't switch off, even on days off",
  "Sleep that's technically long enough but doesn't feel restorative",
  "A recent life transition, loss, or prolonged high-stress period with no real recovery since",
  "You want to calm the nervous system and restore focus, not build fitness or diagnose a medical condition",
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
    name: "Dedicated sleep & nervous-system protocol",
    bestFor: "People whose main issue is sleep architecture specifically",
    duration: "8 days",
    price: "from $1,790",
    location: "Koh Samui, Thailand",
  },
  {
    name: "Short mind-reset intro",
    bestFor: "First-timers wanting a low-commitment introduction to Daoist practice",
    duration: "3 days",
    price: "from $650",
    location: "Wudang Mountain, China",
  },
  {
    name: "Yoga detox",
    bestFor: "Stress held in the body, wanting movement-based release",
    duration: "5 days",
    price: "from $675",
    location: "Bali, Indonesia",
  },
  {
    name: "Meditation-led reset",
    bestFor: "Lower-cost, nature-based nervous-system down-regulation",
    duration: "5 days",
    price: "from $750",
    location: "Koh Phangan, Thailand",
  },
  {
    name: "Full digital detox",
    bestFor: "Screen-driven overstimulation and a racing mind",
    duration: "10 days",
    price: "from $1,050",
    location: "Langkawi, Malaysia",
  },
]

const TRACK_SLUGS = [
  "sleep-nervous-system-reset",
  "wudang-3-day-mind-reset",
  "udara-bali-yoga-detox-spa-yoga-detox-5d",
  "why-nam-beach-meditation-reset-5d",
  "langkawi-nature-retreat-digital-detox-10d",
]

const FAQS = [
  {
    q: "What does the Mind Balance track actually mean?",
    a: "It's the cohort of programs built around calming the nervous system and restoring focus — meditation, yoga, digital detox, sleep and stress-recovery work — rather than physical detox (Reset & Recovery) or training capacity (Performance).",
  },
  {
    q: "Is this therapy, or a substitute for therapy?",
    a: "No. These are wellness travel programs, not clinical mental health treatment. They can support structured practices like meditation and breathwork and create real distance from stress triggers, but they do not diagnose or treat anxiety disorders, PTSD or clinical depression. Dream Islands is a Destination Marketing Organization, not a medical institution, and this is not medical advice.",
  },
  {
    q: "How long should I go for?",
    a: "A 3-day program introduces the practice and can shift acute stress. Most people see a more durable change at 5-8 days, with time to actually establish new patterns rather than just decompress.",
  },
  {
    q: "Should I go alone or with a group?",
    a: "Depends what actually helps you. Some Mind Balance programs are solitary and self-paced; others are community-based with shared workshops and group reflection. Check each program's specific format before booking.",
  },
]

export default async function MindBalanceTrackPage() {
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
          Mind Balance <span className="display-italic">programs in Asia</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          Calm the nervous system, restore focus. Here's what this track actually involves, who it's for,
          the programme types available across Asia, and which real programs match.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <Link href="/start" className="btn btn-primary btn-lg">
            Get your WS →
          </Link>
          <Link href="/programs?track=Mind" className="btn btn-ghost btn-lg">
            Browse all Mind Balance programs
          </Link>
        </div>
          <div style={{ display: "flex", gap: 16, marginTop: 28, flexWrap: "wrap" }}><img src="/mascots/dreamer_mind-balance_meditation-tablet_woman.png" alt="" style={{ width: 140, height: "auto" }} /><img src="/mascots/dreamer_mind-balance_breathwork_man.png" alt="" style={{ width: 140, height: "auto" }} /></div>
      </section>

      {/* WHAT IT INVOLVES */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>What this track actually involves</h2>
          <p className="body-sm" style={{ marginBottom: 16, color: "var(--ink-2)" }}>
            The specifics vary by program and destination, but Mind Balance programs share a common shape.
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {WHAT_IT_INVOLVES.map((s) => (
              <li key={s} style={{ display: "flex", gap: 10 }}>
                <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--sleep)", marginTop: 8 }} />
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
                <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--sleep)", marginTop: 8 }} />
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
              <h2>Actual Mind Balance <span className="display-italic">programs</span>.</h2>
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
