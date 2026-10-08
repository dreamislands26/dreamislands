import fs from "node:fs"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"
import ws from "ws"

const envPath = path.resolve(process.cwd(), ".env.local")
const envText = fs.readFileSync(envPath, "utf8")
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
}
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { realtime: { transport: ws } },
)

const CYRILLIC_RE = /[Ѐ-ӿ]/
function enOnly(s) {
  if (!s) return null
  const parts = s.split(" / ").map((p) => p.trim()).filter(Boolean)
  if (parts.length > 1) {
    const clean = parts.find((p) => !CYRILLIC_RE.test(p))
    if (clean) return clean
  }
  return s.trim()
}

const { data, error } = await supabase
  .from("reviews")
  .select("id, guest_name, guest_title, country")
  .eq("status", "published")
  .in("visibility", ["both", "en"])
if (error) { console.error(error); process.exit(1) }

for (const r of data) {
  const name = enOnly(r.guest_name) ?? r.guest_name
  const title = enOnly(r.guest_title)
  const country = enOnly(r.country)
  const bad = [name, title, country].some((v) => v && CYRILLIC_RE.test(v))
  if (bad) {
    console.log(`id=${r.id}`)
    console.log(`  raw name="${r.guest_name}" -> "${name}"`)
    console.log(`  raw title="${r.guest_title}" -> "${title}"`)
    console.log(`  raw country="${r.country}" -> "${country}"`)
  }
}
console.log("done, total rows checked:", data.length)
