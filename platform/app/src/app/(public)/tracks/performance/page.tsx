import type { Metadata } from "next"
import TrackTemplate, { type ProgrammeType } from "../TrackTemplate"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Performance Programmes in Asia",
  description:
    "What the Performance track actually involves — training, executive health diagnostics, event prep and recovery cycles, who it's for, typical duration and price, and real matched programmes across Indonesia, the Philippines and China.",
  alternates: { canonical: "/tracks/performance" },
  openGraph: {
    title: "Performance Programmes in Asia | Dream Islands",
    description:
      "What Performance involves, who it's for, programme types, duration, destinations and real matched programmes across Asia.",
    url: "https://dreamislands.org/tracks/performance",
  },
}

const WHAT_IT_INVOLVES = [
  "Structured training — sport-specific prep, periodised loading, or general capacity building depending on the programme",
  "In several programmes, comprehensive diagnostics: full biomarker panels, functional-medicine assessments",
  "Active recovery built into the schedule, not bolted on — mobility, soft-tissue work, hydrotherapy",
  "For event-prep programmes, race-simulation days and taper planning ahead of a specific goal (a triathlon, an Ironman)",
  "A concrete, personalized protocol to take home, not just a week of hard training",
]

const WHO_ITS_FOR = [
  "You've optimized diet and exercise on your own and want the next layer — real diagnostics, not guesswork",
  "You're training for a specific event and need a structured camp, not a generic gym holiday",
  "You're a high-performing professional whose energy, sleep and recovery are quietly declining under load",
  "You want to rebuild capacity after a period of depletion, rather than just resting",
]

const PROGRAMME_TYPES: ProgrammeType[] = [
  {
    name: "Professional performance reset",
    bestFor: "Active professionals wanting structured training plus recovery",
    duration: "5 days",
    price: "from $1,150",
    location: "Bintan, Indonesia",
  },
  {
    name: "Event-specific prep camp",
    bestFor: "Training for a triathlon or Ironman with race-simulation days",
    duration: "7 days",
    price: "from $1,330",
    location: "Cebu, Philippines",
  },
  {
    name: "Executive health & recovery",
    bestFor: "Comprehensive diagnostics plus a functional recovery protocol",
    duration: "7 days",
    price: "from $5,500",
    location: "Mile, Yunnan, China",
  },
  {
    name: "Active recovery cycle",
    bestFor: "Post-race or mid-training-block deload",
    duration: "5 days",
    price: "from $550",
    location: "Cebu, Philippines",
  },
]

const TRACK_SLUGS = [
  "club-med-bintan-performance-reset-5d",
  "movenpick-cebu-ironman-prep-camp-7d",
  "mile-executive-health-recovery",
  "ayo-ayo-wellness-active-recovery-5d",
]

const FAQS = [
  {
    q: "What does the Performance track actually mean?",
    a: "It's the cohort of programmes built around training, diagnostics and recovery capacity — either for a specific athletic goal (an Ironman, a triathlon) or general executive health and energy. It's distinct from Reset & Recovery, which is about down-regulating rather than building capacity.",
  },
  {
    q: "Do I need to already be an athlete for these programmes?",
    a: "No. Some programmes are built specifically for event prep (triathlon, Ironman), but others — like the professional performance reset or executive health check-ups — are for anyone wanting structured training and real diagnostics, athlete or not.",
  },
  {
    q: "What's the difference between the executive health programmes and a regular check-up?",
    a: "Comprehensive diagnostics — full biomarker panels, functional medicine assessments, specialist time — go significantly deeper than a routine check-up, and are delivered in a structured multi-day format rather than a single appointment. This is a proactive, preventive layer, not a substitute for your own physician.",
  },
  {
    q: "Is this a substitute for training with my own coach?",
    a: "No. These are structured, time-boxed programmes — useful for a reset, a diagnostic baseline, or event-specific preparation — not a replacement for ongoing coaching or medical care. Dream Islands is a Destination Marketing Organization, not a medical institution, and this is not medical advice.",
  },
]

export default async function PerformanceTrackPage() {
  return (
    <TrackTemplate
      title={"Performance"}
      trackParam="Performance"
      lead={"Train smarter, rebuild capacity. Here's what this track actually involves, who it's for, the programme types available across Asia, and which real programmes match."}
      involvesIntro={"The specifics vary by programme and destination, but Performance programmes share a common shape."}
      involves={WHAT_IT_INVOLVES}
      whoFor={WHO_ITS_FOR}
      note={"Dream Islands is a Destination Marketing Organization promoting wellness travel \u2014 not a medical institution. This is not medical advice."}
      types={PROGRAMME_TYPES}
      slugs={TRACK_SLUGS}
      faqs={FAQS}
    />
  )
}
