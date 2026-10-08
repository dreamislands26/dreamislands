import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import { Icon } from "../_components/Icon"

export const metadata: Metadata = {
  title: "About",
  description: "Dream Islands is the outcome-driven wellness travel platform for Asia — baseline first, program match second, measured progress third.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About | Dream Islands",
    description: "The outcome-driven wellness travel platform for Asia — baseline first, program match second, measured progress third.",
    url: "https://dreamislands.org/about",
  },
}

export const dynamic = "force-dynamic"

const STEPS: Array<[string, string, string]> = [
  [
    "01",
    "Baseline",
    "Every journey begins with our 22-question Wellbeing & Wellness Score (WS) across the key dimensions of wellbeing. It gives both you and the platform a consistent starting point.",
  ],
  [
    "02",
    "Match",
    "Your goals, baseline and preferences are matched against structured program data to identify the programs that fit you best. Not whoever paid for placement. Not whichever retreat has the best photographs.",
  ],
  [
    "03",
    "Journey",
    "Once booked, Dream Islands stays with you. Your coordinator and AI-powered concierge connect the booking, program, property and your individual journey — before arrival, during the stay and after you return home.",
  ],
  [
    "04",
    "Outcomes",
    "We check what changed. Your outcomes become part of your wellness history rather than disappearing when the trip ends.",
  ],
  [
    "05",
    "Progress",
    "Your next baseline starts with everything we already know. Over time, Dream Islands becomes a record of where you've been, what worked and where you should go next.",
  ],
]

const JOURNEY_FLOW = [
  "Baseline",
  "Goal",
  "Match",
  "Journey",
  "Check-ins",
  "Outcome",
  "Progress",
  "New Baseline",
  "Next Journey",
]

const SUPPLY_MODELS: Array<[string, string]> = [
  ["Dream Islands managed supply", "Our team structures and manages the property, programs, content and commercial data."],
  ["Partner self-service", "Providers manage their own programs and information through the Dream Islands Partner Platform."],
  ["Connected supply", "Availability and rates can be connected through external APIs and hospitality connectivity infrastructure."],
  [
    "Hybrid supply",
    "Wellness programs and content can live in Dream Islands while accommodation availability and dynamic rates come from external systems.",
  ],
]

const DISTRIBUTION_FLOW = ["Dream Islands", "AI Concierge", "B2B Agents", "White-label Partners", "APIs"]

const PLATFORM_LAYERS: Array<[string, string]> = [
  ["Wellness intelligence", "Baseline, goals, matching, recommendations and outcomes."],
  ["Supply", "Properties, programs, availability, rates and commercial terms."],
  ["Transactions", "Bookings, payments and partner operations."],
  ["Distribution", "Direct guests, agents, white-label partners and external APIs."],
]

const COUNTRY_FLAGS: Record<string, string> = {
  Thailand: "🇹🇭",
  China: "🇨🇳",
  Indonesia: "🇮🇩",
  Singapore: "🇸🇬",
  Philippines: "🇵🇭",
  Vietnam: "🇻🇳",
  Malaysia: "🇲🇾",
}

type LocationRow = {
  id: string
  name: string
  island: string | null
  country: string | null
  image_url: string | null
}

const HERO_STRIP: Array<[string, string]> = [
  ["https://xbzrtofanbrahasxbisf.supabase.co/storage/v1/object/public/properties/tanya-samui/tanya-property-hero.webp", "Tanya Samui, Thailand"],
  ["https://xbzrtofanbrahasxbisf.supabase.co/storage/v1/object/public/properties/wudang/wudang-property-hero.webp", "Wudang Mountain, China"],
  ["https://xbzrtofanbrahasxbisf.supabase.co/storage/v1/object/public/properties/mile/mile-property-hero.jpg", "Mile, China"],
]

function FlowChain({ items }: { items: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
      {items.map((step, i) => (
        <div key={step} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              background: "var(--accent-soft)",
              color: "var(--ink)",
              fontWeight: 600,
              fontSize: 14,
              whiteSpace: "nowrap",
            }}
          >
            {step}
          </span>
          {i < items.length - 1 && (
            <span style={{ color: "var(--ink-3)", fontSize: 16 }} aria-hidden="true">
              →
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export default async function AboutPage() {
  const { data: propRows } = await supabaseAdmin
    .from("properties")
    .select("id, name, island, country, image_url")
    .eq("active", true)
    .is("parent_id", null)
    .neq("name", "")
    .order("country")

  const locations = (propRows ?? []) as LocationRow[]
  const countryCount = new Set(locations.map((l) => l.country).filter(Boolean)).size

  const { count: programCount } = await supabaseAdmin
    .from("programs")
    .select("id", { count: "exact", head: true })
    .eq("active", true)
    .eq("status", "published")

  return (
    <div className="page" style={{ paddingBottom: 80 }}>
      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          About Dream Islands
        </div>
        <h1
          className="display"
          style={{ fontSize: "clamp(40px, 10vw, 72px)", margin: "0 0 24px", color: "var(--ink)" }}
        >
          The <span className="display-italic">Strava</span> for wellness travel.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 760 }}>
          Dream Islands turns wellness travel from a one-off booking into a measurable journey. We
          establish your baseline, match you to programs based on your goals, support you throughout
          the experience, measure what changed — and use that history to make every next journey more
          relevant.
        </p>
        <p className="body-lg" style={{ marginBottom: 8, maxWidth: 760 }}>
          {locations.length} destinations · {countryCount} countries · {programCount ?? "50+"} standardized
          wellness programs across Asia.
        </p>
        <p className="body" style={{ marginBottom: 32, maxWidth: 760, fontWeight: 600, color: "var(--ink)" }}>
          One journey. Not a collection of retreats.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
            marginBottom: 32,
          }}
        >
          {HERO_STRIP.map(([src, alt]) => (
            <div
              key={src}
              style={{ position: "relative", aspectRatio: "4 / 3", borderRadius: 16, overflow: "hidden" }}
            >
              <Image src={src} alt={alt} fill sizes="(max-width: 700px) 33vw, 250px" style={{ objectFit: "cover" }} />
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 32 }}>
          <p className="body" style={{ margin: 0 }}>
            Most wellness travel starts with a destination.
            <br />
            Dream Islands starts with you.
          </p>
        </div>

        {/* 5-STEP JOURNEY */}
        <div style={{ display: "grid", gap: 20, marginBottom: 40 }}>
          {STEPS.map(([n, title, body]) => (
            <div key={n} className="card" style={{ padding: 24, display: "flex", gap: 20 }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 28,
                  color: "var(--accent)",
                  minWidth: 44,
                }}
              >
                {n}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 6, fontSize: 17 }}>
                  {title}
                </div>
                <div className="body-sm">{body}</div>
              </div>
            </div>
          ))}
        </div>

        {/* THE STRAVA IDEA — visually strongest section */}
        <div
          className="card"
          style={{
            padding: "40px 28px",
            marginBottom: 40,
            background: "linear-gradient(160deg, var(--accent-soft), var(--surface))",
            border: "1px solid color-mix(in oklab, var(--accent) 25%, transparent)",
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            The Strava idea
          </div>
          <p className="body-lg" style={{ marginBottom: 24, maxWidth: 680 }}>
            Strava made individual workouts part of a measurable fitness journey. Dream Islands is
            building the same continuity for wellness travel.
          </p>
          <div style={{ marginBottom: 28, overflowX: "auto", paddingBottom: 4 }}>
            <FlowChain items={JOURNEY_FLOW} />
          </div>
          <p style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 10, fontSize: 18 }}>
            Your wellness journey compounds.
          </p>
          <p className="body" style={{ margin: 0, maxWidth: 680 }}>
            One retreat gives you an experience. Several measured journeys create something much more
            valuable: a longitudinal picture of your wellbeing, the interventions you&apos;ve tried and
            the outcomes they produced. That is the foundation Dream Islands is building.
          </p>
        </div>

        {/* BUILT FOR DIFFERENT PROVIDERS */}
        <h2
          style={{
            margin: "8px 0 16px",
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: 32,
            letterSpacing: "-.02em",
            color: "var(--ink)",
          }}
        >
          Built for very different wellness providers.
        </h2>
        <p className="body" style={{ marginBottom: 20, maxWidth: 680 }}>
          Dream Islands doesn&apos;t require every wellness provider to operate the same way. We can
          work with:
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 14,
            marginBottom: 20,
          }}
        >
          {SUPPLY_MODELS.map(([t, b]) => (
            <div key={t} className="card" style={{ padding: 18 }}>
              <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>{t}</div>
              <div className="body-sm">{b}</div>
            </div>
          ))}
        </div>
        <p className="body" style={{ marginBottom: 4, maxWidth: 680 }}>
          All of these ultimately become one standardized Dream Islands experience.
        </p>
        <p style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 24 }}>
          One wellness layer. Multiple ways to distribute it.
        </p>

        <div className="card" style={{ padding: 24, marginBottom: 40 }}>
          <p className="body" style={{ marginBottom: 18, maxWidth: 680 }}>
            The same structured supply can power:
          </p>
          <div style={{ marginBottom: 18, overflowX: "auto", paddingBottom: 4 }}>
            <FlowChain items={DISTRIBUTION_FLOW} />
          </div>
          <p className="body-sm" style={{ margin: 0, maxWidth: 680 }}>
            As the platform develops, Dream Islands is being designed to connect with hospitality
            distribution and connectivity systems for dynamic availability and rate exchange. This
            means a wellness program structured once can eventually be discovered, matched and booked
            across multiple distribution environments.
          </p>
        </div>

        {/* AI WITH HUMANS */}
        <h2
          style={{
            margin: "8px 0 16px",
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: 32,
            letterSpacing: "-.02em",
            color: "var(--ink)",
          }}
        >
          AI with humans where they matter.
        </h2>
        <div className="card" style={{ padding: 24, marginBottom: 40 }}>
          <p className="body" style={{ marginBottom: 14, maxWidth: 680 }}>
            AI helps us structure information, understand intent, match programs and maintain
            continuity across the guest journey. But wellness travel still involves complex decisions,
            logistics and personal circumstances. That&apos;s why every Dream Islands journey can move
            seamlessly from AI assistance to a real human coordinator.
          </p>
          <p style={{ fontWeight: 600, color: "var(--ink)", margin: 0 }}>
            AI when it makes the experience faster. Humans when judgment matters.
          </p>
        </div>

        {/* WHAT WE'RE BUILDING */}
        <h2
          style={{
            margin: "8px 0 16px",
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: 32,
            letterSpacing: "-.02em",
            color: "var(--ink)",
          }}
        >
          What we&apos;re building.
        </h2>
        <p className="body-lg" style={{ marginBottom: 8, maxWidth: 680 }}>
          The intelligence layer for wellness travel.
        </p>
        <p className="body" style={{ marginBottom: 20, maxWidth: 680 }}>
          Today, Dream Islands connects guests with standardized wellness programs across Asia. The
          platform we&apos;re building connects four things that traditionally live separately:
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
            marginBottom: 20,
          }}
        >
          {PLATFORM_LAYERS.map(([t, b]) => (
            <div key={t} className="card" style={{ padding: 18 }}>
              <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>{t}</div>
              <div className="body-sm">{b}</div>
            </div>
          ))}
        </div>
        <p className="body" style={{ marginBottom: 40, maxWidth: 680 }}>
          The result is infrastructure where wellness travel can become increasingly personalized,
          measurable and connected.
        </p>

        {/* WHERE WE OPERATE */}
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            Our network across Asia
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
            }}
          >
            {locations.map((l) =>
              l.image_url ? (
                <div key={l.id} style={{ borderRadius: 14, overflow: "hidden", background: "var(--surface)" }}>
                  <div style={{ position: "relative", aspectRatio: "4 / 3" }}>
                    <Image
                      src={l.image_url}
                      alt={l.name.trim()}
                      fill
                      sizes="(max-width: 700px) 45vw, 180px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 14 }}>{l.name.trim()}</div>
                    <div className="body-sm">{[l.island, l.country].filter(Boolean).join(", ")}</div>
                  </div>
                </div>
              ) : (
                <div
                  key={l.id}
                  style={{ padding: "12px 14px", borderRadius: 14, background: "var(--surface)" }}
                >
                  <div style={{ fontSize: 22 }}>{l.country ? COUNTRY_FLAGS[l.country] ?? "" : ""}</div>
                  <div style={{ fontWeight: 600, color: "var(--ink)", marginTop: 4 }}>{l.name.trim()}</div>
                  <div className="body-sm">{[l.island, l.country].filter(Boolean).join(", ")}</div>
                </div>
              ),
            )}
          </div>
        </div>

        <div
          className="card about-tanya"
          style={{
            padding: 20,
            marginBottom: 32,
            display: "grid",
            gap: 20,
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative", aspectRatio: "4 / 3", borderRadius: 14, overflow: "hidden" }}>
            <Image
              src="https://xbzrtofanbrahasxbisf.supabase.co/storage/v1/object/public/properties/tanya-samui/tanya-property-hero.webp"
              alt="Tanya Samui Holistic Health Retreat"
              fill
              sizes="220px"
              style={{ objectFit: "cover" }}
            />
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Tanya Samui Holistic Health Retreat
            </div>
            <p className="body" style={{ margin: "0 0 14px" }}>
              One of the longest-standing properties in our network — 15+ years operating on Koh Samui,
              endorsed by members of the Thai Royal Family and honored with a United Nations award for
              its contribution to public health.
            </p>
            <Link href="/tanya-samui" className="btn btn-soft" style={{ display: "inline-flex" }}>
              Explore Tanya Samui {"→"}
            </Link>
          </div>
        </div>

        <h2
          style={{
            margin: "48px 0 16px",
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: 36,
            letterSpacing: "-.02em",
            color: "var(--ink)",
          }}
        >
          Talk to us <span className="display-italic">directly</span>.
        </h2>
        <p className="body" style={{ marginBottom: 20 }}>
          We&apos;ll WhatsApp you within a few minutes. No spam, no list resale.
        </p>
        <div style={{ display: "grid", gap: 10, maxWidth: 380 }}>
          <a
            className="btn btn-primary btn-lg btn-block"
            href="https://wa.me/message/HOF2AFIBDYY5J1"
            target="_blank"
            rel="noreferrer"
          >
            <Icon.wa width={18} height={18} /> Message on WhatsApp
          </a>
          <a className="btn btn-ghost btn-lg btn-block" href="mailto:hello@dreamislands.org">
            hello@dreamislands.org
          </a>
          <Link className="btn btn-soft btn-block" href="/start">
            Or take the 2-minute WS <Icon.arrow width={16} height={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}
