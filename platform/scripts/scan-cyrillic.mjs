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

const CYRILLIC = /[??-??]/

async function scanTable(table, cols) {
  const { data, error } = await supabase.from(table).select(cols)
  if (error) { console.error(table, error.message); return }
  for (const row of data) {
    for (const [k, v] of Object.entries(row)) {
      if (typeof v === "string" && CYRILLIC.test(v)) {
        console.log(`${table}.${k} [id=${row.id}]: ${JSON.stringify(v)}`)
      }
      if (Array.isArray(v)) {
        for (const item of v) {
          if (typeof item === "string" && CYRILLIC.test(item)) {
            console.log(`${table}.${k}[] [id=${row.id}]: ${JSON.stringify(item)}`)
          }
        }
      }
    }
  }
}

await scanTable("reviews", "*")
await scanTable("programs", "id, name, summary, goal, target_guest, how_we_achieve, guest_feels, included_services, contraindications, outcomes")
await scanTable("properties", "id, name, description")
await scanTable("services", "id, name, description")
await scanTable("accommodation_rates", "id, room_type, description")
console.log("scan complete")

