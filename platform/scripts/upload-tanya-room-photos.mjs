import fs from "node:fs"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"
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

const dir = "/opt/dit-platform/scripts/tanya-room-photos"

const MAP = [
  { file: "single-room.jpg", room_type: "Single Room (New Wing)" },
  { file: "shared-room.jpg", room_type: "Shared Room (New Wing)" },
  { file: "superior-room.jpg", room_type: "Superior Room (2 baths)" },
  { file: "deluxe-room.png", room_type: "Deluxe Room (2 bedrooms)" },
  { file: "classic-villa.jpg", room_type: "Classic Villa with pool" },
  { file: "japanese-villa.jpg", room_type: "Japanese Villa (JapaneseVilla)" },
  { file: "singapore-villa.jpg", room_type: "Singapore Villa (group)" },
]

const { data: prop } = await supabase.from("properties").select("id").eq("slug", "tanya-core").single()

for (const m of MAP) {
  const full = path.join(dir, m.file)
  const resized = await sharp(fs.readFileSync(full))
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer()

  const storagePath = `tanya-samui-rooms/${path.parse(m.file).name}.jpg`
  const { error: upErr } = await supabase.storage
    .from("properties")
    .upload(storagePath, resized, { contentType: "image/jpeg", cacheControl: "31536000", upsert: true })
  if (upErr) {
    console.error("upload failed:", m.room_type, upErr.message)
    continue
  }
  const { data: pub } = supabase.storage.from("properties").getPublicUrl(storagePath)

  const { data: updated, error: updErr } = await supabase
    .from("accommodation_rates")
    .update({ image_url: pub.publicUrl })
    .eq("property_id", prop.id)
    .eq("room_type", m.room_type)
    .select("room_type")
  if (updErr) {
    console.error("update failed:", m.room_type, updErr.message)
    continue
  }
  if (!updated || updated.length === 0) {
    console.warn("no matching row:", m.room_type)
    continue
  }
  console.log("OK:", m.room_type)
}
console.log("done")
