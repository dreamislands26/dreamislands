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

const SUSPECT = /\?{2,}|\s\?\s/

async function scanTable(table, cols, filter) {
  let q = supabase.from(table).select(cols)
  if (filter) q = filter(q)
  const { data, error } = await q
  if (error) { console.error(table, error.message); return }
  for (const row of data) {
    for (const [k, v] of Object.entries(row)) {
      if (typeof v === "string" && SUSPECT.test(v)) {
        console.log(`${table}.${k} [id=${row.id ?? row.slug}]: ${JSON.stringify(v)}`)
      }
    }
  }
}

await scanTable("properties", "id, slug, name, description", (q) =>
  q.or("slug.like.wudang-%,slug.like.mile-%,slug.eq.mile-wellness-resort"))
await scanTable("programs", "id, slug, summary, goal, target_guest, how_we_achieve, guest_feels, included_services", (q) =>
  q.or("slug.like.wudang-%,slug.like.mile-%"))
await scanTable("services", "id, slug, name, description", (q) =>
  q.or("slug.like.wud-%,slug.like.mil-%,slug.like.bm-%,slug.like.xian-%"))
await scanTable("accommodation_rates", "id, room_type, description", null)
console.log("scan complete")

