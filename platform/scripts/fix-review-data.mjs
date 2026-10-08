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

const FIXES = [
  {
    id: "4c75d56e-2c06-477b-9d20-f21ffc29b55d",
    table: "reviews",
    field: "guest_title",
    // was a single mashed RU+EN string with no " / " delimiter
    value: "Corporate psychologist and coach; Personal Branding & Corporate Culture Specialist (AICI CIC)",
  },
  {
    id: "ba9c78af-3a65-45bc-8303-b6e7ecc10012",
    table: "reviews",
    field: "country",
    // city name was untranslated Cyrillic
    value: "RU · St. Petersburg",
  },
]

for (const f of FIXES) {
  const { error } = await supabase.from(f.table).update({ [f.field]: f.value }).eq("id", f.id)
  if (error) console.error("failed:", f.id, f.field, error.message)
  else console.log("fixed:", f.id, f.field)
}
