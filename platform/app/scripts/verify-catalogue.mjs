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

const { count: activeServices } = await supabase.from("services").select("*", { count: "exact", head: true }).eq("active", true)
console.log("total active services (should include pre-existing Tanya Samui ones too):", activeServices)

const { count: accCount } = await supabase.from("accommodation_rates").select("*", { count: "exact", head: true })
console.log("total accommodation_rates rows:", accCount)

const { count: publishedPrograms } = await supabase.from("programs").select("*", { count: "exact", head: true }).eq("status", "published")
console.log("published programs (should be unchanged = 6):", publishedPrograms)

const { data: sample } = await supabase
  .from("program_services")
  .select("is_included, services(name, category, price_usd), programs(name, slug)")
  .limit(3)
console.log("sample links:", JSON.stringify(sample, null, 2))

