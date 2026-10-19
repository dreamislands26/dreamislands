import type { Metadata } from "next"
import TrackTemplate, { type ProgrammeType } from "../TrackTemplate"
export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Sport & Chill Programmes in Asia",
  description:
    "What the Sport & Chill track actually involves — structured activity plus recovery for guests who want an active holiday, not a programme to fix something. Who it's for, real matched programmes in Singapore, and where the category goes next.",
  alternates: { canonical: "/tracks/sport-chill" },
  openGraph: {
    title: "Sport & Chill Programmes in Asia | Dream Islands",
    description:
      "An active, restorative holiday — sport, recovery and leisure, no problem to fix. Who it's for, real matched programmes and what's next for the category.",
    url: "https://dreamislands.org/tracks/sport-chill",
  },
}
const WHAT_IT_INVOLVES = [
  "Real activity, not just a spa week — structured runs, monitored open-water swimming, sports festivals built around the resort's own sporting infrastructure",
  "Recovery built in alongside the activity, not instead of it — spa sessions, a guided performance review, downtime between activity blocks",
  "No diagnostics, no biomarker panels, no take-home protocol — this track is paced as a holiday, not a health intervention",
  "An easy, short-haul location for a quick escape — currently Sentosa, Singapore, close to the city",
  "A newer, growing category — expect more activity types and destinations added over time as it expands beyond today's single property",
]
const WHO_ITS_FOR = [
  "You're already reasonably healthy and just want a better holiday than a standard beach resort — more movement, more structure, still relaxing",
  "You want a short, easy trip rather than a longer wellness protocol",
  "You like the idea of wellness travel but don't want to be assessed, diagnosed or put through a programme",
  "You want some real activity and some real downtime in the same trip, without picking one or the other",
]
const PROGRAMME_TYPES: ProgrammeType[] = [
  {
    name: "Sport & Chill, short break",
    bestFor: "A quick active escape from Singapore city — running tracks, monitored open-water swimming, sports festivals",
    duration: "3 days",
    price: "from $840",
    location: "Sentosa, Singapore",
  },
  {
    name: "Sport & Chill, with recovery",
    bestFor: "The same activity base, plus structured spa recovery and a guided performance review",
    duration: "5 days",
    price: "from $1,350",
    location: "Sentosa, Singapore",
  },
]
const TRACK_SLUGS = [
  "village-hotel-sentosa-sport-chill-3d",
  "village-hotel-sentosa-sport-chill-5d",
]
const FAQS = [
  {
    q: "Is Sport & Chill a wellness programme or just an active holiday?",
    a: "It's positioned as an active holiday first. There's no diagnostic assessment, no biomarker panel and no take-home protocol — just structured activity (running, swimming, sports festivals) with recovery time built in, for guests who want to move more on a trip without entering a formal wellness programme.",
  },
  {
    q: "Do I need to be fit or athletic to join?",
    a: "No. The activity is structured but not competitive — it's built for guests who want an active break, not for training toward a specific event. If you're looking for structured training or event prep specifically, the Performance track is the better fit.",
  },
  {
    q: "How is this different from the Performance track?",
    a: "Performance is built around training capacity, diagnostics and event prep — it assumes you're working toward a specific fitness or health goal. Sport & Chill assumes the opposite: you're already fine and just want a more active version of a normal holiday.",
  },
  {
    q: "Where is Sport & Chill available today?",
    a: "Currently at Village Hotel Sentosa in Singapore, as a 3-day or 5-day stay. This is a new track for Dream Islands, and we expect to add more destinations and activity types over time.",
  },
]
export default async function SportChillTrackPage() {
  return (
    <TrackTemplate
      title={"Sport & Chill"}
      trackParam="SportChill"
      lead={"An active, restorative holiday \u2014 not a programme to fix something. Here's what this track actually involves, who it's for, the programme types available, and which real programmes match."}
      involvesIntro={"The specifics vary as the category grows, but Sport & Chill programmes share a common shape."}
      involves={WHAT_IT_INVOLVES}
      whoFor={WHO_ITS_FOR}
      note={"Dream Islands is a Destination Marketing Organization promoting wellness travel \u2014 not a medical institution. This is not medical advice."}
      types={PROGRAMME_TYPES}
      slugs={TRACK_SLUGS}
      faqs={FAQS}
    />
  )
}
