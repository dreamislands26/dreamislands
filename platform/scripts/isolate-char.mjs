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

const { data } = await supabase.from("reviews").select("id, text_en").eq("id", "9fb80eca-22eb-40ec-8e0f-d56454bba9df").single()
const CYRILLIC = /[??-??]/
for (let i = 0; i < data.text_en.length; i++) {
  const ch = data.text_en[i]
  if (CYRILLIC.test(ch)) {
    console.log(`index ${i}: char=${JSON.stringify(ch)} codepoint=U+${ch.codePointAt(0).toString(16)} context="${data.text_en.slice(Math.max(0,i-15), i+15)}"`)
  }
}
console.log("scan done")

