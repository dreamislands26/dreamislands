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

const { data: props } = await supabase
  .from("properties")
  .select("id, name, slug, island, country")
  .in("slug", ["wudang-mountain-wellness-center", "mile-wellness-resort"])
console.log("PROPERTIES:", props)

const { data: progs } = await supabase
  .from("programs")
  .select("name, slug, status, cohort, duration_days, price_usd, program_variants(label, price_basic_usd, price_vip_usd), program_properties(properties(name))")
  .like("slug", "wudang-%")
console.log("WUDANG PROGRAMS:", JSON.stringify(progs, null, 2))

const { data: milePrograms } = await supabase
  .from("programs")
  .select("name, slug, status")
  .like("slug", "mile-%")
console.log("MILE PROGRAMS COUNT:", milePrograms.length)

const { count: publishedCount } = await supabase
  .from("programs")
  .select("*", { count: "exact", head: true })
  .eq("status", "published")
console.log("TOTAL PUBLISHED PROGRAMS (should be unchanged, Tanya Samui only):", publishedCount)

