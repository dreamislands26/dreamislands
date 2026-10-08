import "server-only"
import { createClient } from "@supabase/supabase-js"

// Anonymous (RLS-enforced) read client for PUBLIC catalog data: published programs, active properties,
// active destination_countries, active media. No cookies, no service role.
// Stage 1 code (stats, hero, sitemap, country pages) uses this and does NOT extend supabaseAdmin usage.
// Existing supabaseAdmin usage on public pages is a separate security-cleanup task.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder"

export const supabasePublic = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
