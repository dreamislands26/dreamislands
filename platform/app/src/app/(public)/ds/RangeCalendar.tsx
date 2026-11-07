"use client"
// Month calendar for picking a trip (Oleg 07.11.2026): every trip one can take is a pale band (its start day
// dotted), so the step is plain; tapping a day
// selects the trip that starts on it, or the latest one that covers it, and the whole stay is highlighted as
// a band from arrival to departure. Days no trip covers are muted. Weeks start on Monday; dates are ISO
// (YYYY-MM-DD, UTC).
import { useMemo, useState, type ReactNode } from "react"
import { IconButton } from "./ui"
import s from "./rangeCalendar.module.css"

export type CalRange = { start: string; end: string }

const iso = (d: Date) => d.toISOString().slice(0, 10)
const day = (k: string) => new Date(`${k}T00:00:00Z`)
const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

/** `heading`: the section title, put on the month row (left; the month and its arrows go right). */
export default function RangeCalendar({ ranges, selected, onPick, heading }: { ranges: CalRange[]; selected?: CalRange; onPick: (start: string) => void; heading?: ReactNode }) {
  const months = useMemo(() => {
    const set = new Set<string>()
    for (const r of ranges) { set.add(r.start.slice(0, 7)); set.add(r.end.slice(0, 7)) }
    return [...set].sort()
  }, [ranges])
  const [month, setMonth] = useState(selected?.start.slice(0, 7) ?? months[0] ?? iso(new Date()).slice(0, 7))
  const at = Math.max(0, months.indexOf(month))
  const key = months[at] ?? month
  const [y, m] = key.split("-").map(Number)
  const first = new Date(Date.UTC(y, m - 1, 1))
  const lead = (first.getUTCDay() + 6) % 7 // Monday first
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const starts = new Set(ranges.map((r) => r.start))
  const ends = new Set(ranges.map((r) => r.end))
  // The trip a tap on `k` picks: the one starting that day, else the latest one covering it
  const tripFor = (k: string) => (starts.has(k) ? k : [...ranges].reverse().find((r) => r.start <= k && k <= r.end)?.start)
  const title = first.toLocaleDateString("en-US", { timeZone: "UTC", month: "long", year: "numeric" })

  return (
    <div className={s.cal}>
      <div className={s.head}>
        {heading}
        <div className={s.nav}>
          <IconButton icon="arrow_back" label="Previous month" disabled={at <= 0} onClick={() => setMonth(months[at - 1])} />
          <span className={`ds-title-m ${s.month}`}>{title}</span>
          <IconButton icon="arrow_forward" label="Next month" disabled={at >= months.length - 1} onClick={() => setMonth(months[at + 1])} />
        </div>
      </div>
      <div className={s.grid} role="grid" aria-label={title}>
        {WD.map((w) => <span key={w} className={s.wd}>{w.slice(0, 2)}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={`l${i}`} />)}
        {Array.from({ length: count }, (_, i) => {
          const k = iso(new Date(Date.UTC(y, m - 1, i + 1)))
          const trip = tripFor(k)
          const inSel = !!selected && selected.start <= k && k <= selected.end
          // Every trip one can take shows as a pale band, so the calendar's step is plain (Oleg 07.11.2026)
          const avail = !!trip
          const edge = selected && (k === selected.start ? "start" : k === selected.end ? "end" : null)
          const col = (lead + i) % 7
          // Another trip runs on past the picked stay's arrival or departure: that half of the day stays pale
          const shift = (n: number) => iso(new Date(Date.UTC(y, m - 1, i + 1 + n)))
          const runs = (a: string, b: string) => ranges.some((r) => r.start <= a && b <= r.end && !(selected && selected.start <= a && b <= selected.end))
          const paleBefore = edge === "start" && runs(shift(-1), k)
          const paleAfter = edge === "end" && runs(k, shift(1))
          return (
            <button
              key={k}
              type="button"
              className={s.day}
              data-in={inSel ? "" : undefined}
              data-avail={avail ? "" : undefined}
              data-range-start={starts.has(k) ? "" : undefined}
              data-range-end={ends.has(k) ? "" : undefined}
              data-edge={edge ?? undefined}
              data-pale-before={paleBefore ? "" : undefined}
              data-pale-after={paleAfter ? "" : undefined}
              data-row-start={col === 0 || i === 0 ? "" : undefined}
              data-row-end={col === 6 || i === count - 1 ? "" : undefined}
              data-start={starts.has(k) ? "" : undefined}
              disabled={!trip}
              aria-pressed={inSel}
              aria-label={day(k).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" })}
              onClick={() => trip && onPick(trip)}
            >
              <span>{i + 1}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
