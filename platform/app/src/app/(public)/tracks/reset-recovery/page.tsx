import type { Metadata } from "next"
import TrackTemplate, { type ProgrammeType } from "../TrackTemplate"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Reset & Recovery Programmes in Asia",
  description:
    "What the Reset & Recovery track actually involves — detox protocols, sleep and nervous-system work, who it's for, typical duration and price, and real matched programmes across Thailand, Singapore, Malaysia and China.",
  alternates: { canonical: "/tracks/reset-recovery" },
  openGraph: {
    title: "Reset & Recovery Programmes in Asia | Dream Islands",
    description:
      "What Reset & Recovery involves, who it's for, programme types, duration, destinations and real matched programmes across Asia.",
    url: "https://dreamislands.org/tracks/reset-recovery",
  },
}

const WHAT_IT_INVOLVES = [
  "A structured detox protocol — diet, cleanse, TCM or spa treatments — aimed at measurable markers like inflammation, energy and sleep quality",
  "Daily clinical or wellness sessions rather than unstructured downtime",
  "A circadian reset: consistent sleep-wake timing, light exposure, and often a screen-free wind-down",
  "In several programmes, a biometric or diagnostic baseline you can track against",
  "A concrete take-home protocol, not just a few relaxed days away",
]

const WHO_ITS_FOR = [
  "You're running on chronic fatigue that a normal weekend doesn't fix",
  "You want a genuine physical reset — detox, sleep, inflammation — before addressing anything else",
  "You're dealing with burnout or sustained stress and need to interrupt the pattern, not just rest inside it",
  "You want a structured, clinically-informed protocol rather than an unstructured spa holiday",
]

const PROGRAMME_TYPES: ProgrammeType[] = [
  {
    name: "Structured multi-stage detox",
    bestFor: "First-timers who want a proven, flexible-length protocol",
    duration: "10 days",
    price: "from $2,085",
    location: "Koh Samui, Thailand",
  },
  {
    name: "Mountain TCM recovery",
    bestFor: "Deeper digital detox with traditional Chinese medicine diagnosis",
    duration: "5 days",
    price: "from $2,000",
    location: "Wudang Mountain, China",
  },
  {
    name: "Urban executive reset",
    bestFor: "C-suite and founders who can't take a long trip away",
    duration: "5 days",
    price: "from $1,700",
    location: "Singapore",
  },
  {
    name: "Nature / forest detox",
    bestFor: "Lower-cost entry point, less clinical, more nature-led",
    duration: "5 days",
    price: "from $600",
    location: "Penang, Malaysia",
  },
  {
    name: "Medical-grade hot springs reset",
    bestFor: "Combining detox with a functional-medicine introduction",
    duration: "5 days",
    price: "from $2,200",
    location: "Mile, Yunnan, China",
  },
]

const TRACK_SLUGS = [
  "detox-reset",
  "wudang-executive-burnout-recovery",
  "como-shambala-executive-burnout-reset-5d",
  "happi-village-penang-forest-detox-5n",
  "mile-5d4n-wellness-escape",
]

const FAQS = [
  {
    q: "What does \"Reset & Recovery\" actually mean as a track?",
    a: "It's the cohort of programmes built around a structured physical reset — detox, sleep architecture, nervous-system down-regulation — rather than fitness performance, emotional processing, or a longer composite protocol. Most run 3-10 days and combine a clinical or TCM component with daily structure.",
  },
  {
    q: "Is Reset & Recovery the same as a detox retreat?",
    a: "Overlapping but not identical. Every programme in this track has some detox or reset component, but some lean more toward burnout recovery and sleep specifically, others toward general physical detox. The programme comparison above shows the range.",
  },
  {
    q: "How is this different from the Performance track?",
    a: "Reset & Recovery is about down-regulating — undoing accumulated stress and depletion. Performance is about building capacity back up once you're not running on empty. Some people do a Reset & Recovery programme first, then a Performance programme later.",
  },
  {
    q: "Do these programmes involve medical treatment?",
    a: "Some include a medical or TCM diagnostic component (bloodwork, biometric baseline, TCM consultation); none provide medical treatment or diagnosis of a clinical condition. Dream Islands is a Destination Marketing Organization, not a medical institution, and this is not medical advice.",
  },
]

export default async function ResetRecoveryTrackPage() {
  return (
    <TrackTemplate
      title={"Reset & Recovery"}
      trackParam="Reset"
      lead={"Down-regulate, detox, re-sleep. Here's what this track actually involves, who it's for, the programme types available across Asia, and which real programmes match."}
      involvesIntro={"The specifics vary by programme and destination, but Reset & Recovery programmes share a common shape."}
      involves={WHAT_IT_INVOLVES}
      whoFor={WHO_ITS_FOR}
      note={"Dream Islands is a Destination Marketing Organization promoting wellness travel \u2014 not a medical institution. This is not medical advice."}
      types={PROGRAMME_TYPES}
      slugs={TRACK_SLUGS}
      faqs={FAQS}
    />
  )
}
