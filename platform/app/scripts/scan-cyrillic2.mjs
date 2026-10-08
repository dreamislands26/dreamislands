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

function walk(prefix, value, rowId, hits) {
  if (typeof value === "string") {
    if (CYRILLIC.test(value)) hits.push({ path: prefix, rowId, snippet: value.slice(0, 60) })
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => walk(`${prefix}[${i}]`, v, rowId, hits))
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) walk(`${prefix}.${k}`, v, rowId, hits)
  }
}

async function scanTable(table) {
  const { data, error } = await supabase.from(table).select("*")
  if (error) { console.error(table, error.message); return }
  const hits = []
  for (const row of data) {
    for (const [k, v] of Object.entries(row)) {
      walk(k, v, row.id, hits)
    }
  }
  console.log(`--- ${table}: ${hits.length} field(s) with Cyrillic ---`)
  for (const h of hits) console.log(`  ${h.path} [id=${h.rowId}]: ${JSON.stringify(h.snippet)}`)
}

await scanTable("reviews")
await scanTable("programs")
await scanTable("properties")
await scanTable("services")
await scanTable("accommodation_rates")
console.log("scan complete")

