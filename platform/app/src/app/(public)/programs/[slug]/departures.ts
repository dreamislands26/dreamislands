// Start-date slots for the reserve card and the "Choose a departure" sheet.
// The data has no fixed departures: arrival is free, so we offer weekly
// Monday starts from a week ahead. Any of them is a valid arrival for
// /api/bookings/public; other dates go through WhatsApp.

export type Slot = { start: string; end: string; title: string; weekdays: string; monthKey: string; dayLabel: string }

const MON = 1
const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-US", { timeZone: "UTC", ...o })
const iso = (d: Date) => d.toISOString().slice(0, 10)

export function slotsFor(days: number, from = new Date(), count = 12): Slot[] {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + 7))
  while (d.getUTCDay() !== MON) d.setUTCDate(d.getUTCDate() + 1)
  const out: Slot[] = []
  for (let i = 0; i < count; i++) {
    const start = new Date(d)
    const end = new Date(d)
    end.setUTCDate(end.getUTCDate() + Math.max(days, 1) - 1)
    const sameMonth = start.getUTCMonth() === end.getUTCMonth()
    const title = `${fmt(start, { month: "short", day: "numeric" })} to ${sameMonth ? fmt(end, { day: "numeric" }) : fmt(end, { month: "short", day: "numeric" })}`
    const weekdays = `${fmt(start, { weekday: "short" })} to ${fmt(end, { weekday: "short" })}`
    out.push({ start: iso(start), end: iso(end), title, weekdays, monthKey: iso(start).slice(0, 7), dayLabel: fmt(start, { weekday: "short", month: "short", day: "numeric" }) })
    d.setUTCDate(d.getUTCDate() + 7)
  }
  return out
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number)
  return fmt(new Date(Date.UTC(y, m - 1, 1)), { month: "long", year: "numeric" })
}

// Arrival is free (Oleg 07.11.2026): any day from a week ahead, up to about half a year out
export const LEAD_DAYS = 7
export const AHEAD_DAYS = 182
const addDays = (d: Date, n: number) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n))
export function arrivalWindow(from = new Date()) {
  const first = addDays(from, LEAD_DAYS)
  return { earliest: iso(first), latest: iso(addDays(first, AHEAD_DAYS)) }
}

/** The stay from `start` for `days` days (both ends counted), in the same shape as a weekly slot */
export function stayFor(start: string, days: number): Slot {
  const s = new Date(`${start}T00:00:00Z`)
  const e = addDays(s, Math.max(days, 1) - 1)
  const sameMonth = s.getUTCMonth() === e.getUTCMonth()
  const title = `${fmt(s, { month: "short", day: "numeric" })} to ${sameMonth ? fmt(e, { day: "numeric" }) : fmt(e, { month: "short", day: "numeric" })}`
  return { start, end: iso(e), title, weekdays: `${fmt(s, { weekday: "short" })} to ${fmt(e, { weekday: "short" })}`, monthKey: start.slice(0, 7), dayLabel: fmt(s, { weekday: "short", month: "short", day: "numeric" }) }
}
