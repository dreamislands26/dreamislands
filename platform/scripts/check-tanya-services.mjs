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

// Services NOT tagged as Wudang/Mile/BM/Xian (i.e. the original Tanya Samui catalog)
const { data: services } = await supabase
  .from("services")
  .select("id, name, category, price_usd")
  .not("slug", "like", "wud-%")
  .not("slug", "like", "mil-%")
  .not("slug", "like", "bm-%")
  .not("slug", "like", "xian-%")
  .order("category")
console.log("TANYA SERVICES COUNT:", services.length)
const byCat = {}
for (const s of services) { (byCat[s.category] ??= []).push(s.name) }
for (const [cat, names] of Object.entries(byCat)) {
  console.log(`  ${cat} (${names.length}):`, names.join(", "))
}

const { data: accs } = await supabase
  .from("accommodation_rates")
  .select("room_type, price_thb_per_night, image_url")
  .order("sort_order")
console.log("\nACCOMMODATION ROWS:", accs.length)
for (const a of accs) console.log(` - ${a.room_type}: ${a.price_thb_per_night} (image: ${a.image_url ? "yes" : "no"})`)

const { count: reviewCount } = await supabase.from("reviews").select("*", { count: "exact", head: true })
console.log("\nTOTAL REVIEWS:", reviewCount)
