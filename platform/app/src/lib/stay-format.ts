const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const SHORT = MONTHS.map((m) => m.slice(0, 3))

function parts(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  return { y, m: m - 1, d }
}

/** "23–28 March", "30 Mar – 4 Apr", with the year only when it isn't this year. */
export function formatStay(arrival: string | null, departure: string | null): string | null {
  if (!arrival) return null
  const a = parts(arrival)
  const thisYear = new Date().getFullYear()
  if (!departure) return `${a.d} ${MONTHS[a.m]}${a.y !== thisYear ? ` ${a.y}` : ""}`
  const b = parts(departure)
  const year = b.y !== thisYear ? ` ${b.y}` : ""
  if (a.y === b.y && a.m === b.m) return `${a.d}–${b.d} ${MONTHS[a.m]}${year}`
  if (a.y === b.y) return `${a.d} ${SHORT[a.m]} – ${b.d} ${SHORT[b.m]}${year}`
  return `${a.d} ${SHORT[a.m]} ${a.y} – ${b.d} ${SHORT[b.m]} ${b.y}`
}

export function formatDay(iso: string): string {
  const a = parts(iso)
  return `${a.d} ${SHORT[a.m]} ${a.y}`
}
