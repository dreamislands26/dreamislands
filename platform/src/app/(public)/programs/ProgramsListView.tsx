"use client"

import { useMemo, useState } from "react"
import { TRACKS, type LandingProgram } from "../_lib/programMapping"
import { COUNTRIES, COUNTRY_FLAGS, countryFromSlug } from "../_lib/countries"
import ProgramCard from "../_components/ProgramCard"
import { Icon } from "../_components/Icon"

type Filter = "All" | "Reset" | "Performance" | "Mind" | "Immersion" | "SportChill"
const FILTERS: Filter[] = ["All", "Reset", "Performance", "Mind", "Immersion", "SportChill"]

function isFilter(s: string): s is Filter {
  return (FILTERS as string[]).includes(s)
}

export default function ProgramsListView({
  programs,
  initialFilter,
  initialCountry,
}: {
  programs: LandingProgram[]
  initialFilter: string
  initialCountry?: string
}) {
  const [filter, setFilter] = useState<Filter>(isFilter(initialFilter) ? initialFilter : "All")

  const resolvedInitialCountry =
    initialCountry && initialCountry !== "All" ? countryFromSlug(initialCountry) ?? "All" : "All"
  const [country, setCountry] = useState<string>(resolvedInitialCountry)

  const grouped = useMemo(
    () =>
      TRACKS.map((t) => {
        const items = programs.filter((p) => p.track === t.id)
        if (t.id === "Performance") {
          items.sort((a, b) => {
            const aFirst = a.performanceSubtype?.code === "sport_chill" ? 0 : 1
            const bFirst = b.performanceSubtype?.code === "sport_chill" ? 0 : 1
            return aFirst - bFirst
          })
        }
        return { ...t, items }
      }).filter((g) => g.items.length),
    [programs],
  )

  const matchesFilters = (p: LandingProgram) =>
    (filter === "All" || p.track === filter) && (country === "All" || p.country === country)

  const shown = programs.filter(matchesFilters)
  const showGrouped = filter === "All" && country === "All"

  return (
    <div className="page" style={{ paddingBottom: 120 }}>
      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>All programs</div>
        <h1
          className="display"
          style={{ fontSize: "clamp(40px, 10vw, 72px)", margin: "0 0 16px", color: "var(--ink)" }}
        >
          Best <span className="display-italic">trips</span> for you.
        </h1>
        <p className="body-lg" style={{ marginBottom: 28, maxWidth: 640 }}>
          Every program here is matched to a goal, not a place - detox, performance, calm or
          longevity - and tracked from baseline to outcome, not just booked and forgotten.
        </p>

        <div
          style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 10 }}
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="tag"
              style={{
                flex: "0 0 auto",
                padding: "10px 16px",
                fontSize: 13,
                background: filter === f ? "var(--accent)" : "var(--surface-2)",
                color: filter === f ? "var(--accent-ink)" : "var(--ink-2)",
                border: "1px solid " + (filter === f ? "var(--accent)" : "var(--line)"),
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <div
          style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 12 }}
        >
          {["All", ...COUNTRIES].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCountry(c)}
              className="tag"
              style={{
                flex: "0 0 auto",
                padding: "10px 16px",
                fontSize: 13,
                background: country === c ? "var(--accent)" : "var(--surface-2)",
                color: country === c ? "var(--accent-ink)" : "var(--ink-2)",
                border: "1px solid " + (country === c ? "var(--accent)" : "var(--line)"),
              }}
            >
              {c === "All" ? "All countries" : (COUNTRY_FLAGS[c] ?? "") + " " + c}
            </button>
          ))}
        </div>

        {showGrouped ? (
          grouped.length === 0 ? (
            <EmptyState />
          ) : (
            grouped.map((g) => (
              <div key={g.id} style={{ marginTop: 32 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-display)",
                      fontSize: 28,
                      fontWeight: 400,
                      color: "var(--ink)",
                    }}
                  >
                    {g.label}{" "}
                    <span
                      className="display-italic"
                      style={{ color: "var(--ink-3)" }}
                    >
                      ·
                    </span>{" "}
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--ink-3)",
                      }}
                    >
                      {g.desc}
                    </span>
                  </h2>
                  <Icon.chevron width={16} height={16} stroke="var(--ink-3)" />
                </div>
                <div className="rail">
                  {g.items.map((p) => (
                    <ProgramCard key={p.id} program={p} variant="rail" />
                  ))}
                </div>
              </div>
            ))
          )
        ) : shown.length === 0 ? (
          <EmptyState filter={filter} country={country} />
        ) : (
          <div
            style={{ display: "grid", gap: 16, marginTop: 16 }}
            className="programs-grid"
          >
            {shown.map((p) => (
              <ProgramCard key={p.id} program={p} variant="wide" />
            ))}
          </div>
        )}

        <style>{"@media (min-width: 700px) { .programs-grid { grid-template-columns: repeat(2, 1fr); } } @media (min-width: 1100px) { .programs-grid { grid-template-columns: repeat(3, 1fr); } }"}</style>
      </section>
    </div>
  )
}

function EmptyState({ filter, country }: { filter?: Filter; country?: string }) {
  const parts: string[] = []
  if (filter && filter !== "All") parts.push(filter)
  if (country && country !== "All") parts.push(country)
  const label = parts.length ? parts.join(" · ") : ""
  return (
    <div className="card" style={{ padding: 32, marginTop: 24, textAlign: "center" }}>
      <div className="body">
        {label
          ? "No " + label + " programs published yet."
          : "No programs published yet. Check back soon."}
      </div>
    </div>
  )
}
