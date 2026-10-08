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

const { data: pub } = supabase.storage.from("properties").getPublicUrl("mile/mile-property-hero.jpg")
const { data, error } = await supabase
  .from("properties")
  .update({ image_url: pub.publicUrl })
  .eq("slug", "mile-wellness-resort")
  .select("name, image_url")
if (error) { console.error("FAILED:", error.message); process.exit(1) }
console.log("OK:", data)

