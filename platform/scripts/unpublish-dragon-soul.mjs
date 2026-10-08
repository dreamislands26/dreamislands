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

const { data: prop, error: propErr } = await supabase
  .from("properties")
  .update({ active: false })
  .eq("slug", "dragon-soul-retreat")
  .select("slug, active")
  .single()
if (propErr) { console.error("property update failed:", propErr.message); process.exit(1) }
console.log("Property:", JSON.stringify(prop))

const { data: progs, error: progErr } = await supabase
  .from("programs")
  .update({ status: "draft", published_at: null })
  .in("slug", ["dragon-soul-retreat-dragon-soul-meditation-3d", "dragon-soul-retreat-dragon-soul-meditation-5d"])
  .select("slug, status")
if (progErr) { console.error("program update failed:", progErr.message); process.exit(1) }
console.log("Programs:", JSON.stringify(progs))
