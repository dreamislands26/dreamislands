import type { Metadata } from "next"
import TrackTemplate, { type ProgrammeType } from "../TrackTemplate"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Island Immersion Programmes in Asia",
  description:
    "What the Island Immersion track actually involves — composite, longer-stay protocols combining Taiji, TCM, medical wellness and deep internal practice, who it's for, typical duration and price, and real matched programmes in China.",
  alternates: { canonical: "/tracks/island-immersion" },
  openGraph: {
    title: "Island Immersion Programmes in Asia | Dream Islands",
    description:
      "What Island Immersion involves, who it's for, programme types, duration, destinations and real matched programmes across Asia.",
    url: "https://dreamislands.org/tracks/island-immersion",
  },
}

const WHAT_IT_INVOLVES = [
  "A composite protocol — several practices combined (Taiji, Qigong, TCM diagnosis, meditation, medical wellness) rather than one single focus",
  "A longer stay, typically 6-11 days, long enough to go past an initial reset into deeper conditioning",
  "Daily structured practice, often built around traditional Chinese wellness disciplines",
  "In several programmes, a medical-wellness or diagnostic layer alongside the physical practice",
  "A full immersion in place — most Island Immersion programmes are set in a single destination for the whole stay, not a multi-stop itinerary",
]

const WHO_ITS_FOR = [
  "You've done a shorter reset before and want to go deeper, not just repeat it",
  "You want a genuine immersion in one place and one practice, not a sampler of everything",
  "You have 6-11 days available and want to use all of it on a structured, composite protocol",
  "You're drawn to traditional Chinese wellness practice (Taiji, Qigong, TCM) as a serious discipline, not a one-off activity",
]

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
    a: "It's the cohort of composite, longer-stay programmes — 6-11 days, combining several practices (Taiji, TCM, medical wellness, meditation) into one structured protocol at a single destination, rather than a short single-focus reset.",
  },
  {
    q: "Is Island Immersion the same as a longer version of Reset & Recovery?",
    a: "Related but not the same. Reset & Recovery is about down-regulating from stress and depletion. Island Immersion is broader — it combines multiple practices and disciplines over a longer stay, often including traditional Chinese wellness practice as a serious, sustained discipline rather than a single detox protocol.",
  },
  {
    q: "Do I need prior experience with Taiji or Qigong?",
    a: "No. Most programmes are structured for genuine beginners, with the most advanced protocol (10-Day Deep Internal Practice) recommended for people who've already done a shorter Wudang programme and want to go deeper.",
  },
  {
    q: "Is the medical-wellness component in these programmes a substitute for my own doctor?",
    a: "No. Where a programme includes diagnostics or a medical-wellness layer, it's a proactive, preventive addition to the stay, not a substitute for ongoing care with your own physician. Dream Islands is a Destination Marketing Organization, not a medical institution, and this is not medical advice.",
  },
]

export default async function IslandImmersionTrackPage() {
  return (
    <TrackTemplate
      title={"Island Immersion"}
      trackParam="Immersion"
      lead={"Composite, longer-stay protocols. Here's what this track actually involves, who it's for, the programme types available across Asia, and which real programmes match."}
      involvesIntro={"The specifics vary by programme and destination, but Island Immersion programmes share a common shape."}
      involves={WHAT_IT_INVOLVES}
      whoFor={WHO_ITS_FOR}
      note={"Dream Islands is a Destination Marketing Organization promoting wellness travel \u2014 not a medical institution. This is not medical advice."}
      types={PROGRAMME_TYPES}
      slugs={TRACK_SLUGS}
      faqs={FAQS}
    />
  )
}
