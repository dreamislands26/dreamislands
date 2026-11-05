import "server-only"

// Anonymous (RLS-enforced) read client for PUBLIC catalog data: published programs, active properties,
// active destination_countries, active media. No cookies, no service role.
// Stage 1 code (stats, hero, sitemap, country pages) uses this and does NOT extend supabaseAdmin usage.
// Existing supabaseAdmin usage on public pages is a separate security-cleanup task.
//
// Its GET requests are cached (lib/supabase-catalog.ts: 5 min data cache, tag "catalog", reset on admin
// writes and by POST /api/revalidate). Do not use it for per-guest data.
export { supabasePublicCatalog as supabasePublic } from "./supabase-catalog"
