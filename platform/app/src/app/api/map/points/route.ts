import { NextResponse } from "next/server"
import { loadMapPoints, verifyMapToken } from "@/lib/map-points"

// Finer catalogue map pins (see src/lib/map-points.ts). Called by CatalogMap after the page loads.
// Crawlers do not reach it: /api/ is disallowed in robots.txt, the page HTML carries only a token,
// and the request needs that token in a header. Scripts and bulk scrapers are slowed down by the
// user-agent check, the same-origin check and a per-IP limit.

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 20
const MAX_IDS = 120
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|preview|curl|wget|python|httpx|aiohttp|scrapy|java\/|go-http|okhttp|libwww|headless|phantomjs|puppeteer|playwright|node-fetch|undici|axios|postman|insomnia/i

const hits = new Map<string, number[]>()
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const ts = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  ts.push(now)
  hits.set(ip, ts)
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] > RATE_LIMIT_WINDOW_MS) hits.delete(k)
  return ts.length > RATE_LIMIT_MAX
}

const HEADERS = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" }
const deny = (status: number) => NextResponse.json({ ok: false }, { status, headers: HEADERS })

export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") ?? ""
  if (!ua || BOT_UA.test(ua)) return deny(403)

  // Browsers send these on fetch(); a cross-site page or a bare script does not match
  const site = req.headers.get("sec-fetch-site")
  if (site && site !== "same-origin") return deny(403)
  const origin = req.headers.get("origin")
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host")
  if (origin && host && new URL(origin).host !== host) return deny(403)

  if (!verifyMapToken(req.headers.get("x-map-token"))) return deny(403)

  const ip = (req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim()
  if (isRateLimited(ip)) return deny(429)

  let ids: string[]
  try {
    const b = (await req.json()) as { ids?: unknown }
    ids = Array.isArray(b.ids) ? [...new Set(b.ids.filter((x): x is string => typeof x === "string" && UUID.test(x)))] : []
  } catch {
    return deny(400)
  }
  if (!ids.length || ids.length > MAX_IDS) return deny(400)

  const p = await loadMapPoints(ids)
  return NextResponse.json({ p }, { headers: HEADERS })
}
