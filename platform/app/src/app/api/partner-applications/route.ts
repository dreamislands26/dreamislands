import { NextResponse } from "next/server"
import {
  applicationsEnabled,
  createApplication,
  OFFERINGS,
  PROPERTY_TYPES,
  SOURCES,
  type ApplicationInput,
} from "@/lib/partner-applications"

// Public partner application (local test, see src/lib/partner-applications.ts).

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 5
const hits = new Map<string, number[]>()

function isRateLimited(ip: string) {
  const now = Date.now()
  const t = (hits.get(ip) ?? []).filter((x) => now - x < RATE_LIMIT_WINDOW_MS)
  t.push(now)
  hits.set(ip, t)
  return t.length > RATE_LIMIT_MAX
}

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "")
const num = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null
}
const list = (v: unknown) => (Array.isArray(v) ? v.slice(0, 20) : [])

export async function POST(req: Request) {
  if (!applicationsEnabled()) return bad("not found", 404)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local"
  if (isRateLimited(ip)) return bad("too many requests, please try again later", 429)

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return bad("invalid JSON body")
  }
  // Honeypot: people never see this field
  if (str(body.company_confirm)) return NextResponse.json({ success: true })

  const p = (body.property ?? {}) as Record<string, unknown>
  const c = (body.contact ?? {}) as Record<string, unknown>
  const input: ApplicationInput = {
    property: {
      name: str(p.name),
      type: PROPERTY_TYPES.includes(str(p.type)) ? str(p.type) : "",
      country: str(p.country, 80),
      city: str(p.city, 80),
      website: str(p.website),
    },
    offerings: list(body.offerings).map((x) => str(x)).filter((k) => OFFERINGS.some((o) => o.key === k)),
    programs: list(body.programs)
      .map((x) => x as Record<string, unknown>)
      .map((x) => ({ name: str(x.name), nights: num(x.nights), priceFrom: num(x.priceFrom) }))
      .filter((x) => x.name),
    practitioners: list(body.practitioners)
      .map((x) => x as Record<string, unknown>)
      .map((x) => ({ name: str(x.name), specialty: str(x.specialty) }))
      .filter((x) => x.name),
    contact: { name: str(c.name), role: str(c.role), email: str(c.email), phone: str(c.phone, 40) },
    source: SOURCES.some((s) => s.key === str(body.source)) ? str(body.source) : "",
  }

  if (!input.property.name) return bad("Property name is required")
  if (!input.property.country) return bad("Country is required")
  if (!input.contact.name) return bad("Your name is required")
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contact.email)) return bad("A valid email is required")
  if (body.consent !== true) return bad("Please agree to be contacted")

  const row = await createApplication(input)
  return NextResponse.json({ success: true, id: row.id, profile: row.profile })
}
