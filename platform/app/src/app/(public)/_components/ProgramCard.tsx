// Legacy entry point: older pages import this. It now renders the DS v2 card.
import type { LandingProgram } from "../_lib/programMapping"
import { ProgramCard as DsProgramCard } from "../ds/cards"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ProgramCard({ program, variant }: { program: LandingProgram; variant?: "rail" | "wide" | "featured" }) {
  return <DsProgramCard program={program} />
}
