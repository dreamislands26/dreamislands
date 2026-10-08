import { CurrentProgram, ScoreBlock, StatsBreakdown, TakeAssessment } from "./_components/JourneyBlocks"
import { loadProfile } from "./_components/load"

export default async function MyWellnessJourney() {
  const data = await loadProfile()
  if (data.state !== "guest") return null
  const { cabinet } = data

  if (cabinet.current == null) {
    return (
      <div className="profile-grid">
        <TakeAssessment />
        {cabinet.current_journey && <CurrentProgram journey={cabinet.current_journey} />}
      </div>
    )
  }

  return (
    <div className="profile-grid">
      <ScoreBlock cabinet={cabinet} />
      {cabinet.report && <StatsBreakdown report={cabinet.report} />}
      <CurrentProgram journey={cabinet.current_journey} />
    </div>
  )
}
