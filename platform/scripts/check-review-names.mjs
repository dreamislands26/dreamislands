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

// Only the 3 fields already rendered publicly on dreamislands.org's reviews section.
const { data, error } = await supabase
  .from("reviews")
  .select("id, guest_name, guest_title, country, featured")
  .eq("featured", true)
if (error) { console.error(error); process.exit(1) }
for (const r of data) {
  console.log(JSON.stringify(r))
}

