import Link from "next/link"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import { mapProgram, type DbProgramRow } from "../../_lib/programMapping"
import ProgramCard from "../../_components/ProgramCard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Wellness Travel Guide: Koh Samui & Koh Phangan",
  description:
    "A practical guide to wellness travel in Koh Samui and Koh Phangan — medical-grade detox, longevity and sleep resets on Samui, meditation and nature immersion on Phangan, what each actually involves, typical duration and price, and real matched programs.",
  alternates: { canonical: "/guides/koh-samui-koh-phangan-wellness-guide" },
  openGraph: {
    title: "Wellness Travel Guide: Koh Samui & Koh Phangan | Dream Islands",
    description:
      "Medical-grade resets on Koh Samui, meditation and nature immersion on Koh Phangan — what to expect, programme types, duration, price and real matched programs.",
    url: "https://dreamislands.org/guides/koh-samui-koh-phangan-wellness-guide",
  },
}

const WHY_SAMUI_PHANGAN = [
  "Two islands, one short ferry ride apart — genuinely different wellness models side by side rather than a single format",
  "Koh Samui is Dream Islands' original flagship hub: clinical, medically-supervised protocols across six distinct programme tracks, from detox to longevity to aesthetics",
  "Koh Phangan (Why Nam Beach) is quieter and nature-first — silent meditation, breathwork and forest bathing inside a national park, with no clinical component",
  "Three Koh Samui programmes — Detox Reset, Longevity Protocol and Sleep & NS Reset — already carry real guest reviews and ratings on this site",
]

const WHAT_IT_INVOLVES = [
  "On Koh Samui: daily check-ins at Bunya Clinic, structured herbal and oil protocols, lymphatic work, and — for Longevity or Aesthetic Reset — blood diagnostics or laser/filler consultations",
  "On Koh Phangan: silent meditation, guided breathwork, forest bathing and yoga inside National Park, built around stillness rather than clinical structure",
  "Twin-share or private accommodation depending on programme and property",
  "A 30- to 90-day home protocol on the longer Samui programmes; the Phangan programmes are complete as the retreat itself",
]

type ProgrammeType = {
  name: string
  bestFor: string
  duration: string
  price: string
}

const PROGRAMME_TYPES: ProgrammeType[] = [
  {
    name: "Signature Program (Samui)",
    bestFor: "First-time guests who want the full retreat protocol without committing to one specialised track",
    duration: "6–11 days",
    price: "from $990",
  },
  {
    name: "Detox Reset (Samui)",
    bestFor: "Chronic inflammation, poor sleep or stubborn weight wanting a clinical deep-detox",
    duration: "6–11 days",
    price: "from $1,490",
  },
  {
    name: "Sleep & NS Reset (Samui)",
    bestFor: "A sympathetic-dominant nervous system and broken sleep architecture",
    duration: "6–11 days",
    price: "from $1,390",
  },
  {
    name: "Weight Reset (Samui)",
    bestFor: "Bloat and insulin resistance, wanting a 12-week food-and-movement plan to take home",
    duration: "6–11 days",
    price: "from $1,490",
  },
  {
    name: "Longevity Protocol (Samui)",
    bestFor: "A true biological-age baseline and a medically-led 90-day longevity plan",
    duration: "6–11 days",
    price: "from $1,990",
  },
  {
    name: "Aesthetic Reset (Samui)",
    bestFor: "A measurable skin and clarity upgrade via DPL laser, fillers consultation and detox",
    duration: "6–11 days",
    price: "from $1,690",
  },
  {
    name: "Meditation Reset (Phangan)",
    bestFor: "Acute stress relief and mental clarity through silent meditation and breathwork",
    duration: "3 or 5 days",
    price: "from $450",
  },
  {
    name: "Yoga + Nature Immersion (Phangan)",
    bestFor: "A gentle, movement-based reset with forest bathing — popular with creatives",
    duration: "3 or 5 days",
    price: "from $450",
  },
]

const SAMUI_SLUGS = [
  "signature-program",
  "detox-reset",
  "sleep-nervous-system-reset",
  "weight-reset",
  "longevity-protocol",
  "aesthetic-reset",
]

const PHANGAN_SLUGS = [
  "why-nam-beach-meditation-reset-3d",
  "why-nam-beach-meditation-reset-5d",
  "why-nam-beach-yoga-nature-immersion-3d",
  "why-nam-beach-yoga-nature-immersion-5d",
]

const DESTINATION_SLUGS = [...SAMUI_SLUGS, ...PHANGAN_SLUGS]

const FAQS = [
  {
    q: "Should I choose Koh Samui or Koh Phangan?",
    a: "It depends on what you need. Koh Samui's programmes are clinical and structured — daily check-ins, herbal or IV protocols, and in some cases blood diagnostics — built for a measurable physical reset. Koh Phangan's Why Nam Beach programmes are meditation- and nature-first, with no clinical component, for guests whose reset is more mental and emotional than physical.",
  },
  {
    q: "Can I combine both islands in one trip?",
    a: "Yes — Koh Samui and Koh Phangan are connected by a roughly 30–45 minute ferry, and it's common to pair a few days of clinical reset on Samui with a few days of meditation on Phangan. Tell us on WhatsApp and we'll help sequence dates across both.",
  },
  {
    q: "What's the difference between Detox Reset and Signature Program?",
    a: "Signature Program is the flexible full-retreat baseline — the core Tanya Samui protocol without narrowing to one outcome. Detox Reset is a more specifically structured 6–11 day deep-detox aimed at lowering inflammation, resetting circadian rhythm and shifting stored fluid and toxin load.",
  },
  {
    q: "Are these programs a substitute for ongoing medical or psychiatric care?",
    a: "No. The clinical protocols on Koh Samui are a structured wellness reset, not medical treatment or diagnosis, and the meditation programmes on Koh Phangan are not a substitute for mental health care. Dream Islands is a Destination Marketing Organization, not a medical institution, and this is not medical advice.",
  },
]

export default async function SamuiPhanganDestinationGuidePage() {
  const { data: rows } = await supabaseAdmin
    .from("programs")
    .select(
      "id, name, slug, summary, cohort, tier, duration_days, price_usd, outcomes, is_composite, hero_image_url, " +
        "program_properties(role, properties(id, name, island, country, contact_wa)), " +
        "program_variants(duration_days, duration_nights, price_basic_usd, price_vip_usd, active)",
    )
    .in("slug", DESTINATION_SLUGS)
    .eq("active", true)
    .eq("status", "published")

  const programs = ((rows ?? []) as unknown as DbProgramRow[]).map(mapProgram)
  const bySlug = new Map(programs.map((p) => [p.slug, p]))
  const samuiPrograms = SAMUI_SLUGS.map((s) => bySlug.get(s)).filter((p): p is NonNullable<typeof p> => !!p)
  const phanganPrograms = PHANGAN_SLUGS.map((s) => bySlug.get(s)).filter((p): p is NonNullable<typeof p> => !!p)

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
        <div className="eyebrow" style={{ marginBottom: 12 }}>Destination guide · Thailand</div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 8vw, 60px)", margin: "0 0 20px", color: "var(--ink)", maxWidth: 900 }}>
          Wellness travel in <span className="display-italic">Koh Samui &amp; Koh Phangan</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          Two islands, one short ferry apart — clinical, medically-supervised resets on Samui, meditation and
          nature immersion on Phangan. Here's what each actually involves and which real programs match.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <Link href="/start" className="btn btn-primary btn-lg">
            Get your WS →
          </Link>
          <Link href="/tracks/reset-recovery" className="btn btn-ghost btn-lg">
            Browse Reset & Recovery programs
          </Link>
        </div>
      </section>

      {/* WHY SAMUI / PHANGAN */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Why Koh Samui &amp; Koh Phangan specifically</h2>
          <ul style={{ margin: "16px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {WHY_SAMUI_PHANGAN.map((s) => (
              <li key={s} style={{ display: "flex", gap: 10 }}>
                <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--accent)", marginTop: 8 }} />
                <span className="body-sm">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* WHAT IT INVOLVES */}
      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>What a Samui or Phangan program actually involves</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {WHAT_IT_INVOLVES.map((c) => (
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
            <div className="eyebrow" style={{ marginBottom: 8 }}>All Samui &amp; Phangan programs</div>
            <h2>Comparing your <span className="display-italic">options</span>.</h2>
          </div>
        </div>
        <div className="card" style={{ padding: 0, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 560 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
                {["Programme", "Best for", "Duration", "Approx. price"].map((h) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* KOH SAMUI PROGRAMS */}
      {samuiPrograms.length > 0 && (
        <section className="shell" style={{ paddingTop: 56 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Real matched programs</div>
              <h2>Actual Koh Samui <span className="display-italic">programs</span>.</h2>
            </div>
          </div>
          <div className="rail">
            {samuiPrograms.map((p) => (
              <ProgramCard key={p.id} program={p} variant="rail" />
            ))}
          </div>
        </section>
      )}

      {/* KOH PHANGAN PROGRAMS */}
      {phanganPrograms.length > 0 && (
        <section className="shell" style={{ paddingTop: 56 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Real matched programs</div>
              <h2>Actual Koh Phangan <span className="display-italic">programs</span>.</h2>
            </div>
          </div>
          <div className="rail">
            {phanganPrograms.map((p) => (
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
