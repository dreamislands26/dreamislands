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

const { data: prog } = await supabase.from("programs").select("*").eq("slug", "mile-3d2n-detox-anti-aging").single()
console.log(JSON.stringify(prog, null, 2))
const { data: propRow } = await supabase.from("properties").select("*").ilike("name", "%mile%").limit(1).single()
console.log("MILE property:", JSON.stringify(propRow, null, 2))
