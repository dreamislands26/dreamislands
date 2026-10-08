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

const { data, error } = await supabase
  .from("programs")
  .update({ status: "published", published_at: new Date().toISOString() })
  .or("slug.like.wudang-%,slug.like.mile-%")
  .select("name, slug, status")

if (error) {
  console.error("FAILED:", error.message)
  process.exit(1)
}
console.log(`published ${data.length} programs:`)
for (const p of data) console.log(" -", p.name, `(${p.slug})`)

