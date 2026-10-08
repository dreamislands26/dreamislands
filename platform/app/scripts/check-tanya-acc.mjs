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

const { data: accs, error } = await supabase
  .from("accommodation_rates")
  .select("room_type, price_thb_per_night, image_url, property_id")
if (error) { console.error("ERR:", error.message); process.exit(1) }
console.log("ACCOMMODATION ROWS:", accs.length)
for (const a of accs) console.log(` - ${a.room_type}: ${a.price_thb_per_night} (image: ${a.image_url ? "yes" : "no"})`)

const { count: reviewCount } = await supabase.from("reviews").select("*", { count: "exact", head: true })
console.log("\nTOTAL REVIEWS:", reviewCount)

const { data: tanyaProgs } = await supabase
  .from("programs")
  .select("name, slug")
  .eq("status", "published")
  .not("slug", "like", "wudang-%")
  .not("slug", "like", "mile-%")
console.log("\nTANYA PROGRAMS:", tanyaProgs.map((p) => p.slug))
