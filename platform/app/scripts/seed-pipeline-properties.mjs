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

function slugify(s) {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// cohort tags: RESET_RECOVERY=1, PERFORMANCE_LIFESTYLE=2, MIND_BALANCE=3
const RESET = 1, PERFORMANCE = 2, MIND = 3

const DATA = [
  {
    name: "Why Nam Beach",
    island: "Koh Phangan",
    country: "Thailand",
    cohort: MIND,
    activities: "Yoga, meditation, mindfulness, nature immersion, sound healing.",
    programs: [
      { name: "Meditation Reset 3D", days: 3, priceDay: 150, desc: "3-day silent meditation and breathwork inside National Park. For acute stress relief and mental clarity.", outcomes: ["meditation", "stress relief"] },
      { name: "Meditation Reset 5D", days: 5, priceDay: 150, desc: "5-day meditation immersion. Daily guided sessions, sound healing, journaling. For emotional recalibration.", outcomes: ["meditation", "emotional reset"] },
      { name: "Yoga + Nature Immersion 3D", days: 3, priceDay: 150, desc: "3-day yoga and nature program. Forest bathing, movement, mindfulness. Gentle reset for creatives.", outcomes: ["yoga", "nature"] },
      { name: "Yoga + Nature Immersion 5D", days: 5, priceDay: 150, desc: "5-day yoga + nature. Deepens body awareness, reduces cortisol, builds emotional resilience.", outcomes: ["yoga", "resilience"] },
    ],
  },
  {
    name: "Club Med Bintan",
    island: "Bintan",
    country: "Indonesia",
    cohort: PERFORMANCE,
    activities: "Cycling (Ironman terrain), running (jungle and beach), open-water swimming, triathlon support.",
    programs: [
      { name: "Triathlon Prep 7D", days: 7, priceDay: 220, desc: "7-day triathlon preparation camp. Ironman 70.3 Bintan terrain. Swim/bike/run structured training + recovery.", outcomes: ["triathlon", "endurance"] },
      { name: "Triathlon Prep 14D", days: 14, priceDay: 210, desc: "14-day full triathlon prep. Race-simulation days, periodised training, physiotherapy, nutritional coaching.", outcomes: ["triathlon", "endurance"] },
      { name: "Performance Reset 5D", days: 5, priceDay: 230, desc: "5-day performance reset for active professionals from Singapore. Structured training + recovery balance. 50min from SG.", outcomes: ["performance", "recovery"] },
      { name: "Sport & Recovery Cycle 10D", days: 10, priceDay: 215, desc: "10-day sport and recovery cycle. Progressive load + active recovery. Athlete-grade facilities.", outcomes: ["training", "recovery"] },
    ],
  },
  {
    name: "Movenpick Cebu",
    island: "Cebu",
    country: "Philippines",
    cohort: PERFORMANCE,
    activities: "Open-water swimming, running & cycling, hot spring recovery.",
    programs: [
      { name: "Ironman Prep Camp 7D", days: 7, priceDay: 190, desc: "7-day Ironman prep. Open-water swimming (Mactan/Lapu-Lapu), running, cycling. Event-linked: Ironman 70.3 Philippines.", outcomes: ["ironman", "endurance"] },
      { name: "Ironman Prep Camp 14D", days: 14, priceDay: 185, desc: "14-day Ironman training block. Full periodised program, nutrition, recovery, taper protocols.", outcomes: ["ironman", "endurance"] },
    ],
  },
  {
    name: "AYO AYO Wellness",
    island: "Cebu",
    country: "Philippines",
    cohort: PERFORMANCE,
    activities: "Open-water swimming, running, cycling, hot spring (Guadalupe Mabugnao Mainit NP).",
    programs: [
      { name: "Active Recovery 5D", days: 5, priceDay: 110, desc: "5-day active recovery. Post-race or mid-block deload. Mobility, soft tissue, light movement.", outcomes: ["recovery", "mobility"] },
      { name: "Hot Spring Recovery 7D", days: 7, priceDay: 115, desc: "7-day hot spring recovery (Guadalupe Mabugnao Mainit NP). Natural hydrotherapy, mineral bathing, active rest.", outcomes: ["hydrotherapy", "recovery"] },
    ],
  },
  {
    name: "The Shells Resort & Spa Phu Quoc",
    island: "Phu Quoc",
    country: "Vietnam",
    cohort: MIND,
    activities: "Running, cycling, open-water swimming, Chanterelle Spa by JW.",
    programs: [
      { name: "Stress Relief Reset 10D", days: 10, priceDay: 145, desc: "10-day stress relief program. Chanterelle Spa by JW, island running, coastal cycling, emotional decompression protocols.", outcomes: ["stress relief", "spa"] },
      { name: "Emotional Recovery 14D", days: 14, priceDay: 140, desc: "14-day emotional recovery. Deeper therapeutic layer: grief processing, life transition support, daily reflection.", outcomes: ["emotional recovery", "reflection"] },
      { name: "Long Stay Mental Reset 21D", days: 21, priceDay: 135, desc: "21-day long-stay mental reset. Full emotional recalibration. For creatives and professionals in major life transitions.", outcomes: ["mental reset", "transition"] },
    ],
  },
  {
    name: "Village Hotel Sentosa",
    island: "Sentosa",
    country: "Singapore",
    cohort: PERFORMANCE,
    activities: "Running & cycling (purpose-built tracks), open-water swimming, sports festivals, Oasia Spa.",
    programs: [
      { name: "Sport & Chill 3D", days: 3, priceDay: 280, desc: "3-day Sport & Chill. Running tracks, monitored open-water swimming, sports festivals. Urban escape from Singapore city.", outcomes: ["sport", "urban escape"] },
      { name: "Sport & Chill 5D", days: 5, priceDay: 270, desc: "5-day Sport & Chill. Same as 3D but adds structured recovery sessions at Oasia Spa and guided performance review.", outcomes: ["sport", "recovery"] },
    ],
  },
  {
    name: "Happi Village Penang",
    island: "Penang",
    country: "Malaysia",
    cohort: RESET,
    activities: "Nature immersion, mind & body cleanse, forest recovery, cultural grounding in George Town.",
    programs: [
      { name: "Forest Detox 5N", days: 5, priceDay: 120, desc: "5-night forest detox: nature immersion, wellness protocols, mind-body cleanse in George Town rainforest.", outcomes: ["detox", "nature"] },
      { name: "Urban Stress Reset 7D", days: 7, priceDay: 125, desc: "7-day urban professional stress reset. Cultural grounding, nature walks, digital detox blend.", outcomes: ["stress reset", "digital detox"] },
    ],
  },
  {
    name: "Movenpick Resort & Spa Boracay",
    island: "Boracay",
    country: "Philippines",
    cohort: MIND,
    activities: "Yoga, meditation, personal growth workshops, community reflection.",
    programs: [
      { name: "Mindfulness Reset 7D", days: 7, priceDay: 175, desc: "7-day mindfulness reset. Structured yoga, meditation, personal growth workshops. White sand environment.", outcomes: ["mindfulness", "yoga"] },
      { name: "Mindfulness Reset 10D", days: 10, priceDay: 170, desc: "10-day mindfulness. Adds community-driven reflection and peer group workshops.", outcomes: ["mindfulness", "community"] },
      { name: "Community Wellness Week 7D", days: 7, priceDay: 180, desc: "7-day community wellness. Group format. Social connection + mindfulness. For isolation-driven burnout.", outcomes: ["community", "mindfulness"] },
    ],
  },
  {
    name: "Udara Bali Yoga Detox & Spa",
    island: "Bali",
    country: "Indonesia",
    cohort: MIND,
    activities: "Yoga (Hatha/Vinyasa/Yin/Aerial), sound healing, detox, water healing, sauna, meditation.",
    programs: [
      { name: "Emotional Reset 7D", days: 7, priceDay: 130, desc: "7-day emotional reset. Hatha/Vinyasa/Yin yoga, sound healing, water healing, sauna, daily meditation.", outcomes: ["yoga", "sound healing"] },
      { name: "Emotional Reset 14D", days: 14, priceDay: 125, desc: "14-day deep emotional reset. Aerial yoga, full spa, communal reflection. For long-term burnout recovery.", outcomes: ["yoga", "burnout recovery"] },
      { name: "Yoga Detox 5D", days: 5, priceDay: 135, desc: "5-day yoga detox. Daily Yin + Vinyasa, plant-based detox nutrition, steam, sauna. Quick reset for frequent fliers.", outcomes: ["yoga", "detox"] },
      { name: "Yoga Detox 10D", days: 10, priceDay: 130, desc: "10-day yoga detox. Deepened Ayurvedic nutrition layer. Full body-mind cleanse.", outcomes: ["yoga", "ayurveda"] },
    ],
  },
  {
    name: "Mokka Bali",
    island: "Bali",
    country: "Indonesia",
    cohort: MIND,
    activities: "Yoga, fasting programs, meditation, art immersion (Tony Rakka, John Hardy).",
    programs: [
      { name: "Fasting & Clarity 7D", days: 7, priceDay: 115, desc: "7-day fasting and mental clarity. Intermittent + extended fasting, meditation, art immersion (Tony Rakka).", outcomes: ["fasting", "clarity"] },
      { name: "Creative Reset 10D", days: 10, priceDay: 120, desc: "10-day creative reset. Fasting, meditation, John Hardy art and jewellery experience. For creatives and founders.", outcomes: ["fasting", "creativity"] },
    ],
  },
  {
    name: "Como Shambala",
    island: "Singapore",
    country: "Singapore",
    cohort: RESET,
    activities: "Medical wellness, executive recovery, urban detox.",
    programs: [
      { name: "Executive Burnout Reset 3D", days: 3, priceDay: 350, desc: "3-day executive burnout reset. Medical-grade, urban, zero travel friction. For SG/HK/KL C-suite.", outcomes: ["executive", "urban detox"] },
      { name: "Executive Burnout Reset 5D", days: 5, priceDay: 340, desc: "5-day version. Adds biometric baseline, sleep protocol, full follow-up plan.", outcomes: ["executive", "biometrics"] },
    ],
  },
  {
    name: "Langkawi Nature Retreat",
    island: "Langkawi",
    country: "Malaysia",
    cohort: MIND,
    activities: "Nature immersion, digital detox, rainforest recovery.",
    programs: [
      { name: "Nature Detox 7D", days: 7, priceDay: 110, desc: "7-day rainforest nature detox. Digital detox layer, jungle immersion, traditional Malay healing.", outcomes: ["nature detox", "digital detox"] },
      { name: "Digital Detox 10D", days: 10, priceDay: 105, desc: "10-day full digital detox. No screens, structured silence, nature immersion. For tech workers.", outcomes: ["digital detox", "silence"] },
    ],
  },
  {
    name: "Dragon Soul Retreat",
    island: "Koh Phangan",
    country: "Thailand",
    cohort: MIND,
    activities: "Meditation, silence, National Park immersion.",
    programs: [
      { name: "Dragon Soul Meditation 3D", days: 3, priceDay: 85, desc: "3-day meditation inside National Park. Minimal structure. Pure nature + silence immersion.", outcomes: ["meditation", "silence"] },
      { name: "Dragon Soul Meditation 5D", days: 5, priceDay: 85, desc: "5-day deep meditation + yoga. National Park setting. For those seeking complete mental withdrawal.", outcomes: ["meditation", "yoga"] },
    ],
  },
]

let sortOrder = 700
let propCount = 0
let progCount = 0

for (const prop of DATA) {
  const slug = slugify(prop.name)

  const { data: existingProp } = await supabase.from("properties").select("id").eq("slug", slug).maybeSingle()
  let propertyId
  if (existingProp) {
    console.log("Property already exists, skipping insert:", slug)
    propertyId = existingProp.id
  } else {
    const { data: inserted, error } = await supabase
      .from("properties")
      .insert({
        name: prop.name,
        slug,
        island: prop.island,
        country: prop.country,
        cohort_tags: [prop.cohort],
        certified: false,
        active: false,
        description: prop.activities,
      })
      .select("id")
      .single()
    if (error) {
      console.error("property insert failed:", prop.name, error.message)
      continue
    }
    propertyId = inserted.id
    propCount++
    console.log("Created property:", slug)
  }

  for (const p of prop.programs) {
    sortOrder += 1
    const progSlug = `${slug}-${slugify(p.name)}`
    const { data: existingProg } = await supabase.from("programs").select("id").eq("slug", progSlug).maybeSingle()
    if (existingProg) {
      console.log("Program already exists, skipping:", progSlug)
      continue
    }
    const { data: prog, error: progErr } = await supabase
      .from("programs")
      .insert({
        name: p.name,
        slug: progSlug,
        cohort: prop.cohort,
        tier: null,
        duration_days: p.days,
        price_usd: p.priceDay * p.days,
        max_guests: 10,
        outcomes: p.outcomes,
        is_composite: false,
        active: true,
        status: "draft",
        summary: p.desc,
        hero_image_url: null,
        sort_order: sortOrder,
      })
      .select("id")
      .single()
    if (progErr) {
      console.error("program insert failed:", progSlug, progErr.message)
      continue
    }
    const { error: linkErr } = await supabase.from("program_properties").insert({
      program_id: prog.id,
      property_id: propertyId,
      role: "primary",
    })
    if (linkErr) console.error("link failed:", progSlug, linkErr.message)
    progCount++
    console.log("Created program:", progSlug)
  }
}

console.log(`\nDone. Properties created: ${propCount}, Programs created: ${progCount}`)
