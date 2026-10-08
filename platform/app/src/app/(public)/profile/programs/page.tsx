import Link from "next/link"
import { Icon } from "../../_components/Icon"
import { JourneyDetails } from "../_components/JourneyBlocks"
import { loadProfile } from "../_components/load"

export default async function MyPrograms() {
  const data = await loadProfile()
  if (data.state !== "guest") return null
  const { journeys } = data.cabinet

  return (
    <div className="profile-grid">
      {journeys.length === 0 ? (
        <section className="card profile-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <h2 className="display" style={{ fontSize: 32, margin: "0 0 10px", color: "var(--ink)" }}>No programs yet</h2>
          <p className="body" style={{ margin: "0 auto 24px", maxWidth: 420 }}>
            Every journey you request or book with us appears here, with its dates, status and goals.
          </p>
          <Link href="/programs" className="btn btn-primary">
            Browse programs <Icon.arrow width={16} height={16} />
          </Link>
        </section>
      ) : (
        journeys.map((j) => (
          <section key={j.booking_id} className="card profile-card">
            <JourneyDetails journey={j} showStatus />
          </section>
        ))
      )}
    </div>
  )
}
