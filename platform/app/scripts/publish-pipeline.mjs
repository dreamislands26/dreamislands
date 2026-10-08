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

const PROP_SLUGS = [
  "why-nam-beach", "club-med-bintan", "movenpick-cebu", "ayo-ayo-wellness",
  "the-shells-resort-spa-phu-quoc", "village-hotel-sentosa", "happi-village-penang",
  "movenpick-resort-spa-boracay", "udara-bali-yoga-detox-spa", "mokka-bali",
  "como-shambala", "langkawi-nature-retreat", "dragon-soul-retreat",
]

const { data: props, error: propErr } = await supabase
  .from("properties")
  .update({ active: true })
  .in("slug", PROP_SLUGS)
  .select("slug, active")

if (propErr) { console.error("property publish failed:", propErr.message); process.exit(1) }
console.log(`Properties published: ${props.length}`)
for (const p of props) console.log("  ", p.slug, "active:", p.active)

const { data: propIds } = await supabase.from("properties").select("id").in("slug", PROP_SLUGS)
const ids = propIds.map((p) => p.id)

const { data: linkedProgIds } = await supabase
  .from("program_properties")
  .select("program_id")
  .in("property_id", ids)

const progIds = [...new Set(linkedProgIds.map((r) => r.program_id))]

const { data: progs, error: progErr } = await supabase
  .from("programs")
  .update({ status: "published", published_at: new Date().toISOString() })
  .in("id", progIds)
  .select("slug, status")

if (progErr) { console.error("program publish failed:", progErr.message); process.exit(1) }
console.log(`\nPrograms published: ${progs.length}`)
for (const p of progs) console.log("  ", p.slug, "status:", p.status)
