import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("server-only", () => ({}))

const PROG_OK = "11111111-1111-4111-8111-111111111111"
const PROG_CONFLICT = "22222222-2222-4222-8222-222222222222"
const PROG_CENTROID = "33333333-3333-4333-8333-333333333333"
const PROG_HIDDEN = "44444444-4444-4444-8444-444444444444"

const ROWS: Record<string, unknown[]> = {
  programs: [{ id: PROG_OK }, { id: PROG_CONFLICT }, { id: PROG_CENTROID }],
  "poi:program": [
    { entity_ref: PROG_OK, inherited_from_ref: "prop-exact", verification_status: "verified" },
    { entity_ref: PROG_CONFLICT, inherited_from_ref: "prop-exact", verification_status: "conflict" },
    { entity_ref: PROG_CENTROID, inherited_from_ref: "prop-centroid", verification_status: "approximate" },
  ],
  "poi:property": [
    { entity_ref: "prop-exact", latitude: "9.123456", longitude: "100.987654", location_precision: "exact", verification_status: "verified" },
    { entity_ref: "prop-centroid", latitude: "24.4", longitude: "103.4", location_precision: "locality_centroid", verification_status: "approximate" },
  ],
}

vi.mock("@/lib/supabase-server", () => ({
  supabaseAdmin: {
    from: (table: string) => {
      let key = table
      const q = {
        select: () => q,
        eq: (col: string, val: string) => {
          if (col === "poi_type") key = `poi:${val}`
          return q
        },
        in: () => q,
        then: (resolve: (v: { data: unknown[] }) => void) => resolve({ data: ROWS[key] ?? [] }),
      }
      return q
    },
  },
}))

process.env.MAP_TOKEN_SECRET = "test-secret"
const { POST } = await import("./route")
const { mapToken, verifyMapToken } = await import("@/lib/map-points")

const BROWSER = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1"

function req(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3200/api/map/points", {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": BROWSER, host: "localhost:3200", "x-real-ip": `10.0.0.${Math.floor(Math.random() * 250)}`, "x-map-token": mapToken(), ...headers },
    body: JSON.stringify(body),
  })
}

describe("map token", () => {
  it("accepts a fresh token and rejects a tampered or expired one", () => {
    const t = mapToken()
    expect(verifyMapToken(t)).toBe(true)
    expect(verifyMapToken(t.slice(0, -1) + (t.endsWith("A") ? "B" : "A"))).toBe(false)
    expect(verifyMapToken(mapToken(Date.now() - 31 * 60 * 1000))).toBe(false)
    expect(verifyMapToken(null)).toBe(false)
  })
})

describe("POST /api/map/points", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns rounded points only for shown precisions, never conflicts or centroids", async () => {
    const r = await POST(req({ ids: [PROG_OK, PROG_CONFLICT, PROG_CENTROID, PROG_HIDDEN] }))
    expect(r.status).toBe(200)
    expect(r.headers.get("x-robots-tag")).toContain("noindex")
    const { p } = await r.json()
    expect(Object.keys(p)).toEqual([PROG_OK])
    const [key, lat, lng] = p[PROG_OK]
    expect(key).toMatch(/^[\w-]{10}$/)
    expect(key).not.toContain("prop")
    expect([lat, lng]).toEqual([9.12, 100.99])
  })

  it("refuses requests without a valid token", async () => {
    expect((await POST(req({ ids: [PROG_OK] }, { "x-map-token": "" }))).status).toBe(403)
    expect((await POST(req({ ids: [PROG_OK] }, { "x-map-token": "123.abc" }))).status).toBe(403)
  })

  it("refuses bots, scripts and cross-site requests", async () => {
    expect((await POST(req({ ids: [PROG_OK] }, { "user-agent": "Googlebot/2.1" }))).status).toBe(403)
    expect((await POST(req({ ids: [PROG_OK] }, { "user-agent": "python-requests/2.31" }))).status).toBe(403)
    expect((await POST(req({ ids: [PROG_OK] }, { "user-agent": "Mozilla/5.0 HeadlessChrome/120.0" }))).status).toBe(403)
    expect((await POST(req({ ids: [PROG_OK] }, { "sec-fetch-site": "cross-site" }))).status).toBe(403)
    expect((await POST(req({ ids: [PROG_OK] }, { origin: "https://evil.example" }))).status).toBe(403)
  })

  it("rejects bad input and limits one IP", async () => {
    expect((await POST(req({ ids: ["not-a-uuid"] }))).status).toBe(400)
    const ip = { "x-real-ip": "10.9.9.9" }
    const codes: number[] = []
    for (let i = 0; i < 21; i++) codes.push((await POST(req({ ids: [PROG_OK] }, ip))).status)
    expect(codes.slice(0, 20).every((c) => c === 200)).toBe(true)
    expect(codes[20]).toBe(429)
  })
})
