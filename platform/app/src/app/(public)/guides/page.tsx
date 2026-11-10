import type { Metadata } from "next"
import { ButtonLink, ListItem, SectionHead } from "../ds/ui"
import x from "../ds/sections.module.css"
import t from "../tracks/track.module.css"

export const metadata: Metadata = {
  title: "Wellness Travel Guides for Asia | Dream Islands",
  description:
    "Practical guides to wellness travel in Asia: retreats by outcome (burnout, sleep, stress, longevity, metabolic health, mental clarity, fitness, energy) and by destination (Bali, Koh Samui, Singapore, Boracay, Wudang, Yunnan), plus medical travel in China.",
  alternates: { canonical: "/guides" },
  openGraph: {
    title: "Wellness Travel Guides for Asia | Dream Islands",
    description: "Retreat guides by outcome and by destination across Asia, with real matched programmes, duration and price.",
    url: "https://dreamislands.org/guides",
  },
}

type Guide = { href: string; icon: string; title: string; sub: string }

const OUTCOME: Guide[] = [
  { href: "/guides/burnout-recovery-retreats-southeast-asia", icon: "self_improvement", title: "Burnout recovery", sub: "Retreats in Southeast Asia" },
  { href: "/guides/sleep-reset-retreats-asia", icon: "bedtime", title: "Sleep and nervous system reset", sub: "Retreats in Asia" },
  { href: "/guides/anxiety-stress-recovery-retreats-asia", icon: "psychology", title: "Anxiety and stress recovery", sub: "Retreats in Asia" },
  { href: "/guides/longevity-executive-health-retreats-asia", icon: "monitoring", title: "Longevity and executive health", sub: "Retreats in Asia" },
  { href: "/guides/metabolic-health-retreats-asia", icon: "nutrition", title: "Metabolic health", sub: "Retreats in Asia" },
  { href: "/guides/mental-clarity-retreats-asia", icon: "lightbulb", title: "Mental clarity", sub: "Retreats in Asia" },
  { href: "/guides/fitness-recovery-retreats-asia", icon: "fitness_center", title: "Fitness and recovery", sub: "Retreats in Asia" },
  { href: "/guides/boost-energy-retreats-asia", icon: "bolt", title: "Boost energy", sub: "Retreats in Asia" },
]

const DESTINATION: Guide[] = [
  { href: "/guides/bali-wellness-guide", icon: "place", title: "Bali", sub: "Yoga, emotional reset and fasting" },
  { href: "/guides/koh-samui-koh-phangan-wellness-guide", icon: "place", title: "Koh Samui and Koh Phangan", sub: "Thailand" },
  { href: "/guides/singapore-sentosa-wellness-guide", icon: "place", title: "Singapore and Sentosa", sub: "Singapore" },
  { href: "/guides/boracay-wellness-guide", icon: "place", title: "Boracay", sub: "Philippines" },
  { href: "/guides/wudang-mountain-wellness-guide", icon: "place", title: "Wudang Mountain", sub: "China" },
  { href: "/guides/mile-yunnan-wellness-guide", icon: "place", title: "Mile, Yunnan", sub: "China" },
]

const MEDICAL: Guide[] = [
  { href: "/medical/china/guides/second-opinion-china", icon: "medical_services", title: "Second opinion in China", sub: "Remote review before you travel" },
  { href: "/medical/china/guides/cost-of-treatment-china", icon: "payments", title: "Cost of treatment in China", sub: "Service fees and hospital charges" },
  { href: "/medical/china/guides/how-to-arrange-treatment-china", icon: "route", title: "How to arrange treatment in China", sub: "Step by step" },
  { href: "/medical/china/guides/how-to-choose-hospital-china", icon: "local_hospital", title: "How to choose a hospital in China", sub: "Selection criteria" },
  { href: "/medical/china/guides/hospitals-china-international-patients", icon: "apartment", title: "Hospitals in China for international patients", sub: "Where we refer" },
]

function Group({ overline, title, sub, items }: { overline: string; title: string; sub: string; items: Guide[] }) {
  return (
    <section className={x.sectionLoose}>
      <p className={x.overline}>{overline}</p>
      <SectionHead title={title} sub={sub} />
      <div className={t.two}>
        {items.map((g) => (
          <ListItem key={g.href} icon={g.icon} headline={g.title} supporting={g.sub} href={g.href} trailing={<span className="ds-icon" aria-hidden>chevron_right</span>} />
        ))}
      </div>
    </section>
  )
}

export default function GuidesHubPage() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Wellness Travel Guides for Asia",
    url: "https://dreamislands.org/guides",
    hasPart: [...OUTCOME, ...DESTINATION].map((g) => ({ "@type": "WebPage", name: g.title, url: `https://dreamislands.org${g.href}` })),
  }
  return (
    <div className="ds-container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <header className={x.pageHead}>
        <p className={x.overline} style={{ margin: 0 }}>Guides</p>
        <h1 className="ds-display-s">Wellness travel guides for Asia</h1>
        <p className="ds-body-l ds-muted">
          What each retreat type actually involves, who it suits, typical duration and price, and real matched programmes. Pick by what you want to change, or by where you want to go.
        </p>
        <div className={t.actions}>
          <ButtonLink href="/start" variant="filled" size="l">Start your Wellness Journey</ButtonLink>
          <ButtonLink href="/programs" variant="tonal" size="l">Browse programmes</ButtonLink>
        </div>
      </header>

      <Group overline="By outcome" title="What do you want to change?" sub="Guides built around the outcome you are after." items={OUTCOME} />
      <Group overline="By destination" title="Where do you want to go?" sub="What each destination offers, and which properties and programmes fit." items={DESTINATION} />
      <section className={`${x.sectionLoose} ${x.last}`}>
        <p className={x.overline}>Medical travel</p>
        <SectionHead title="Treatment in China" sub="For international patients. Coordination only, no medical advice." action={<ButtonLink href="/medical/china" variant="tonal" size="m">Medical China hub</ButtonLink>} />
        <div className={t.two}>
          {MEDICAL.map((g) => (
            <ListItem key={g.href} icon={g.icon} headline={g.title} supporting={g.sub} href={g.href} trailing={<span className="ds-icon" aria-hidden>chevron_right</span>} />
          ))}
        </div>
      </section>
    </div>
  )
}
