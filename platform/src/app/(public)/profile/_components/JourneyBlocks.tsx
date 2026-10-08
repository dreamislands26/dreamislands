import Link from "next/link"
import type { CabinetJourney, CabinetReport, GuestCabinet } from "@/lib/guest-cabinet"
import { formatDay, formatStay } from "@/lib/stay-format"
import { Icon } from "../../_components/Icon"

export function Trend({ points }: { points: GuestCabinet["points"] }) {
  const W = 320
  const H = 140
  const pad = 14
  if (points.length < 2) {
    return (
      <div
        style={{
          height: 140,
          borderRadius: "var(--r-md)",
          border: "1px dashed var(--line)",
          display: "grid",
          placeItems: "center",
          padding: 18,
          textAlign: "center",
        }}
      >
        <span className="body-sm">
          Your trend line starts with the next check-in — before, during or after a journey.
        </span>
      </div>
    )
  }
  const scores = points.map((p) => p.score)
  const lo = Math.max(0, Math.min(...scores) - 10)
  const hi = Math.min(100, Math.max(...scores) + 10)
  const span = Math.max(1, hi - lo)
  const xy = points.map((p, i) => [
    pad + (i * (W - pad * 2)) / (points.length - 1),
    pad + ((hi - p.score) * (H - pad * 2)) / span,
  ])
  const line = xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const [lx, ly] = xy[xy.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 140 }} preserveAspectRatio="none" role="img"
      aria-label={`WS trend from ${scores[0]} to ${scores[scores.length - 1]}`}>
      <polyline points={line} fill="none" stroke="var(--accent-soft)" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r={6} fill="var(--ink)" />
    </svg>
  )
}

/** Block 1 of the artifact: baseline → current, the delta line, and the trend. */
export function ScoreBlock({ cabinet }: { cabinet: GuestCabinet }) {
  const { baseline, current, baselineDate, points } = cabinet
  const hasTrend = points.length > 1
  const delta = baseline != null && current != null ? current - baseline : null
  return (
    <section className="card profile-card" aria-label="Wellness score">
      <div style={{ display: "grid", gap: 28, alignItems: "center", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
            {hasTrend && (
              <>
                <span style={{ fontSize: 22, color: "var(--ink-3)", fontVariantNumeric: "tabular-nums" }}>{baseline}</span>
                <span style={{ fontSize: 20, color: "var(--ink-3)" }}>→</span>
              </>
            )}
            <span className="display" style={{ fontSize: 72, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
              {current}
            </span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, marginTop: 8, color: delta != null && delta < 0 ? "#e2a15f" : "var(--accent)" }}>
            {hasTrend && delta != null
              ? `${delta > 0 ? "+" : delta < 0 ? "−" : "±"}${Math.abs(delta)} since your baseline intake`
              : `Your baseline intake${baselineDate ? ` · ${formatDay(baselineDate)}` : ""}`}
          </div>
          <p className="body-sm" style={{ marginTop: 10, maxWidth: "34ch", color: "var(--ink-2)" }}>
            Calculated from your sleep, energy, stress and movement check-ins before, during and after each journey.
          </p>
        </div>
        <Trend points={points} />
      </div>
    </section>
  )
}

export function JourneyDetails({ journey, showStatus }: { journey: CabinetJourney; showStatus?: boolean }) {
  const done = journey.status === "completed"
  const meta = [
    journey.property_name,
    journey.duration_days ? `${journey.duration_days} days` : null,
    formatStay(journey.arrival, journey.departure),
    showStatus ? null : journey.status_label,
  ].filter(Boolean)
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
        <h3 style={{ margin: 0, fontSize: 19, fontWeight: 500, color: "var(--ink)" }}>
          {journey.program_name}
          {journey.location ? ` — ${journey.location}` : ""}
        </h3>
        {showStatus && <span className={done ? "tag" : "tag tag-outline"}>{journey.status_label}</span>}
      </div>
      <div className="body-sm" style={{ color: "var(--ink-2)", marginBottom: journey.goals.length ? 18 : 0 }}>
        {meta.join(" · ")}
      </div>
      {journey.goals.length > 0 && (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "10px 24px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {journey.goals.map((g) => (
            <li key={g} className="profile-goal">
              <span
                className="profile-goal-dot"
                style={done ? { background: "var(--accent)", color: "var(--accent-ink)" } : { border: "1.5px solid var(--line)", color: "var(--ink-3)" }}
                aria-hidden
              >
                {done && (
                  <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12.5 4.5 4.5L19 7.5" />
                  </svg>
                )}
              </span>
              {g}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Block 3: the current program with its goals. */
export function CurrentProgram({ journey }: { journey: CabinetJourney | null }) {
  return (
    <section className="card profile-card" aria-label="Current program">
      <div className="eyebrow" style={{ marginBottom: 14 }}>Current program</div>
      {journey ? (
        <JourneyDetails journey={journey} />
      ) : (
        <div>
          <p className="body" style={{ margin: "0 0 18px" }}>
            No program yet. Pick one that matches your score, or ask us to put one together for you.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/programs" className="btn btn-primary">Browse programs <Icon.arrow width={16} height={16} /></Link>
          </div>
        </div>
      )}
    </section>
  )
}

const DIMENSION_HINT: Record<string, string> = {
  Body: "Movement, strength, energy",
  Recovery: "Sleep and how you bounce back",
  Metabolic: "Weight, nutrition, metabolism",
  Mind: "Stress, mood, focus",
  Safety: "Lifestyle and medical risk — higher is safer",
}

function tone(v: number) {
  return v >= 70 ? "var(--accent)" : v >= 50 ? "#e2c46f" : "#d4882a"
}

function Ring({ value }: { value: number }) {
  const r = 30
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(100, value))
  return (
    <svg viewBox="0 0 72 72" width={72} height={72} aria-hidden>
      <circle cx={36} cy={36} r={r} fill="none" stroke="var(--line)" strokeWidth={6} />
      <circle
        cx={36}
        cy={36}
        r={r}
        fill="none"
        stroke={tone(v)}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={`${(v / 100) * c} ${c}`}
        transform="rotate(-90 36 36)"
      />
      <text x={36} y={41} textAnchor="middle" fontSize={17} fill="var(--ink)" style={{ fontVariantNumeric: "tabular-nums" }}>
        {value}
      </text>
    </svg>
  )
}

/** Block 2: the stats breakdown — five dimensions of the latest assessment, with change since the first. */
export function StatsBreakdown({ report }: { report: CabinetReport }) {
  const before = new Map((report.baseline_dimensions ?? []).map((d) => [d.label, d.value]))
  const strongest = [...report.dimensions].sort((a, b) => b.value - a.value)[0]
  const weakest = [...report.dimensions].sort((a, b) => a.value - b.value)[0]
  return (
    <section className="card profile-card" aria-label="Your breakdown">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
        <div className="eyebrow">Your breakdown{report.date ? ` · ${formatDay(report.date)}` : ""}</div>
        <Link href="/start" className="acct-link">Retake the assessment</Link>
      </div>
      <p className="body" style={{ margin: "0 0 22px", maxWidth: 620 }}>
        {report.focus ? <>Focus: <span style={{ color: "var(--ink)" }}>{report.focus}</span>. </> : null}
        {strongest && weakest && strongest.label !== weakest.label && (
          <>
            Strongest in <span style={{ color: "var(--accent)" }}>{strongest.label.toLowerCase()}</span>, most room
            to grow in <span style={{ color: "#e2a15f" }}>{weakest.label.toLowerCase()}</span>.
          </>
        )}
      </p>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {report.dimensions.map((d) => {
          const prev = before.get(d.label)
          const delta = prev == null ? null : d.value - prev
          return (
            <div
              key={d.label}
              style={{ border: "1px solid var(--line-2)", borderRadius: "var(--r-md)", padding: "16px 16px 14px", background: "color-mix(in oklab, var(--bg) 40%, transparent)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Ring value={d.value} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "var(--ink)", fontSize: 15 }}>{d.label}</div>
                  {delta != null && delta !== 0 && (
                    <div style={{ fontSize: 12, marginTop: 2, color: delta > 0 ? "var(--accent)" : "#e2a15f" }}>
                      {delta > 0 ? "▲" : "▼"} {Math.abs(delta)} since first
                    </div>
                  )}
                </div>
              </div>
              <div className="body-sm" style={{ marginTop: 10 }}>{DIMENSION_HINT[d.label] ?? ""}</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/** Signed up without an assessment yet: the big call to action. */
export function TakeAssessment() {
  return (
    <section
      className="card profile-card"
      style={{ textAlign: "center", padding: "56px 24px", background: "radial-gradient(120% 100% at 50% 0%, color-mix(in oklab, var(--accent) 14%, transparent), transparent 70%), var(--surface-2)" }}
    >
      <div className="eyebrow" style={{ marginBottom: 12 }}>Start here</div>
      <h2 className="display" style={{ fontSize: "clamp(30px, 5vw, 44px)", margin: "0 0 12px", color: "var(--ink)" }}>
        Get your Wellbeing &amp; Wellness Score
      </h2>
      <p className="body" style={{ maxWidth: 480, margin: "0 auto 28px" }}>
        23 quick questions about sleep, energy, stress and movement. Your score becomes the baseline this page
        tracks before, during and after every journey.
      </p>
      <Link href="/start" className="btn btn-primary btn-lg">
        Take the assessment <Icon.arrow width={16} height={16} />
      </Link>
    </section>
  )
}
