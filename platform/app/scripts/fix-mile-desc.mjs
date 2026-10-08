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

const MDASH = String.fromCharCode(0x2014)
const description =
  "A premium wellness and medical resort in Mile, Yunnan, built around medical-grade silica hot springs. " +
  "The concept unites functional medicine, TCM, modern diagnostics, thermal therapy and restorative rest " +
  MDASH +
  " a destination for prevention, health restoration and long-term wellbeing management, not just a hotel stay."

const { data, error } = await supabase
  .from("properties")
  .update({ description })
  .eq("slug", "mile-wellness-resort")
  .select("name, description")
if (error) { console.error("FAILED:", error.message); process.exit(1) }
console.log("fixed:", data[0])

