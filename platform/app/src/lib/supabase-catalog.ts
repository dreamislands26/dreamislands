import "server-only"
import { createClient } from "@supabase/supabase-js"

// Cached READ clients for the public catalog (programs, properties, media, reviews, countries, FAQ...).
//
// Why: the site runs in Bangkok and Supabase in eu-west-1, so every query is a ~0.2-0.35 s round trip and
// pages made 4-10 of them in a row on every visit. Catalog data is the same for every guest and changes
// rarely, so its GET requests go through the Next.js data cache:
//   - kept for CATALOG_REVALIDATE_SECONDS, then refreshed in the background (the visitor gets the cached copy);
//   - only HTTP 200 answers are stored, so a database error is never cached;
//   - every admin write route calls revalidateCatalog() (lib/catalog-revalidate.ts), and scripts that edit
//     the database directly call POST /api/revalidate (see that route for the secret header).
//
// NEVER use these clients for per-guest data (profile, matches, bookings, auth) or in admin/panel code,
// and never for writes: writes go through supabaseAdmin / supabaseServer as before.

export const CATALOG_TAG = "catalog"
export const CATALOG_REVALIDATE_SECONDS = 300

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder"
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder"

const catalogFetch: typeof fetch = (input, init) => {
  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase()
  if (method !== "GET") return fetch(input, init)
  return fetch(input, { ...init, next: { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_TAG] } })
}

const options = { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: catalogFetch } }

/** Service-role catalog reads (bypasses RLS) — the cached twin of supabaseAdmin for public pages. */
export const supabaseCatalog = createClient(url, serviceKey, options)

/** Anonymous (RLS-enforced) catalog reads — the cached twin of the old uncached anon client. */
export const supabasePublicCatalog = createClient(url, anonKey, options)
