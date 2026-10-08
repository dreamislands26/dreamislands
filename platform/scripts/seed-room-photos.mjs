// One-off: upload curated Tanya Samui room/villa photos and attach to accommodation_rates.
// Run from /opt/dit-platform-preview: node scripts/seed-room-photos.mjs
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
if (!url || !serviceKey) throw new Error("missing supabase env vars")

const supabase = createClient(url, serviceKey, { realtime: { transport: ws } })

const ROOMS = [
  { room_type: "Single Room (New Wing)", file: "single-room.jpg" },
  { room_type: "Shared Room (New Wing)", file: "shared-room.jpg" },
  { room_type: "Superior Room (2 baths)", file: "superior-room.jpg" },
  { room_type: "Deluxe Room (2 bedrooms)", file: "deluxe-room.png" },
  { room_type: "Classic Villa with pool", file: "classic-villa.jpg" },
  { room_type: "Japanese Villa (JapaneseVilla)", file: "japanese-villa.jpg" },
  { room_type: "Singapore Villa (group)", file: "singapore-villa.jpg" },
]

const { data: props, error: propErr } = await supabase
  .from("properties")
  .select("id, name")
  .ilike("name", "%Samui%")
  .ilike("name", "%retreat%")
if (propErr) throw propErr
if (!props || props.length === 0) throw new Error("Tanya Samui retreat property not found")
const propertyId = props[0].id
console.log("property:", props[0].name, propertyId)

for (const r of ROOMS) {
  const localPath = path.resolve(process.cwd(), "scripts/room-photos", r.file)
  const bytes = fs.readFileSync(localPath)
  const ext = path.extname(r.file).slice(1)
  const contentType = ext === "png" ? "image/png" : "image/jpeg"
  const storagePath = `tanya-samui/${r.file}`

  const { error: upErr } = await supabase.storage
    .from("properties")
    .upload(storagePath, bytes, { contentType, cacheControl: "31536000", upsert: true })
  if (upErr) {
    console.error("upload failed for", r.room_type, upErr.message)
    continue
  }
  const { data: pub } = supabase.storage.from("properties").getPublicUrl(storagePath)

  const { data: updated, error: updErr } = await supabase
    .from("accommodation_rates")
    .update({ image_url: pub.publicUrl })
    .eq("property_id", propertyId)
    .eq("room_type", r.room_type)
    .select("id, room_type")
  if (updErr) {
    console.error("update failed for", r.room_type, updErr.message)
    continue
  }
  if (!updated || updated.length === 0) {
    console.warn("no matching row for room_type:", r.room_type)
    continue
  }
  console.log("OK:", r.room_type, "->", pub.publicUrl)
}

