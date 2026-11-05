import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"
import { supabaseAdmin } from "@/lib/supabase-server"

// Catalogue map points from poi_locations, kept away from crawlers and bulk scraping.
//
// poi_locations has RLS on and no policies, so the anon key cannot read it and only the service role
// can. The catalogue page still renders city-level pins (_lib/places) into the HTML. The finer points
// come from /api/map/points after the page loads, which needs a short-lived token the page signs, so
// the API cannot be called without loading the page first. The API returns only what a pin needs:
//   - per programme: an opaque place key and coordinates rounded to ~1 km (2 decimals);
//   - nothing for points marked `conflict` or located only to a town, region or country
//     (the city pin is as good there);
//   - never the address, source URL, verification fields or notes.

const TOKEN_TTL_MS = 30 * 60 * 1000
const SHOWN_PRECISION = new Set(["exact", "campus", "approximate"])
const DECIMALS = 2

function secret(): string {
  const s = process.env.MAP_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!s) throw new Error("map-points: no secret configured")
  return s
}

const sign = (label: string) => createHmac("sha256", secret()).update(label).digest("base64url")

/** Token for one catalogue page view: "<expiry ms>.<signature>". */
export function mapToken(now = Date.now()): string {
  const exp = String(now + TOKEN_TTL_MS)
  return `${exp}.${sign(`map:${exp}`).slice(0, 32)}`
}

export function verifyMapToken(token: string | null, now = Date.now()): boolean {
  if (!token) return false
  const [exp, sig] = token.split(".")
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < now || Number(exp) > now + TOKEN_TTL_MS) return false
  const want = Buffer.from(sign(`map:${exp}`).slice(0, 32))
  const got = Buffer.from(sig)
  return got.length === want.length && timingSafeEqual(got, want)
}

const round = (n: number) => Number(n.toFixed(DECIMALS))

/** Pins for published programmes: programme id -> [opaque place key, lat, lng]. */
export async function loadMapPoints(ids: string[]): Promise<Record<string, [string, number, number]>> {
  if (!ids.length) return {}
  const { data: progs } = await supabaseAdmin.from("programs").select("id").in("id", ids).eq("active", true).eq("status", "published")
  const live = ((progs ?? []) as { id: string }[]).map((p) => p.id)
  if (!live.length) return {}

  // A programme's point is inherited from its property; the property row carries the precision.
  const { data: progPois } = await supabaseAdmin
    .from("poi_locations")
    .select("entity_ref, inherited_from_ref, verification_status")
    .eq("poi_type", "program")
    .in("entity_ref", live)
  const rows = ((progPois ?? []) as { entity_ref: string; inherited_from_ref: string | null; verification_status: string | null }[])
    .filter((r) => r.inherited_from_ref && r.verification_status !== "conflict")
  const refs = [...new Set(rows.map((r) => r.inherited_from_ref as string))]
  if (!refs.length) return {}

  const { data: propPois } = await supabaseAdmin
    .from("poi_locations")
    .select("entity_ref, latitude, longitude, location_precision, verification_status")
    .eq("poi_type", "property")
    .in("entity_ref", refs)
  const places = new Map<string, [string, number, number]>()
  for (const p of (propPois ?? []) as { entity_ref: string; latitude: number | string | null; longitude: number | string | null; location_precision: string | null; verification_status: string | null }[]) {
    if (p.latitude == null || p.longitude == null) continue
    if (p.verification_status === "conflict" || !SHOWN_PRECISION.has(p.location_precision ?? "")) continue
    places.set(p.entity_ref, [sign(`poi:${p.entity_ref}`).slice(0, 10), round(Number(p.latitude)), round(Number(p.longitude))])
  }

  const out: Record<string, [string, number, number]> = {}
  for (const r of rows) {
    const place = places.get(r.inherited_from_ref as string)
    if (place) out[r.entity_ref] = place
  }
  return out
}
