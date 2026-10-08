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

const UPDATES = [
  {
    slug: "wudang-mountain-wellness-center",
    description:
      "A premium wellness center in the Wudang Mountains, one of China's most important centers of Daoist culture and a UNESCO World Heritage Site. The focus is inner practice: Taiji, Qigong, traditional Chinese medicine, meditation and psycho-emotional restoration, set against ancient temples and mountain air.",
  },
  {
    slug: "mile-wellness-resort",
    description:
      "A premium wellness and medical resort in Mile, Yunnan, built around medical-grade silica hot springs. The concept unites functional medicine, TCM, modern diagnostics, thermal therapy and restorative rest ??? a destination for prevention, health restoration and long-term wellbeing management, not just a hotel stay.",
  },
]

for (const u of UPDATES) {
  const { data, error } = await supabase
    .from("properties")
    .update({ description: u.description })
    .eq("slug", u.slug)
    .select("name")
  if (error) console.error("failed:", u.slug, error.message)
  else console.log("updated:", data[0]?.name)
}

