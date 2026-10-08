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

const dir = "/opt/dit-platform/scripts/tanya-gallery-src"

const GALLERY = [
  { file: "lotus-lake.jpg", caption: "Lotus Lake at dusk" },
  { file: "meditation-hall.jpg", caption: "Meditation hall" },
  { file: "swimming-pool.jpg", caption: "The pool" },
  { file: "entrance.jpg", caption: "Entrance" },
  { file: "territory.jpg", caption: "Grounds" },
  { file: "spa-zone.jpg", caption: "Morning spa" },
  { file: "tanya-oil.jpg", caption: "The Tanya Oil protocol" },
  { file: "gardens.jpg", caption: "Gardens" },
  { file: "khun-kob-monks.jpg", caption: "Teacher Khun Kob" },
  { file: "reception.jpg", caption: "Reception" },
  { file: "herbal-drink.jpg", caption: "Herbal cleanse" },
  { file: "relax-zone.jpg", caption: "Relax zone" },
]

const urls = []
for (const g of GALLERY) {
  const full = path.join(dir, g.file)
  const resized = await sharp(fs.readFileSync(full))
    .resize({ width: 1400, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer()
  const storagePath = `tanya-samui/gallery/${path.parse(g.file).name}.jpg`
  const { error } = await supabase.storage
    .from("properties")
    .upload(storagePath, resized, { contentType: "image/jpeg", cacheControl: "31536000", upsert: true })
  if (error) {
    console.error("upload failed:", g.file, error.message)
    continue
  }
  const { data: pub } = supabase.storage.from("properties").getPublicUrl(storagePath)
  urls.push({ url: pub.publicUrl, caption: g.caption })
  console.log("OK:", g.file, "->", pub.publicUrl)
}

fs.writeFileSync("/tmp/tanya_gallery_urls.json", JSON.stringify(urls, null, 2))
console.log("\nWrote /tmp/tanya_gallery_urls.json")

// Property heroes
const PROP_HEROES = [
  { slug: "bunya-clinic", file: "bunya-clinic-hero.jpg", storageName: "bunya-clinic-hero.jpg" },
  { slug: "tanya-wellbeing", file: "tanya-wellbeing-hero.jpg", storageName: "tanya-wellbeing-hero.jpg" },
]
for (const p of PROP_HEROES) {
  const full = path.join(dir, p.file)
  const resized = await sharp(fs.readFileSync(full))
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer()
  const storagePath = `tanya-samui/${p.storageName}`
  const { error: upErr } = await supabase.storage
    .from("properties")
    .upload(storagePath, resized, { contentType: "image/jpeg", cacheControl: "31536000", upsert: true })
  if (upErr) {
    console.error("hero upload failed:", p.slug, upErr.message)
    continue
  }
  const { data: pub } = supabase.storage.from("properties").getPublicUrl(storagePath)
  const { error: updErr } = await supabase.from("properties").update({ image_url: pub.publicUrl }).eq("slug", p.slug)
  if (updErr) console.error("property update failed:", p.slug, updErr.message)
  else console.log("Property hero set:", p.slug, "->", pub.publicUrl)
}
