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

const dir = "/opt/dit-platform/scripts/mile-photos"

const MAP = [
  { file: "mile-property-hero.jpg", target: "property", key: "mile-wellness-resort" },
  { file: "mile-detox-antiaging.jpg", target: "program", key: "mile-3d2n-detox-anti-aging" },
  { file: "mile-wellness-escape.jpg", target: "program", key: "mile-5d4n-wellness-escape" },
  { file: "mile-deep-recovery.jpg", target: "program", key: "mile-7d6n-deep-recovery" },
  { file: "mile-executive-health.jpg", target: "program", key: "mile-executive-health-recovery" },
  { file: "mile-medical-journey.jpg", target: "program", key: "mile-medical-wellness-journey" },
  { file: "mile-luxury-preventive.jpg", target: "program", key: "mile-luxury-preventive-health-program" },
  { file: "mile-wellness-short.jpg", target: "program", key: "mile-wellness-escape-short" },
]

for (const m of MAP) {
  const bytes = fs.readFileSync(path.join(dir, m.file))
  const storagePath = `mile/${m.file}`
  const { error: upErr } = await supabase.storage
    .from("properties")
    .upload(storagePath, bytes, { contentType: "image/jpeg", cacheControl: "31536000", upsert: true })
  if (upErr) {
    console.error("upload failed:", m.file, upErr.message)
    continue
  }
  const { data: pub } = supabase.storage.from("properties").getPublicUrl(storagePath)

  if (m.target === "property") {
    const { error } = await supabase.from("properties").update({ image_url: pub.publicUrl }).eq("slug", m.key)
    if (error) console.error("property update failed:", m.key, error.message)
    else console.log("property OK:", m.key)
  } else {
    const { error } = await supabase.from("programs").update({ hero_image_url: pub.publicUrl }).eq("slug", m.key)
    if (error) console.error("program update failed:", m.key, error.message)
    else console.log("program OK:", m.key)
  }
}
console.log("done")

