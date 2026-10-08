import Link from "next/link"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import { mapProgram, type DbProgramRow } from "../../_lib/programMapping"
import ProgramCard from "../../_components/ProgramCard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Wellness Travel Guide: Mile, Yunnan, China",
  description:
    "A practical guide to medical wellness travel in Mile, Yunnan — silica hot springs, functional medicine, biomarker panels and executive health protocols at Mile Wellness Resort, what each programme actually involves, typical duration and price, and real matched programs.",
  alternates: { canonical: "/guides/mile-yunnan-wellness-guide" },
  openGraph: {
    title: "Wellness Travel Guide: Mile, Yunnan, China | Dream Islands",
    description:
      "Medical-grade wellness in Mile, Yunnan — silica hot springs, biomarker panels and executive health protocols. What to expect, programme types, duration, price and real matched programs.",
    url: "https://dreamislands.org/guides/mile-yunnan-wellness-guide",
  },
}

const VIDEO_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: "Mile Wellness Resort, Yunnan | TCM, Medical Wellness & Hot Springs in China",
  description:
    "Mile Wellness Resort is a premium medical wellness retreat in Mile, Yunnan, China, combining Traditional Chinese Medicine (TCM), functional medicine, modern diagnostics, silica hot springs and restorative wellness. Programs range from short 3-day wellness escapes to 7-14 day deep recovery, executive health and preventive wellness programs.",
  thumbnailUrl: ["https://i.ytimg.com/vi/fpyzycLUIck/hqdefault.jpg"],
  uploadDate: "2026-09-01T08:00:25-07:00",
  duration: "PT1M4S",
  contentUrl: "https://youtu.be/fpyzycLUIck",
  embedUrl: "https://www.youtube.com/embed/fpyzycLUIck",
  publisher: {
    "@type": "Organization",
    name: "Dream Islands",
    url: "https://dreamislands.org",
  },
}

const WHY_MILE = [
  "Mile Wellness Resort is the most clinically intensive destination in the network — real biomarker panels, functional medicine and IV protocols, not a spa-only reset",
  "Built around Mile's natural silica hot springs — a genuine mineral-spring resource the resort's protocols are layered on top of",
  "A genuinely wide range: a $900 three-day rest weekend and a $10,000 fully bespoke preventive-health program with a personal coordinator sit side by side",
  "The composite Xi'an + Mile itinerary pairs TCM conditioning with the medical-wellness stay, run in partnership with Xi'an Overseas Tourism Co., Ltd.",
]

const WHAT_IT_INVOLVES = [
  "A diagnostic step at check-in — from a light TCM consultation on the shorter programmes to a full functional-medicine workup with an English-language health report on the executive and luxury tiers",
  "Daily access to Mile's silica hot springs, used as a recovery and detox baseline across every programme",
  "IV therapy, hyperbaric oxygen or NAD+ protocols on the longer, more clinical programmes — not included on the short resets",
  "On the 14-day Medical Wellness Journey specifically: ongoing chronic-condition management with specialist consultations, delivered inside a wellness-resort setting rather than a hospital",
]

type ProgrammeType = {
  name: string
  bestFor: string
  duration: string
  price: string
}

const PROGRAMME_TYPES: ProgrammeType[] = [
  {
    name: "Wellness Escape (Short)",
    bestFor: "Rest and relaxation without a heavy medical commitment",
    duration: "3 days",
    price: "$900",
  },
  {
    name: "3D2N Detox & Anti-aging",
    bestFor: "A fast, accessible detox and anti-aging reset for guests short on time",
    duration: "3 days",
    price: "from $1,200",
  },
  {
    name: "Xi'an & Mile Medical Wellness Journey",
    bestFor: "TCM conditioning in Xi'an plus a full diagnostic and detox reset at Mile",
    duration: "10 days",
    price: "$2,095",
  },
  {
    name: "5D4N Wellness Escape",
    bestFor: "A complete introduction to all five of Mile's wellness pillars",
    duration: "5 days",
    price: "from $2,200",
  },
  {
    name: "7D6N Deep Recovery",
    bestFor: "Guests carrying real physical strain, not just a relaxation break",
    duration: "7 days",
    price: "from $4,500",
  },
  {
    name: "Executive Health & Recovery",
    bestFor: "Time-poor executives wanting a rigorous biomarker baseline plus a real recovery week",
    duration: "7 days",
    price: "from $5,500",
  },
  {
    name: "Medical Wellness Journey",
    bestFor: "Managing a real chronic condition or extended recovery need",
    duration: "14 days",
    price: "from $8,000",
  },
  {
    name: "Luxury Preventive Health Program",
    bestFor: "The most comprehensive option — fully bespoke, with an optional genomics panel",
    duration: "10 days",
    price: "from $10,000",
  },
]

const QUICK_RESET_SLUGS = ["mile-wellness-escape-short", "mile-3d2n-detox-anti-aging", "mile-5d4n-wellness-escape"]

const EXECUTIVE_SLUGS = [
  "xian-mile-medical-wellness-10d",
  "mile-executive-health-recovery",
  "mile-luxury-preventive-health-program",
]

const DEEP_RECOVERY_SLUGS = ["mile-7d6n-deep-recovery", "mile-medical-wellness-journey"]

const DESTINATION_SLUGS = [...QUICK_RESET_SLUGS, ...EXECUTIVE_SLUGS, ...DEEP_RECOVERY_SLUGS]

const FAQS = [
  {
    q: "Is Mile Wellness Resort a medical facility or a spa resort?",
    a: "It's a functional-medicine-informed wellness resort, not a hospital. Biomarker panels, IV protocols and diagnostics are delivered inside a resort setting by qualified practitioners. The longer programmes describe themselves explicitly as managing a condition or building a health baseline — not as medical treatment or a cure.",
  },
  {
    q: "What's the difference between the 3-day and 7+ day programmes?",
    a: "The 3-day programmes (Wellness Escape Short, 3D2N Detox & Anti-aging) are lighter — a TCM consultation, hot springs and a detox protocol, without heavy diagnostics. The 7-day-plus programmes add a full biomarker panel and, depending on the tier, IV therapy, hyperbaric oxygen or NAD+ protocols.",
  },
  {
    q: "Should I combine Xi'an and Mile, or go straight to Mile?",
    a: "The Xi'an & Mile Medical Wellness Journey pairs TCM conditioning in Xi'an with the medical-wellness stay at Mile — a good fit if you want a gentler build-up. Going straight to Mile suits guests who want to skip the Xi'an leg and start diagnostics immediately.",
  },
  {
    q: "Are these programs a substitute for ongoing medical care?",
    a: "No. Even the more clinical Mile programmes are a structured wellness and preventive-health protocol, not a replacement for your own doctor or ongoing medical treatment. Dream Islands is a Destination Marketing Organization, not a medical institution, and this is not medical advice.",
  },
]

export default async function MileYunnanDestinationGuidePage() {
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
  const quickResetPrograms = QUICK_RESET_SLUGS.map((s) => bySlug.get(s)).filter((p): p is NonNullable<typeof p> => !!p)
  const executivePrograms = EXECUTIVE_SLUGS.map((s) => bySlug.get(s)).filter((p): p is NonNullable<typeof p> => !!p)
  const deepRecoveryPrograms = DEEP_RECOVERY_SLUGS.map((s) => bySlug.get(s)).filter((p): p is NonNullable<typeof p> => !!p)

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(VIDEO_JSON_LD) }} />

      {/* HERO */}
      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Destination guide · China</div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 8vw, 60px)", margin: "0 0 20px", color: "var(--ink)", maxWidth: 900 }}>
          Wellness travel in <span className="display-italic">Mile, Yunnan</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          The network's most clinically intensive destination — silica hot springs, functional medicine and
          biomarker panels at Mile Wellness Resort. Here's what each programme actually involves and which
          real programs match.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <Link href="/start" className="btn btn-primary btn-lg">
            Get your WS →
          </Link>
          <Link href="/tracks/performance" className="btn btn-ghost btn-lg">
            Browse Performance programs
          </Link>
        </div>
      </section>

      {/* VIDEO */}
      <section className="shell" style={{ paddingTop: 40 }}>
        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: 14 }}>
          <iframe
            src="https://www.youtube.com/embed/fpyzycLUIck"
            title="Mile Wellness Resort, Yunnan | TCM, Medical Wellness & Hot Springs in China"
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </section>

      {/* WHY MILE */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Why Mile, Yunnan specifically</h2>
          <ul style={{ margin: "16px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {WHY_MILE.map((s) => (
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
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>What a Mile program actually involves</h2>
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
            <div className="eyebrow" style={{ marginBottom: 8 }}>All Mile, Yunnan programs</div>
            <h2>Comparing your <span className="display-italic">options</span>.</h2>
          </div>
        </div>
        <div className="card" style={{ padding: 0, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 560 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
                {["Programme", "Best for", "Duration", "Price"].map((h) => (
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

      {/* QUICK RESETS */}
      {quickResetPrograms.length > 0 && (
        <section className="shell" style={{ paddingTop: 56 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Real matched programs</div>
              <h2>Quick <span className="display-italic">resets</span>.</h2>
            </div>
          </div>
          <div className="rail">
            {quickResetPrograms.map((p) => (
              <ProgramCard key={p.id} program={p} variant="rail" />
            ))}
          </div>
        </section>
      )}

      {/* EXECUTIVE & PREVENTIVE HEALTH */}
      {executivePrograms.length > 0 && (
        <section className="shell" style={{ paddingTop: 56 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Real matched programs</div>
              <h2>Executive &amp; preventive <span className="display-italic">health</span>.</h2>
            </div>
          </div>
          <div className="rail">
            {executivePrograms.map((p) => (
              <ProgramCard key={p.id} program={p} variant="rail" />
            ))}
          </div>
        </section>
      )}

      {/* DEEP MEDICAL RECOVERY */}
      {deepRecoveryPrograms.length > 0 && (
        <section className="shell" style={{ paddingTop: 56 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Real matched programs</div>
              <h2>Deep medical <span className="display-italic">recovery</span>.</h2>
            </div>
          </div>
          <div className="rail">
            {deepRecoveryPrograms.map((p) => (
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
