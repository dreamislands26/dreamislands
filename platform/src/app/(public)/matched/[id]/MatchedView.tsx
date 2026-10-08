"use client"

import Link from "next/link"
import { COHORT_LABELS } from "../../_lib/programMapping"
import MatchedPrograms, { type MatchedProgram } from "../../_components/MatchedPrograms"
import { useAccount } from "../../_components/account/AuthProvider"

type SubScores = {
  body?: number
  recovery?: number
  metabolic?: number
  mind?: number
  risk?: number
}

function scoreColor(s: number): string {
  if (s >= 70) return "var(--accent)"
  if (s >= 50) return "#d4882a"
  return "#a87840"
}

export default function MatchedView({
  userId,
  name,
  wbsScore,
  cohort,
  focus,
  subScores,
  flags,
  programs,
}: {
  userId: string
  name: string | null
  wbsScore: number | null
  cohort: number | null
  focus: string | null
  subScores: SubScores
  flags: { cvd?: boolean; cancer?: boolean }
  programs: MatchedProgram[]
}) {
  const cohortLabel = cohort != null ? COHORT_LABELS[cohort] : null
  const hasFlag = flags.cvd || flags.cancer

  const safetyScore = subScores.risk != null ? Math.round(100 - subScores.risk) : undefined

  return (
    <div className="page" style={{ paddingBottom: 80 }}>
      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Your WS</div>
        <h1
          className="display"
          style={{ margin: 0, fontSize: "clamp(40px, 10vw, 72px)", color: "var(--ink)" }}
        >
          {name ? (
            <>
              {name}, <span className="display-italic" style={{ color: "var(--accent)" }}>welcome</span>.
            </>
          ) : (
            <>
              Welcome, <span className="display-italic" style={{ color: "var(--accent)" }}>friend</span>.
            </>
          )}
        </h1>
        <p className="body-lg" style={{ marginTop: 16, maxWidth: 620 }}>
          Here&apos;s your baseline score and matched programmes. Reserve dates inline or chat with
          our team on WhatsApp.
        </p>

        <div className="matched-summary" style={{ display: "grid", gap: 16, marginTop: 32 }}>
          <div className="card" style={{ padding: 28, textAlign: "center" }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Baseline score</div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                // Scales with the card so "/100" never gets clipped in the narrow two-column layout.
                fontSize: "clamp(48px, 7vw, 96px)",
                lineHeight: 1,
                whiteSpace: "nowrap",
                color: wbsScore != null ? scoreColor(wbsScore) : "var(--ink-3)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {wbsScore ?? "—"}
              <span style={{ fontSize: "0.33em", color: "var(--ink-3)" }}>/100</span>
            </div>
          </div>
          <div className="card" style={{ padding: 28 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Primary focus</div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 28,
                color: "var(--ink)",
                marginBottom: 10,
              }}
            >
              {focus ?? "—"}
            </div>
            {cohortLabel && (
              <span className="tag" style={{ background: cohortLabel.color, color: "var(--accent-ink)" }}>
                {cohortLabel.fullName} · {cohortLabel.tagline}
              </span>
            )}
          </div>
        </div>

        {hasFlag && (
          <div
            role="alert"
            className="card"
            style={{
              padding: 18,
              marginTop: 20,
              background: "rgba(168,54,43,.06)",
              borderColor: "rgba(168,54,43,.2)",
            }}
          >
            <div style={{ fontWeight: 600, color: "#a8362b", marginBottom: 6 }}>
              Medical context noted
            </div>
            <div className="body-sm" style={{ color: "var(--ink-2)" }}>
              You flagged
              {flags.cvd ? " cardiovascular history" : ""}
              {flags.cvd && flags.cancer ? " and" : ""}
              {flags.cancer ? " cancer history" : ""} — please mention this when our team reaches
              out so we can match a doctor-supervised protocol.
            </div>
          </div>
        )}

        <div className="card" style={{ padding: 24, marginTop: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Sub-scores</div>
          <div className="subscore-grid">
            <SubScore label="Body" value={subScores.body} />
            <SubScore label="Recovery" value={subScores.recovery} />
            <SubScore label="Metabolic" value={subScores.metabolic} />
            <SubScore label="Mind" value={subScores.mind} />
            <SubScore label="Safety" value={safetyScore} note="100 − risk" />
          </div>
        </div>

        <div style={{ marginTop: 48 }}>
          <MatchedPrograms
            userId={userId}
            name={name}
            programs={programs}
            heading={
              <>
                <h2
                  style={{
                    margin: "0 0 8px",
                    fontFamily: "var(--font-display)",
                    fontSize: 36,
                    fontWeight: 400,
                    color: "var(--ink)",
                  }}
                >
                  {programs.length} matched{" "}
                  <span className="display-italic">{programs.length === 1 ? "programme" : "programmes"}</span>.
                </h2>
                <p className="body" style={{ marginBottom: 24 }}>
                  Top picks in your cohort, sorted by entry price.
                </p>
              </>
            }
          />
        </div>

        <SaveReportLine />
      </section>

      <style>{`
        @media (min-width: 700px) {
          .matched-summary { grid-template-columns: 1fr 1.5fr; align-items: stretch; }
        }
        .subscore-grid { display: grid; gap: 16px; grid-template-columns: repeat(2, 1fr); }
        @media (min-width: 640px) { .subscore-grid { grid-template-columns: repeat(5, 1fr); } }
      `}</style>
    </div>
  )
}

function SubScore({ label, value, note }: { label: string; value: number | undefined; note?: string }) {
  const color = value != null ? scoreColor(value) : "var(--ink-3)"
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 4 }}>{label}</div>
      {note && <div style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 2 }}>{note}</div>}
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 32,
          color,
          marginBottom: 6,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value ?? "—"}
      </div>
      <div style={{ height: 6, borderRadius: 4, background: "var(--surface-2)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value ?? 0}%`, background: color, transition: "width 1s ease" }} />
      </div>
    </div>
  )
}

/** Replaces "save this URL": keep the report in the profile instead. */
function SaveReportLine() {
  const { session, openAuth } = useAccount()
  const signedIn = session?.signedIn === true && session.role === "user"
  return (
    <p className="body-sm" style={{ marginTop: 40, textAlign: "center", color: "var(--ink-3)" }}>
      {signedIn ? (
        <>
          Your baseline is saved in your profile ·{" "}
          <Link href="/profile" style={{ color: "var(--accent)" }}>View</Link>
        </>
      ) : (
        <>
          Want to come back to this later?{" "}
          <button type="button" className="acct-link" style={{ fontSize: 13 }} onClick={() => openAuth({ reason: "save" })}>
            Save report
          </button>
        </>
      )}
    </p>
  )
}

export type { MatchedProgram }
