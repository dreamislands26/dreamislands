import type { Metadata } from "next"
import TrackTemplate, { type ProgrammeType } from "../TrackTemplate"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Mind Balance Programmes in Asia",
  description:
    "What the Mind Balance track actually involves — meditation, yoga, digital detox and nervous-system regulation, who it's for, typical duration and price, and real matched programmes across Thailand, Indonesia, Malaysia and China.",
  alternates: { canonical: "/tracks/mind-balance" },
  openGraph: {
    title: "Mind Balance Programmes in Asia | Dream Islands",
    description:
      "What Mind Balance involves, who it's for, programme types, duration, destinations and real matched programmes across Asia.",
    url: "https://dreamislands.org/tracks/mind-balance",
  },
}

const WHAT_IT_INVOLVES = [
  "Daily meditation, breathwork or yoga practice — structured, not optional add-ons",
  "In several programmes, a digital-detox component: no screens, structured silence",
  "TCM diagnosis, sound healing or other nervous-system down-regulation practices depending on the programme",
  "Space and trained facilitators to actually process what's going on, not just distract from it",
  "A specific take-home practice, not just the memory of feeling calmer for a week",
]

const WHO_ITS_FOR = [
  "Racing thoughts or a mind that won't switch off, even on days off",
  "Sleep that's technically long enough but doesn't feel restorative",
  "A recent life transition, loss, or prolonged high-stress period with no real recovery since",
  "You want to calm the nervous system and restore focus, not build fitness or diagnose a medical condition",
]

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
    a: "It's the cohort of programmes built around calming the nervous system and restoring focus — meditation, yoga, digital detox, sleep and stress-recovery work — rather than physical detox (Reset & Recovery) or training capacity (Performance).",
  },
  {
    q: "Is this therapy, or a substitute for therapy?",
    a: "No. These are wellness travel programmes, not clinical mental health treatment. They can support structured practices like meditation and breathwork and create real distance from stress triggers, but they do not diagnose or treat anxiety disorders, PTSD or clinical depression. Dream Islands is a Destination Marketing Organization, not a medical institution, and this is not medical advice.",
  },
  {
    q: "How long should I go for?",
    a: "A 3-day programme introduces the practice and can shift acute stress. Most people see a more durable change at 5-8 days, with time to actually establish new patterns rather than just decompress.",
  },
  {
    q: "Should I go alone or with a group?",
    a: "Depends what actually helps you. Some Mind Balance programmes are solitary and self-paced; others are community-based with shared workshops and group reflection. Check each programme's specific format before booking.",
  },
]

export default async function MindBalanceTrackPage() {
  return (
    <TrackTemplate
      title={"Mind Balance"}
      trackParam="Mind"
      lead={"Calm the nervous system, restore focus. Here's what this track actually involves, who it's for, the programme types available across Asia, and which real programmes match."}
      involvesIntro={"The specifics vary by programme and destination, but Mind Balance programmes share a common shape."}
      involves={WHAT_IT_INVOLVES}
      whoFor={WHO_ITS_FOR}
      note={"Dream Islands is a Destination Marketing Organization promoting wellness travel \u2014 not a medical institution. This is not medical advice."}
      types={PROGRAMME_TYPES}
      slugs={TRACK_SLUGS}
      faqs={FAQS}
    />
  )
}
