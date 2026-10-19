// Shared by the catalog page (server) and the mobile search (client).
export type LiteProgram = { cohort: number; country: string | null; minDays: number; minPrice: number; outcomes: string[] }
export type SearchState = { q?: string; track?: string; goal?: string; length?: string; country?: string; pmin?: number; pmax?: number }

export function searchHref(st: SearchState) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(st)) if (v !== undefined && v !== "" && v !== null) q.set(k, String(v))
  const s = q.toString()
  return `/programs${s ? `?${s}` : ""}`
}
