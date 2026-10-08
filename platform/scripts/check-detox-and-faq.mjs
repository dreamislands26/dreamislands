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

const { data: prog } = await supabase.from("programs").select("*").eq("slug", "detox-reset").single()
console.log("detox-reset:", JSON.stringify(prog, null, 2))

const { data: pp } = await supabase.from("program_properties").select("*").eq("program_id", prog.id)
console.log("program_properties:", JSON.stringify(pp, null, 2))

const { data: faqRows } = await supabase.from("faq").select("*").ilike("question_en", "%standard%")
console.log("faq standard matches:", JSON.stringify(faqRows, null, 2))

const { data: faqIncl } = await supabase.from("faq").select("*").ilike("question_en", "%include%")
console.log("faq include matches:", JSON.stringify(faqIncl, null, 2))

const { data: allTanyaPrograms } = await supabase
  .from("programs")
  .select("id, name, slug, cohort, sort_order")
  .in("slug", ["detox-reset","longevity-protocol","aesthetic-reset","performance-reset","sleep-nervous-system-reset","weight-reset"])
  .order("sort_order")
console.log("tanya programs sort_order/cohort:", JSON.stringify(allTanyaPrograms, null, 2))
