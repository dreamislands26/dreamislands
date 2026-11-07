"use client"
// Stay calendar (Oleg 07.11.2026): arrival is free. Tap the arrival day, then the departure: only the
// departures the programme's lengths allow (6, 8, 11 days, counting both ends) can be picked, shown as rings
// on a pale band from the arrival. The picked stay is a mint band with dark round ends. Days before the first
// possible arrival or past the last are faded. Weeks start on Monday, the days of the months around are
// faded with their bands; dates are ISO (YYYY-MM-DD, UTC).
import { useMemo, useState, type ReactNode } from "react"
import { IconButton } from "./ui"
import s from "./rangeCalendar.module.css"

const iso = (d: Date) => d.toISOString().slice(0, 10)
const day = (k: string) => new Date(`${k}T00:00:00Z`)
const add = (k: string, n: number) => { const d = day(k); d.setUTCDate(d.getUTCDate() + n); return iso(d) }
const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

/** `lengths`: stay lengths in days (both ends counted), `days`: the picked one; `onPick(arrival, days)` once a
 *  departure is chosen. `heading` goes on the month row, `tag` under it (it is told when a departure is due). */
export default function RangeCalendar({ earliest, latest, arrival, days, lengths, onPick, heading, tag }: {
  earliest: string; latest: string; arrival: string; days: number; lengths: number[]
  onPick: (arrival: string, days: number) => void
  heading?: ReactNode; tag?: (picking: boolean) => ReactNode
}) {
  const lens = useMemo(() => [...new Set(lengths)].filter((n) => n > 0).sort((a, b) => a - b), [lengths])
  // Picking a departure: the arrival tapped, waiting for its departure
  const [from, setFrom] = useState<string | null>(null)
  const months = useMemo(() => {
    const out: string[] = []
    for (let k = earliest.slice(0, 7) + "-01"; k.slice(0, 7) <= latest.slice(0, 7); ) { out.push(k.slice(0, 7)); const d = day(k); d.setUTCMonth(d.getUTCMonth() + 1); k = iso(d) }
    return out
  }, [earliest, latest])
  const [month, setMonth] = useState(arrival.slice(0, 7))
  const at = Math.max(0, months.indexOf(month))
  const key = months[at] ?? month
  const [y, m] = key.split("-").map(Number)
  const first = new Date(Date.UTC(y, m - 1, 1))
  const lead = (first.getUTCDay() + 6) % 7
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const title = first.toLocaleDateString("en-US", { timeZone: "UTC", month: "long", year: "numeric" })

  const picking = from !== null
  const start = picking ? from : arrival
  const end = picking ? null : add(arrival, Math.max(1, days) - 1)
  const ends = new Set(picking ? lens.map((n) => add(from, n - 1)) : [])
  const reach = picking && lens.length ? add(from, lens[lens.length - 1] - 1) : null

  const tap = (k: string) => {
    if (picking && ends.has(k)) {
      const n = Math.round((day(k).getTime() - day(from).getTime()) / 864e5) + 1
      setFrom(null)
      onPick(from, n)
    } else if (lens.length === 1) onPick(k, lens[0])
    else setFrom(k)
  }

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
      {tag && <div className={s.tagRow}>{tag(picking)}</div>}
      <div className={s.grid} role="grid" aria-label={title}>
        {WD.map((w) => <span key={w} className={s.wd}>{w.slice(0, 2)}</span>)}
        {Array.from({ length: Math.ceil((lead + count) / 7) * 7 }, (_, j) => {
          const i = j - lead
          const out = i < 0 || i >= count
          const date = new Date(Date.UTC(y, m - 1, i + 1))
          const k = iso(date)
          const col = j % 7
          const free = k >= earliest && k <= latest
          // The picked stay (mint) or, while a departure is due, the reach of the allowed departures (pale)
          const inSel = !picking && !!end && start <= k && k <= end
          const inReach = picking && !!reach && start <= k && k <= reach
          const edge = k === start ? "start" : !picking && k === end ? "end" : null
          return (
            <button
              key={k}
              type="button"
              className={s.day}
              data-in={inSel ? "" : undefined}
              data-avail={inSel || inReach ? "" : undefined}
              data-edge={edge ?? undefined}
              data-cap-right={inReach && k === reach ? "" : undefined}
              data-range-end={ends.has(k) ? "" : undefined}
              data-free={free ? "" : undefined}
              data-row-start={col === 0 ? "" : undefined}
              data-row-end={col === 6 ? "" : undefined}
              data-out={out ? "" : undefined}
              disabled={!free || out}
              tabIndex={out ? -1 : undefined}
              aria-hidden={out || undefined}
              aria-pressed={inSel || k === start}
              aria-label={day(k).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" }) + (ends.has(k) ? ", possible departure" : "")}
              onClick={() => tap(k)}
            >
              <span>{date.getUTCDate()}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
