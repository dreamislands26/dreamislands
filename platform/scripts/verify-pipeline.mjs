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

// Confirm Tanya untouched
const { data: tanya } = await supabase.from("properties").select("id,name,slug,active").eq("slug", "tanya-core").single()
console.log("Tanya property still intact:", JSON.stringify(tanya))
const { count: tanyaProgCount } = await supabase
  .from("programs")
  .select("id", { count: "exact", head: true })
  .in("slug", ["detox-reset", "longevity-protocol", "aesthetic-reset", "performance-reset", "sleep-nervous-system-reset", "weight-reset", "signature-program"])
console.log("Tanya program count still 7:", tanyaProgCount)

const { count: newPropCount } = await supabase.from("properties").select("id", { count: "exact", head: true }).eq("active", false)
console.log("Total inactive (draft) properties:", newPropCount)

const { count: draftProgCount } = await supabase.from("programs").select("id", { count: "exact", head: true }).eq("status", "draft")
console.log("Total draft programs (incl. any pre-existing orphan draft):", draftProgCount)

const { data: sample } = await supabase
  .from("programs")
  .select("*, program_properties(role, properties(name,slug,active))")
  .eq("slug", "como-shambala-executive-burnout-reset-3d")
  .single()
console.log("Sample program:", JSON.stringify(sample, null, 2))
