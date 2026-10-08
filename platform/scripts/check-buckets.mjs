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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
console.log("project url:", url)

const supabase = createClient(url, serviceKey, { realtime: { transport: ws } })
const { data, error } = await supabase.storage.listBuckets()
if (error) {
  console.error("listBuckets error:", error.message)
} else {
  console.log("buckets:", data.map((b) => b.id))
}

