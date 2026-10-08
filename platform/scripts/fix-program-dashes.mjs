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
const FIXES = [
  {
    id: "783b5a4b-9984-42d8-b7da-6617e2c57b80",
    field: "summary",
    value: "A short, restful stay centered on Mile's silica hot springs, one spa treatment and a light TCM session " + MDASH + " rest and relaxation without a heavy medical protocol.",
  },
  {
    id: "fad13f94-8eda-4dc7-ad04-e8882e3f73fa",
    field: "guest_feels",
    value: "Lighter, clearer-skinned, and reset " + MDASH + " a strong first impression of the Mile ecosystem.",
  },
  {
    id: "b3586500-5a10-4fbf-821d-3af3d86bfb87",
    field: "target_guest",
    value: "Guests wanting a genuine multi-pillar wellness stay " + MDASH + " medical, spa, and mindfulness combined.",
  },
  {
    id: "b3586500-5a10-4fbf-821d-3af3d86bfb87",
    field: "guest_feels",
    value: "Restored on multiple fronts " + MDASH + " physically relaxed, medically checked-in, and mentally calmer.",
  },
  {
    id: "4e08e5c8-2fcd-4422-baeb-5ec9054c671a",
    field: "guest_feels",
    value: "Calmer, more present, and oriented in Daoist practice " + MDASH + " a taste of the deeper programs available.",
  },
]

for (const f of FIXES) {
  const { error } = await supabase.from("programs").update({ [f.field]: f.value }).eq("id", f.id)
  if (error) console.error("failed:", f.id, f.field, error.message)
  else console.log("fixed:", f.id, f.field)
}

