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

const HERO = "https://xbzrtofanbrahasxbisf.supabase.co/storage/v1/object/public/properties/tanya-samui/tanya-property-hero.webp"

const { data: existing } = await supabase.from("programs").select("id").eq("slug", "signature-program").maybeSingle()
if (existing) {
  console.log("Already exists, id:", existing.id, "- aborting, delete manually first if you want to reseed.")
  process.exit(0)
}

const { data: prog, error: progErr } = await supabase
  .from("programs")
  .insert({
    name: "Signature Program",
    slug: "signature-program",
    cohort: 1,
    tier: "RESET",
    duration_days: 6,
    price_usd: 990,
    price_thb: 34500,
    max_guests: 500,
    outcomes: ["reset", "recovery", "personalized"],
    is_composite: false,
    active: true,
    status: "draft",
    summary:
      "The core Tanya Samui protocol, bookable as-is: Tanya Oil protocol, herbal cleanse solutions, personal reviews with Teacher Khun Kob, daily yoga and practices, and a 30-day home protocol. The base every specialised programme and the VIP tier builds on.",
    goal:
      "Give you the complete Tanya Samui reset — clinically structured but flexible — without committing to one specialised outcome. A clean, measured baseline you can build on later with a cohort programme or the VIP tier.",
    target_guest:
      "First-time guests, or anyone who wants the full retreat protocol without narrowing to a single specialised track. Individually tailored after a free Wellness Check-up.",
    how_we_achieve:
      "Full board (3 wellness meals daily), twin-share accommodation, the signature Tanya Oil protocol and herbal cleanse solutions, daily yoga/meditation/breathwork, and personal reviews with Teacher Khun Kob throughout your stay.",
    guest_feels:
      "Full retreat access from day one, with your protocol adjusted to how your body responds after the Wellness Check-up. Guests leave with a 30-day home protocol to carry the reset past checkout.",
    included_services:
      "Full board — 3 wellness meals daily\nTwin-share accommodation\nSignature Tanya Oil protocol + herbal cleanse solutions\nDaily yoga, meditation and breathwork\nPersonal reviews with Teacher Khun Kob\n30-day home protocol\nFull Dream Islands coordination",
    contraindications:
      "Suitable for most guests. For pregnancy, active oncology treatment, severe cardiovascular conditions, or ongoing medication, please disclose at booking so we can adapt the protocol or refer you to Bunya Clinic.",
    hero_image_url: HERO,
    sort_order: 1,
    translations: {
      ru: {
        name: "Основная программа",
        tagline: "Всё необходимое для полноценного восстановления в Tanya Samui",
        for_whom: "Первый визит в Tanya Samui · Гибкая длительность 6/8/11 дней",
      },
    },
  })
  .select()
  .single()

if (progErr) {
  console.error("program insert failed:", progErr.message)
  process.exit(1)
}
console.log("Created program:", prog.id, prog.slug)

const variants = [
  { label: "6D/5N", duration_days: 6, duration_nights: 5, price_basic_thb: 34500, price_vip_thb: 72000, price_basic_usd: 990, price_vip_usd: 2060, sort_order: 10, ru: "6 дней / 5 ночей" },
  { label: "8D/7N", duration_days: 8, duration_nights: 7, price_basic_thb: 48250, price_vip_thb: 105000, price_basic_usd: 1380, price_vip_usd: 3000, sort_order: 20, ru: "8 дней / 7 ночей" },
  { label: "11D/10N", duration_days: 11, duration_nights: 10, price_basic_thb: 62000, price_vip_thb: 148000, price_basic_usd: 1770, price_vip_usd: 4230, sort_order: 30, ru: "11 дней / 10 ночей" },
]

for (const v of variants) {
  const { error } = await supabase.from("program_variants").insert({
    program_id: prog.id,
    label: v.label,
    duration_days: v.duration_days,
    duration_nights: v.duration_nights,
    price_basic_usd: v.price_basic_usd,
    price_vip_usd: v.price_vip_usd,
    price_basic_thb: v.price_basic_thb,
    price_vip_thb: v.price_vip_thb,
    active: true,
    sort_order: v.sort_order,
    translations: { ru: { label: v.ru } },
  })
  if (error) console.error("variant insert failed:", v.label, error.message)
  else console.log("Created variant:", v.label)
}

const { data: tanyaProps } = await supabase
  .from("properties")
  .select("id, slug")
  .in("slug", ["tanya-core", "bunya-clinic", "tanya-wellbeing"])

for (const p of tanyaProps ?? []) {
  const { error } = await supabase.from("program_properties").insert({
    program_id: prog.id,
    property_id: p.id,
    role: "primary",
  })
  if (error) console.error("property link failed:", p.slug, error.message)
  else console.log("Linked property:", p.slug)
}

console.log("Done. Program is in DRAFT status - review, then flip to published.")
