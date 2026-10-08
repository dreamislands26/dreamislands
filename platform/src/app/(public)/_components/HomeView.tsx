import Link from "next/link"
import { COHORT_LABELS, HOW_IT_WORKS, TRACKS, type LandingProgram } from "../_lib/programMapping"
import Image from "next/image"
import { supabaseAdmin } from "@/lib/supabase-server"
import { Icon } from "./Icon"
import ProgramCard from "./ProgramCard"
import Rail from "./Rail"
import ReviewsSection, { type Review } from "./ReviewsSection"
import InViewMotion from "./journey/InViewMotion"
import { HeroRoute, BDARoute } from "./journey/JourneyRoute"
import OutcomeSignature from "./journey/OutcomeSignature"

const TRACK_ICONS = {
  Reset: "/icons/leaf.png",
  Performance: "/icons/pulse.png",
  Mind: "/icons/mindfulness.png",
  Immersion: "/icons/compass.png",
  SportChill: "/icons/energy_448.png",
} as const

// Curated homepage picks — keep the rail short and intentional rather than
// dumping every SKU. Slugs must exist among photo-backed destinations; falls
// back to the first 8 published programs if fewer than 4 curated slugs resolve.
const FEATURED_SLUGS = [
  "xian-wudang-closed-retreat-10d",
  "signature-program",
  "detox-reset",
  "wudang-executive-burnout-recovery",
  "bm-package-a-outpatient-fast-track",
  "mile-executive-health-recovery",
  "xian-wudang-wellness-journey-11d",
  "weight-reset",
]

// Program count is filled in from the live list at render time so it always
// matches the "Explore all N programs" button (was a hardcoded 54 vs 62).
const TRACTION_STATS = [
  { n: "300+", sub: "guests hosted" },
  { n: "{programs}", sub: "standardized programs" },
  { n: "17", sub: "partner destinations" },
  { n: "7", sub: "Asian markets" },
  { n: "3,000+", sub: "community" },
  { n: "70+", sub: "travel partners" },
] as const

// China rail — spans all three destinations (Xi'an, Wudang, Mile) plus the
// Better Migrate hospital network, across all four tracks and a wide price band.
const CHINA_SLUGS = [
  "xian-wudang-closed-retreat-10d",
  "xian-mile-medical-wellness-10d",
  "xian-wudang-wellness-journey-11d",
  "mile-luxury-preventive-health-program",
  "wudang-7-day-tai-chi-longevity",
  "bm-package-a-outpatient-fast-track",
]
const CHINA_STATS = [
  { n: "3", sub: "wellness destinations" },
  { n: "9", sub: "partner hospitals" },
  { n: "17", sub: "China programs" },
] as const

const ECOSYSTEM_BASE = "https://xbzrtofanbrahasxbisf.supabase.co/storage/v1/object/public/ecosystem"
const HOMEPAGE_PHOTOS = [
  { file: "dream-islands-meditation-seaside-sunset-wellness-asia.jpg", alt: "Meditation by the sea at sunset" },
  { file: "dream-islands-spa-treatment-recovery-wellness-asia.jpg", alt: "Spa treatment and recovery" },
  { file: "dream-islands-nature-immersion-waterfall-wellness-asia.jpg", alt: "Nature immersion at a waterfall" },
  { file: "dream-islands-poolside-recovery-wellness-asia.jpg", alt: "Poolside recovery" },
  { file: "dream-islands-wellness-fitness-mobility-asia.jpeg", alt: "Wellness fitness and mobility work" },
  { file: "dream-islands-meditation-mind-balance-wellness-asia.png", alt: "Meditation and mind balance" },
  { file: "dream-islands-wellness-retreat-relaxation-asia.jpg", alt: "Wellness retreat relaxation" },
  { file: "dream-islands-tropical-nature-wellness-thailand.jpg", alt: "Tropical nature in Thailand" },
  { file: "dream-islands-spa-wellness-relaxation-asia.jpg", alt: "Spa wellness relaxation" },
  { file: "dream-islands-nature-wellness-elephants-thailand.jpg", alt: "Nature wellness with elephants in Thailand" },
  { file: "dream-islands-tropical-sunset-wellness-travel-asia.png", alt: "Tropical sunset wellness travel" },
  { file: "dream-islands-wellness-travel-guests-asia.jpg", alt: "Wellness travel guests" },
].map((p) => ({ ...p, url: `${ECOSYSTEM_BASE}/homepage/${p.file}` }))
const PARTNER_LOGOS = [
  { file: "movenpick-resort-spa-boracay-logo.jfif", name: "Movenpick Resort & Spa Boracay" },
  { file: "udara-bali-yoga-detox-spa-logo.jfif", name: "Udara Bali Yoga Detox & Spa" },
  { file: "como-shambhala-estate-logo.jfif", name: "Como Shambhala Estate" },
  { file: "club-med-bintan-island-logo.png", name: "Club Med Bintan" },
].map((p) => ({ ...p, url: `${ECOSYSTEM_BASE}/partner-logos/${p.file}` }))

// Single hero image — ambient support for the proposition, not a merchandised
// "pick". Matches the production value already live.
const HERO_IMAGE = `${ECOSYSTEM_BASE}/homepage/dream-islands-wellness-travel-guests-asia.jpg`

// During-stage image for the Before/During/After journey — reuses an
// existing approved ecosystem asset (the original hero photo) rather than
// introducing a new one.
const BDA_DURING_IMAGE = `${ECOSYSTEM_BASE}/homepage/dream-islands-meditation-seaside-sunset-wellness-asia.jpg`

// outcome_slug (outcomes_taxonomy) -> guide page route slug. This is routing
// config, not taxonomy, so it lives here rather than in the DB — same pattern
// Footer.tsx uses for TRACK_PAGE_SLUGS.
const OUTCOME_GUIDE_SLUGS: Record<string, string> = {
  "restore-sleep": "sleep-reset-retreats-asia",
  "stress-anxiety": "burnout-recovery-retreats-southeast-asia",
  "boost-energy": "boost-energy-retreats-asia",
  "metabolic-health": "metabolic-health-retreats-asia",
  "mental-clarity": "mental-clarity-retreats-asia",
  "rebuild-your-body": "fitness-recovery-retreats-asia",
  "healthy-ageing": "longevity-executive-health-retreats-asia",
}

type OutcomeCard = {
  slug: string
  name: string
  hook: string
  guideSlug: string
  count: number
}

export default async function HomeView({ programs, reviews }: { programs: LandingProgram[]; reviews: Review[] }) {
  const bySlug = new Map(programs.filter((p) => p.slug).map((p) => [p.slug as string, p]))
  const firstWa = programs.find((p) => p.contact_wa)?.contact_wa ?? null
  // Fall back to the company WhatsApp rather than a bare wa.me/ with no number.
  const waHref = `https://wa.me/${(firstWa ?? "66811612662").replace(/[^0-9]/g, "")}`
  const featuredRail = (() => {
    const curated = FEATURED_SLUGS.map((s) => bySlug.get(s)).filter((p): p is LandingProgram => !!p)
    return curated.length >= 4 ? curated : programs.slice(0, 8)
  })()
  const chinaRail = CHINA_SLUGS.map((s) => bySlug.get(s)).filter((p): p is LandingProgram => !!p)

  // Outcome navigator — pulled live from outcomes_taxonomy / program_outcomes
  // rather than hardcoded, so it stays in sync with the guide pages it links to.
  const [{ data: outcomeRows }, { data: matchRows }] = await Promise.all([
    supabaseAdmin.from("outcomes_taxonomy").select("slug, name, hook").eq("active", true).order("priority"),
    supabaseAdmin.from("program_outcomes").select("outcome_slug").eq("weight", "primary"),
  ])
  const primaryCounts: Record<string, number> = {}
  for (const r of matchRows ?? []) {
    primaryCounts[r.outcome_slug] = (primaryCounts[r.outcome_slug] ?? 0) + 1
  }
  const outcomes: OutcomeCard[] = (outcomeRows ?? [])
    .filter((o) => OUTCOME_GUIDE_SLUGS[o.slug])
    .map((o) => ({
      slug: o.slug,
      name: o.name,
      hook: o.hook,
      guideSlug: OUTCOME_GUIDE_SLUGS[o.slug],
      count: primaryCounts[o.slug] ?? 0,
    }))

  return (
    <div className="page" style={{ paddingBottom: 48, position: "relative", overflow: "hidden" }}>
      <div className="blob" style={{ width: 380, height: 380, background: "var(--accent-soft)", top: -120, right: -120 }} />
      <div className="blob" style={{ width: 320, height: 320, background: "var(--accent)", opacity: 0.12, top: 320, left: -160 }} />

      {/* HERO */}
      <section className="shell rise sec-hero" style={{ position: "relative", zIndex: 1, paddingTop: 12 }}>
        <div style={{ display: "grid", gap: 28 }} className="hero-grid">
          <div className="rise rise-1">
            <div className="eyebrow" style={{ marginBottom: 18 }}>
              Outcome-driven wellness travel
            </div>
            <h1
              className="display"
              style={{ margin: 0, fontSize: "clamp(40px, 8vw, 72px)", color: "var(--ink)" }}
            >
              Feel different when you come back.
            </h1>
            <p className="body-lg" style={{ marginTop: 22, maxWidth: 460 }}>
              Restore your sleep, recover from burnout, get your energy back or improve metabolic
              health. Dream Islands matches you with structured wellness programs across Asia based
              on the change you want to make.
            </p>
            <div className="hero-ctas" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
              <Link href="/programs" className="btn btn-primary btn-lg">
                Find my program
                <Icon.arrow width={18} height={18} />
              </Link>
              <Link href="#outcomes" className="btn btn-ghost btn-lg">
                Explore outcomes
              </Link>
            </div>
            <Link
              href="/start"
              className="body-sm"
              style={{ display: "inline-block", marginTop: 20, color: "var(--ink-2)", textDecoration: "underline" }}
            >
              Get your 2-minute Wellbeing &amp; Wellness Score (WS) →
            </Link>
          </div>
          <div className="rise rise-2">
            <InViewMotion className="hero-visual" threshold={0.2}>
              <div className="hero-image">
                <Image
                  src={HERO_IMAGE}
                  alt="Wellness travel across Asia"
                  fill
                  sizes="(max-width: 900px) 100vw, 560px"
                  className="hero-kb"
                  style={{ objectFit: "cover" }}
                  priority
                />
              </div>
              <HeroRoute />
            </InViewMotion>
          </div>
        </div>
      </section>

      {/* OUTCOME NAVIGATOR */}
      <section id="outcomes" className="shell rise sec-outcomes" style={{ position: "relative", zIndex: 1, paddingTop: 64, scrollMarginTop: 90 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Outcome-driven matching</div>
            <h2>What do you want to change?</h2>
            <p className="body" style={{ marginTop: 8, maxWidth: 480, color: "var(--ink-2)" }}>
              Pick what matters most. We&apos;ll match you with programs designed around that outcome.
            </p>
          </div>
        </div>
        <div className="outcome-field">
          {outcomes.map((o) => (
            <InViewMotion key={o.slug} className="outcome-tile" threshold={0.25}>
              <OutcomeSignature slug={o.slug} />
              <h3 className="outcome-name">{o.name}</h3>
              <p className="outcome-hook">{o.hook}</p>
              {o.count > 0 ? (
                <div className="outcome-actions">
                  <div className="outcome-count">
                    {o.count} matched program{o.count === 1 ? "" : "s"}
                  </div>
                  <Link href={`/guides/${o.guideSlug}#matched-programs`} className="outcome-link outcome-link-primary">
                    Explore matched programs <Icon.arrow width={14} height={14} />
                  </Link>
                  <Link href={`/guides/${o.guideSlug}`} className="outcome-link outcome-link-secondary">
                    Read guide
                  </Link>
                </div>
              ) : (
                <div className="outcome-actions">
                  <div className="outcome-count">Programs coming soon</div>
                  <Link href={`/guides/${o.guideSlug}`} className="outcome-link outcome-link-primary">
                    Read guide <Icon.arrow width={14} height={14} />
                  </Link>
                </div>
              )}
            </InViewMotion>
          ))}
        </div>
      </section>

      {/* BEFORE / DURING / AFTER */}
      <section id="journey" className="shell rise sec-bda" style={{ position: "relative", zIndex: 1, paddingTop: 64, scrollMarginTop: 90 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>How Dream Islands works</div>
            <h2>Before. During. After.</h2>
            <p className="body" style={{ maxWidth: 540, marginTop: 10, color: "var(--ink-2)" }}>
              Most travel platforms sell the stay. Dream Islands works before, during and after it.
            </p>
          </div>
        </div>
        <InViewMotion className="bda" threshold={0.2}>
          <div className="bda-stage bda-before">
            <div className="bda-num">01</div>
            <div className="bda-label">Before</div>
            <div className="bda-steps">Measure · Match</div>
            <p className="bda-copy">Understand current state, desired change and appropriate program.</p>
          </div>
          <div className="bda-stage bda-during">
            <Image
              src={BDA_DURING_IMAGE}
              alt="A Dream Islands wellness program in progress"
              fill
              sizes="(max-width: 900px) 100vw, 45vw"
              style={{ objectFit: "cover" }}
            />
            <div className="bda-during-caption">
              <div className="bda-num bda-num-light">02</div>
              <div className="bda-label bda-label-light">During</div>
              <div className="bda-steps bda-steps-light">Program · Place · Practices</div>
              <p className="bda-copy bda-copy-light">Travel into a structured program designed around the selected outcome.</p>
            </div>
          </div>
          <div className="bda-stage bda-after">
            <div className="bda-num">03</div>
            <div className="bda-label">After</div>
            <div className="bda-steps">Measure again</div>
            <p className="bda-copy">Understand what changed and what to continue.</p>
          </div>
          <BDARoute />
        </InViewMotion>
      </section>

      {/* PROGRAMS RAIL */}
      <section className="sec-programs" style={{ position: "relative", zIndex: 1 }}>
        <div className="shell">
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Real programs</div>
              <h2>Programs built around real outcomes.</h2>
            </div>
            <Link href="/programs" className="btn btn-ghost" style={{ padding: "10px 16px", fontSize: 13 }}>
              Explore all {programs.length} programs →
            </Link>
          </div>
        </div>
        <div className="shell">
          <Rail label="Featured programs">
            {featuredRail.map((p) => (
              <ProgramCard key={p.id} program={p} variant="rail" />
            ))}
            {featuredRail.length === 0 && (
              <div className="card" style={{ padding: 20, width: 260 }}>
                <div className="body-sm">No programs published yet.</div>
              </div>
            )}
          </Rail>
        </div>
      </section>

      {/* DESTINATION PHOTOS */}
      <section className="shell rise sec-destphotos" style={{ position: "relative", zIndex: 1, paddingTop: 56 }}>
        <div className="section-head desktop-only">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Destinations</div>
            <h2>Where you&apos;ll go.</h2>
          </div>
        </div>
        <Rail label="Destination photos" style={{ gap: 12 }}>
          {HOMEPAGE_PHOTOS.map((p) => (
            <div
              key={p.file}
              style={{
                position: "relative",
                flex: "0 0 auto",
                width: 220,
                aspectRatio: "4 / 5",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <Image src={p.url} alt={p.alt} fill sizes="220px" style={{ objectFit: "cover" }} />
            </div>
          ))}
        </Rail>
      </section>

      {/* TANYA SAMUI FLAGSHIP */}
      <section className="shell rise sec-tanya" style={{ paddingBlock: 20 }}>
        {/* was "card btn btn-primary": .card's dark fill overrode the mint button */}
        <Link href="/tanya-samui" className="btn btn-primary btn-lg" style={{ display: "flex", width: "100%", fontSize: 18, fontWeight: 600 }}>
          Explore Tanya Samui, Koh Samui <Icon.arrow width={18} height={18} />
        </Link>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="shell rise rise-3 sec-hiw" style={{ position: "relative", zIndex: 1, scrollMarginTop: 90 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>How it works</div>
            <h2>
              Three steps to <span className="display-italic">your match</span>.
            </h2>
          </div>
        </div>
        <div style={{ display: "grid", gap: 12 }} className="hiw-grid">
          {HOW_IT_WORKS.map((step) => (
            <div
              key={step.n}
              className="card"
              style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span
                  className="display display-italic"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 48,
                    color: "var(--accent)",
                    lineHeight: 0.9,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {step.n}
                </span>
                <span aria-hidden="true" style={{ flex: 1, marginLeft: 14, height: 1, background: "var(--line)" }} />
              </div>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 600, color: "var(--ink)" }}>
                {step.title}
              </h3>
              <p className="body" style={{ margin: 0 }}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRACKS */}
      <section id="tracks" className="shell sec-tracks" style={{ scrollMarginTop: 90 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Five tracks</div>
            <h2>
              Pick a <span className="display-italic">direction</span>.
            </h2>
          </div>
        </div>
        <div className="track-grid">
          {TRACKS.map((t, i) => {
            const color = COHORT_LABELS[t.cohort]?.color ?? "var(--accent)"
            const num = String(i + 1).padStart(2, "0")
            const trackIcon = TRACK_ICONS[t.id as keyof typeof TRACK_ICONS]
            return (
              <Link
                key={t.id}
                href={`/programs?track=${t.id}`}
                className="card"
                style={{
                  padding: "22px 22px 20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 22,
                  textAlign: "left",
                  position: "relative",
                  overflow: "hidden",
                  minHeight: 200,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: -42,
                    right: -42,
                    width: 110,
                    height: 110,
                    borderRadius: "50%",
                    background: color,
                    opacity: 0.16,
                  }}
                />
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <span
                    className="display display-italic"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 56,
                      lineHeight: 0.8,
                      color: "var(--ink-3)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {num}
                  </span>
                  <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: color, marginTop: 12 }} />
                </div>
                <div>
                  {trackIcon && (
                    <Image
                      src={trackIcon}
                      alt=""
                      aria-hidden="true"
                      width={32}
                      height={32}
                      style={{ marginBottom: 10, opacity: 0.9 }}
                    />
                  )}
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(20px, 6vw, 28px)",
                      fontWeight: 400,
                      letterSpacing: "-.01em",
                      color: "var(--ink)",
                      marginBottom: 6,
                      lineHeight: 1.05,
                      overflowWrap: "break-word",
                      wordBreak: "break-word",
                      hyphens: "auto",
                    }}
                  >
                    {t.label}
                  </div>
                  <div className="body-sm" style={{ color: "var(--ink-2)", marginBottom: 14 }}>
                    {t.desc}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12,
                      color: "var(--ink-2)",
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Explore <Icon.arrow width={14} height={14} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* CHINA SPOTLIGHT */}
      {chinaRail.length > 0 && (
        <section className="shell rise sec-china" style={{ position: "relative", zIndex: 1, paddingTop: 56 }}>
          <div className="card" style={{ padding: "36px 28px" }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Now open</div>
            <h2 style={{ margin: "0 0 14px", fontSize: "clamp(30px, 4vw, 44px)", lineHeight: 1.08 }}>
              China, a core <span className="display-italic">Dream Islands</span> destination.
            </h2>
            <p className="body" style={{ maxWidth: 640, marginBottom: 24, color: "var(--ink-2)" }}>
              Ancient-capital TCM diagnostics in Xi&apos;an, closed Taoist practice retreats in the
              Wudang Mountains, medical-grade silica hot springs in Mile, Yunnan, and a coordinated
              network of partner hospitals across Beijing, Shanghai, Chengdu and Guangzhou for
              guests who need clinical care alongside recovery.
            </p>
            <div style={{ display: "flex", gap: "24px 40px", flexWrap: "wrap", marginBottom: 28 }}>
              {CHINA_STATS.map((s) => (
                <Stat key={s.sub} n={s.n} sub={s.sub} />
              ))}
            </div>
            <Rail label="China programs" style={{ marginBottom: 26 }}>
              {chinaRail.map((p) => (
                <ProgramCard key={p.id} program={p} variant="rail" />
              ))}
            </Rail>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/properties" className="btn btn-primary">
                Explore China properties <Icon.arrow width={14} height={14} />
              </Link>
              <a href={waHref} target="_blank" rel="noreferrer" className="btn btn-ghost">
                <Icon.wa width={16} height={16} /> Talk to a China specialist
              </a>
            </div>
          </div>
        </section>
      )}

      {/* TRUSTED PARTNERS */}
      <section className="shell rise sec-partners" style={{ position: "relative", zIndex: 1, paddingTop: 20, paddingBottom: 8 }}>
        <div className="eyebrow" style={{ marginBottom: 16, textAlign: "center" }}>
          Trusted partner properties
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 16 }}>
          {PARTNER_LOGOS.map((p) => (
            <div key={p.file} className="partner-logo">
              <div style={{ position: "relative", width: "100%", height: "100%" }}>
                <Image src={p.url} alt={p.name} fill sizes="160px" style={{ objectFit: "contain", mixBlendMode: "multiply" }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TRACTION */}
      <section className="shell sec-traction" style={{ position: "relative", zIndex: 1, paddingBlock: 8 }}>
        <div className="card traction-card" style={{ padding: "30px 26px" }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Dream Islands today</div>
          <div className="traction-grid">
            {TRACTION_STATS.map((s) => (
              <div key={s.sub}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 32,
                    color: "var(--ink)",
                    lineHeight: 1,
                    marginBottom: 4,
                  }}
                >
                  {s.n === "{programs}" ? programs.length : s.n}
                </div>
                <div className="body-sm" style={{ color: "var(--ink-2)" }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <div className="sec-reviews">
        <ReviewsSection reviews={reviews} />
      </div>

      {/* WS PROPOSITION + FINAL CTA */}
      <section className="shell sec-quote">
        <div
          className="card"
          style={{
            padding: "40px 28px",
            background: "var(--accent)",
            color: "var(--accent-ink)",
            borderRadius: "var(--r-xl)",
            border: 0,
            position: "relative",
            overflow: "hidden",
            marginTop: 48,
          }}
        >
          <div style={{ position: "absolute", top: -40, right: -40, opacity: 0.25, pointerEvents: "none" }}>
            <Icon.flower width={200} height={200} />
          </div>
          <div className="eyebrow" style={{ color: "rgba(20,32,27,.7)", position: "relative" }}>
            The Dream Islands promise
          </div>
          <p
            className="display"
            style={{ fontSize: "clamp(28px, 6vw, 44px)", margin: "16px 0 10px", maxWidth: 560, position: "relative" }}
          >
            No guesswork. A clear baseline, a matched stay, a measurable shift.
          </p>
          <p className="body" style={{ maxWidth: 480, marginBottom: 22, color: "rgba(20,32,27,.75)" }}>
            See where you stand across key wellbeing dimensions, then use your score to find
            programs aligned with what you want to improve.
          </p>
          <Link
            href="/start"
            className="btn"
            style={{ background: "var(--accent-ink)", color: "var(--accent-deep)" }}
          >
            Get your 2-minute WS <Icon.arrow width={16} height={16} />
          </Link>
          {firstWa && (
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="btn"
              style={{ background: "transparent", color: "var(--accent-ink)", marginLeft: 8, border: "1px solid rgba(20,32,27,.35)" }}
            >
              Or chat now <Icon.wa width={14} height={14} />
            </a>
          )}
        </div>
      </section>

      <style>{`
        /* Tracks: 2 columns on mobile with the odd fifth card spanning the
           row; all five in one row on desktop (was 2 columns everywhere
           because an inline style beat the media query). */
        .track-grid { display: grid; gap: 12px; grid-template-columns: repeat(2, 1fr); }
        .track-grid > :last-child:nth-child(odd) { grid-column: 1 / -1; }
        @media (min-width: 900px) {
          .hero-grid { grid-template-columns: 1.1fr 1fr; align-items: center; gap: 64px; padding-top: 32px; }
          .hiw-grid  { grid-template-columns: repeat(3, 1fr); }
          .track-grid { grid-template-columns: repeat(5, 1fr); gap: 16px; }
          .track-grid > :last-child:nth-child(odd) { grid-column: auto; }
        }
        @media (max-width: 599px) {
          .hero-ctas > .btn { flex: 1 1 100%; }
        }
        .partner-logo {
          width: 150px; height: 84px; padding: 10px 16px;
          background: #F4F4F2; border-radius: 12px;
        }
        @media (max-width: 599px) {
          .partner-logo { width: calc(50% - 8px); height: 76px; }
        }
        .traction-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(2, 1fr);
        }
        @media (min-width: 700px) {
          .traction-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1000px) {
          .traction-grid { grid-template-columns: repeat(6, 1fr); }
        }

        /* ===== Journey / route / signature motion system =====
           Base state (no .iv-active ancestor) is always fully visible and
           static — motion is an enhancement layered on top via the
           IntersectionObserver-driven .iv-active class, never a gate on
           whether content/information is present. */

        .iv { position: relative; }
        .hero-visual { position: relative; overflow: visible; }

        .hero-kb { animation: none; }
        .iv-active .hero-kb { animation: kenburns 11s ease-in-out infinite alternate; }
        @keyframes kenburns { from { transform: scale(1); } to { transform: scale(1.035); } }

        .jr { position: absolute; pointer-events: none; overflow: visible; }
        .jr-hero-desktop, .jr-hero-mobile {
          left: -6%; right: -6%; top: -56px; bottom: 0;
          width: 112%; height: calc(100% + 56px);
        }
        .jr-hero-mobile { display: none; }
        @media (max-width: 899px) {
          .jr-hero-desktop { display: none; }
          .jr-hero-mobile { display: block; }
        }
        .jr-origin { fill: var(--accent); }
        .jr-way { fill: var(--bg, #1C262A); stroke: var(--accent); stroke-width: 2; }
        .jr-fast, .jr-slow, .jr-wide, .jr-loop {
          fill: none; stroke: var(--accent);
          stroke-dasharray: 900; stroke-dashoffset: 0;
        }
        .jr-fast { stroke-width: 2.5; }
        .jr-slow { stroke-width: 4; }
        .jr-wide { stroke-width: 7; }
        .jr-loop { stroke-width: 1; opacity: 0.4; }
        .jr-ring { fill: none; stroke: var(--accent); stroke-width: 2; opacity: 0.85; }
        .jr-ring-sm { r: 7; }
        .iv-active .jr-fast { animation: jrDraw 1.1s cubic-bezier(.2,.7,.15,1) forwards; }
        .iv-active .jr-slow { animation: jrDraw 1.3s cubic-bezier(.16,1,.3,1) .3s forwards; }
        .iv-active .jr-wide { animation: jrDraw 1.6s cubic-bezier(.16,1,.3,1) .5s forwards; }
        .iv-active .jr-loop { animation: jrDraw 2.4s ease 1.1s forwards; }
        .iv-active .jr-ring { animation: jrBreathe 4s ease-in-out 1.4s infinite; transform-origin: center; }
        @keyframes jrDraw { from { stroke-dashoffset: 900; } to { stroke-dashoffset: 0; } }
        @keyframes jrBreathe { 0%, 100% { opacity: 0.55; transform: scale(0.96); } 50% { opacity: 1; transform: scale(1.05); } }

        /* Outcome field — mobile rules below are UNCHANGED from the prior
           release; only a new min-width:900px block further down overrides
           card geometry for desktop. */
        .outcome-field {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 34px 24px;
          align-items: end;
          margin-top: 8px;
        }
        .outcome-tile { display: flex; flex-direction: column; grid-column: span 12; }
        @media (max-width: 899px) {
          .outcome-tile { grid-column: span 12 !important; }
          .outcome-field { gap: 32px; }
          /* signature art was scaling to full width (~250px tall per card) */
          .outcome-tile .sig { width: 120px; height: 52px; max-height: 52px; }
          .outcome-name { margin-top: 10px; }
        }
        .sig { width: 100%; height: auto; display: block; overflow: visible; }
        .sig path, .sig circle {
          fill: none; stroke: var(--accent); stroke-width: 2.5;
          stroke-dasharray: 700; stroke-dashoffset: 0;
        }
        .sig-rebuild .sig-core { fill: var(--accent); stroke: none; }
        .iv-active .sig path { animation: sigDraw 1.8s cubic-bezier(.16,1,.3,1) forwards; }
        .iv-active .sig-sleep path { animation: sigDraw 2.2s cubic-bezier(.16,1,.3,1) forwards, sigBreathe 4.5s ease-in-out 2.4s infinite; }
        .iv-active .sig-stress path { animation: sigSettle 1.7s cubic-bezier(.3,.1,.2,1) forwards; }
        .iv-active .sig-ageing path { animation: sigDraw 2.6s cubic-bezier(.16,1,.3,1) forwards; }
        @keyframes sigDraw { from { stroke-dashoffset: 700; } to { stroke-dashoffset: 0; } }
        @keyframes sigSettle { 0% { stroke-dashoffset: 700; transform: translateY(0); } 35% { transform: translateY(-3px); } 55% { transform: translateY(2px); } 100% { stroke-dashoffset: 0; transform: translateY(0); } }
        @keyframes sigBreathe { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
        .sig-rebuild circle.sig-ring-1, .sig-rebuild circle.sig-ring-2, .sig-rebuild circle.sig-ring-3 {
          stroke-dasharray: none; opacity: 0.5;
        }
        .iv-active .sig-rebuild circle.sig-ring-1 { animation: sigRipple 2.6s cubic-bezier(.2,.6,.3,1) infinite; }
        .iv-active .sig-rebuild circle.sig-ring-2 { animation: sigRipple 2.6s cubic-bezier(.2,.6,.3,1) .5s infinite; }
        .iv-active .sig-rebuild circle.sig-ring-3 { animation: sigRipple 2.6s cubic-bezier(.2,.6,.3,1) 1s infinite; }
        @keyframes sigRipple { 0% { transform: scale(0.6); opacity: 0.9; } 100% { transform: scale(1.3); opacity: 0; } }

        .outcome-name { margin: 16px 0 6px; font-family: var(--font-display); font-size: clamp(22px, 3vw, 32px); font-weight: 400; color: var(--ink); line-height: 1.05; }
        .outcome-hook { margin: 0 0 14px; color: var(--ink-2); font-size: 14px; line-height: 1.5; }
        .outcome-actions { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; margin-top: auto; }
        .outcome-count { font-size: 12px; letter-spacing: .03em; color: var(--ink-3); margin-bottom: 2px; }
        .outcome-link { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; padding: 6px 0; color: var(--ink); border-bottom: 1px solid transparent; }
        .outcome-link-primary { color: var(--accent-deep); border-bottom-color: var(--accent); }
        .outcome-link-secondary { color: var(--ink-3); text-decoration: underline; }

        /* Before / During / After — mobile rules unchanged below; desktop
           override further down. */
        .bda { position: relative; margin-top: 40px; display: flex; align-items: stretch; min-height: 340px; }
        .bda-stage { position: relative; padding: 22px 20px; }
        .bda-before { flex: 0 0 30%; display: flex; flex-direction: column; justify-content: flex-end; }
        .bda-during { flex: 0 0 45%; position: relative; overflow: hidden; border-radius: var(--r-lg, 16px); min-height: 340px; padding: 0; }
        .bda-after { flex: 0 0 25%; display: flex; flex-direction: column; justify-content: flex-end; text-align: right; }
        .bda-num { font-family: var(--font-display); font-size: 16px; color: var(--ink-3); }
        .bda-label { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-2); margin: 2px 0 14px; }
        .bda-steps { font-size: 12px; letter-spacing: .05em; color: var(--accent-deep); margin-bottom: 10px; }
        .bda-copy { margin: 0; font-size: 14px; color: var(--ink-2); line-height: 1.5; max-width: 220px; }
        .bda-after .bda-copy { margin-left: auto; }
        .bda-during-caption { position: absolute; left: 0; right: 0; bottom: 0; padding: 14px 18px; background: rgba(28,38,42,.82); }
        .bda-num-light { color: rgba(255,255,255,.72); }
        .bda-label-light { color: rgba(255,255,255,.92); }
        .bda-steps-light { color: var(--accent); margin-bottom: 6px; }
        .bda-copy-light { color: rgba(255,255,255,.8); max-width: 260px; }
        .jr-bda-desktop, .jr-bda-mobile { left: 0; right: 0; top: 0; bottom: 0; width: 100%; height: 100%; }
        .jr-bda-mobile { display: none; }
        @media (max-width: 899px) {
          .bda { flex-direction: column; min-height: 0; }
          .bda-before, .bda-during, .bda-after { flex: 1 1 auto; }
          .bda-during { min-height: 260px; }
          .bda-after { text-align: left; }
          .bda-after .bda-copy { margin-left: 0; }
          .jr-bda-desktop { display: none; }
          /* the mobile route line ran straight through the stage copy */
          .jr-bda-mobile { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-kb, .jr-fast, .jr-slow, .jr-wide, .jr-loop, .jr-ring,
          .sig path, .sig circle, .sig-rebuild circle {
            animation: none !important;
          }
        }

        /* =====================================================
           DESKTOP-ONLY CORRECTION (>=900px)
           Everything above this point also governs mobile/tablet and is
           UNCHANGED from the prior release. Everything below only takes
           effect at >=900px, so mobile output is byte-identical to what
           was already live.
           ===================================================== */
        .desktop-only { display: none; }

        /* .page must be flex at EVERY width (not just >=900px) — the order
           values immediately below are what pin mobile/tablet to its current
           visual sequence even though sec-programs was physically relocated
           in the JSX for the desktop rewrite. Without this, the "order"
           values below would be inert on mobile and the physical DOM move
           would leak into mobile's visual order. */
        .page { display: flex; flex-direction: column; }
        /* .shell has margin:0 auto for centering in normal block flow. As a
           flex item, an auto horizontal margin overrides align-items:stretch
           and shrink-wraps the item to its content's max-content width
           instead of filling/centering within the flex container — silently
           breaking .shell's max-width+centering at ANY width where content
           is narrower than the container. Forcing width:100% on every flex
           item restores the original stretch-then-cap-then-center behavior
           at every breakpoint (mobile and desktop alike). */
        .page > [class*="sec-"] { width: 100%; }
        /* Same section order on every width — mobile used to push "Programs
           built around real outcomes" to the very end, after the reviews. */
        .sec-hero{order:10} .sec-outcomes{order:20} .sec-bda{order:30}
        .sec-programs{order:40} .sec-destphotos{order:50} .sec-tanya{order:60}
        .sec-hiw{order:70} .sec-tracks{order:80} .sec-china{order:90}
        .sec-partners{order:100} .sec-traction{order:110} .sec-reviews{order:120}
        .sec-quote{order:130}

        @media (min-width: 900px) {
          .desktop-only { display: block; }

          /* New product IA order — spine (hero -> outcomes -> loop -> real
             programs -> destinations) first, supplementary discovery content
             next, trust + WS close last, right before the footer. */
          .sec-hero{order:10} .sec-outcomes{order:20} .sec-bda{order:30}
          .sec-programs{order:40} .sec-destphotos{order:50} .sec-tanya{order:60}
          .sec-hiw{order:70} .sec-tracks{order:80} .sec-china{order:90}
          .sec-partners{order:100} .sec-traction{order:110} .sec-reviews{order:120}
          .sec-quote{order:130}

          .hero-grid { gap: 56px; }
          .jr-hero-desktop { display: none; }

          .outcome-field { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; align-items: stretch; }
          .outcome-tile {
            grid-column: auto;
            background: var(--card-bg);
            border: var(--card-border);
            border-radius: var(--r-lg);
            padding: 22px;
          }
          .outcome-tile .sig { width: 72px; height: 32px; max-height: 32px; }
          .outcome-name { font-size: 20px; margin: 14px 0 6px; }
          .outcome-hook { font-size: 13px; margin-bottom: 12px; }

          .jr-bda-desktop { display: none; }
          .bda { min-height: 260px; margin-top: 28px; }
          .bda-during { min-height: 260px; }
          .bda-stage { padding: 18px 16px; }
          .bda-num { font-size: 14px; }
          .bda-copy { font-size: 13px; max-width: 200px; }
        }
      `}</style>
    </div>
  )
}

function Stat({ n, sub }: { n: string; sub: string }) {
  return (
    <div>
      <strong style={{ color: "var(--ink)", fontSize: 22, fontWeight: 500, fontFamily: "var(--font-display)" }}>
        {n}
      </strong>
      <br />
      {sub}
    </div>
  )
}
