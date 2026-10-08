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

const { data: prog } = await supabase.from("programs").select("id, name, slug, price_usd, cohort, target_guest, summary, goal, how_we_achieve, guest_feels, included_services").eq("slug", "performance-camp").single()
console.log("program:", JSON.stringify(prog, null, 2))
const { data: vars } = await supabase.from("program_variants").select("*").eq("program_id", prog.id).order("sort_order")
console.log("variants:", JSON.stringify(vars, null, 2))
