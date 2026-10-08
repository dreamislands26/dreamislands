// Phase 1: seed Wudang Mountain + Mile Wellness Resort as draft properties/programs.
// Source: DIT_China_Ecosystem_v3_1.xlsx. All programs created with status="draft".
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

const PROPERTIES = [
  {
    key: "wudang",
    name: "Wudang Mountain Wellness Center",
    slug: "wudang-mountain-wellness-center",
    island: "Wudang Mountain",
    country: "China",
    contact_wa: null,
  },
  {
    key: "mile",
    name: "Mile Wellness Resort",
    slug: "mile-wellness-resort",
    island: "Mile, Yunnan",
    country: "China",
    contact_wa: null,
  },
]

const PROGRAMS = [
  // --- Wudang (source codes WUD-PRG-001..005) ---
  {
    property: "wudang", cohort: 3, is_composite: false,
    name: "3-Day Mind Reset", slug: "wudang-3-day-mind-reset",
    summary: "An introduction to Daoist practice in the Wudang Mountains: Taiji, Qigong, meditation and a first TCM diagnostic, set against UNESCO World Heritage temple scenery.",
    goal: "A short, accessible entry point into Daoist mind-body practice for first-time visitors.",
    target_guest: "Executives and professionals curious about meditation and Daoist practice who want a short, low-commitment introduction.",
    how_we_achieve: "Guided Taiji and Qigong sessions, an introductory meditation practice, a mountain walk through temple grounds, and a TCM diagnostic consultation.",
    guest_feels: "Calmer, more present, and oriented in Daoist practice ??? a taste of the deeper programs available.",
    included_services: "Retreat accommodation, all meals, group Taiji/Qigong sessions, one TCM diagnostic consultation.",
    outcomes: ["Stress reduction", "Introduction to meditation", "TCM diagnostic baseline"],
    variants: [{ days: 3, nights: 2, basic: 650, vip: 950 }],
  },
  {
    property: "wudang", cohort: 3, is_composite: false,
    name: "5-Day Dao Wellness", slug: "wudang-5-day-dao-wellness",
    summary: "Daily Taiji and Qigong, TCM treatment, breathing practice and temple tours across five days in one of China's most important centers of Daoist culture.",
    goal: "A full introductory immersion into Daoist wellness practice, structured for measurable calm and clarity.",
    target_guest: "Stressed professionals and mental-clarity seekers ready for a structured multi-day retreat.",
    how_we_achieve: "Daily Taiji and Qigong practice, breathing technique workshops, one TCM treatment, guided temple tours, and nature therapy walks.",
    guest_feels: "Restored focus, a settled nervous system, and a working Daoist practice to take home.",
    included_services: "Retreat room, all meals, daily practice sessions, one TCM treatment, cultural guide.",
    outcomes: ["Deeper sleep", "Mental clarity", "Sustained calm"],
    variants: [{ days: 5, nights: 4, basic: 1200, vip: 1800 }],
  },
  {
    property: "wudang", cohort: 4, is_composite: true,
    name: "7-Day Tai Chi & Longevity", slug: "wudang-7-day-tai-chi-longevity",
    summary: "Deep Taiji training paired with longevity herbal protocols, daily TCM treatment and contemplative practice across seven days on the mountain.",
    goal: "Build a genuine Taiji practice and a longevity-focused TCM protocol over an extended stay.",
    target_guest: "Longevity-focused guests and returning practitioners ready to go beyond an introductory retreat.",
    how_we_achieve: "Daily group Taiji plus two private sessions, a personalized longevity herb protocol, ongoing TCM treatment, and temple visits.",
    guest_feels: "A tangible skill gain in Taiji, physical vitality, and a personalized longevity protocol to continue at home.",
    included_services: "Mountain view room, all meals, daily group + two private sessions, herb protocol, temple visits.",
    outcomes: ["Taiji proficiency", "Longevity protocol", "Physical vitality"],
    variants: [{ days: 7, nights: 6, basic: 1800, vip: 2800 }],
  },
  {
    property: "wudang", cohort: 4, is_composite: true,
    name: "10-Day Deep Internal Practice", slug: "wudang-10-day-deep-internal-practice",
    summary: "The most advanced Wudang program: inner alchemy (nei gong), advanced Qigong, Dao Yin and an intensive TCM protocol with daily private teacher guidance.",
    goal: "A serious, immersive commitment to advanced Daoist internal practice for guests ready for deep transformation.",
    target_guest: "Committed practitioners and longevity/spiritual-track guests seeking the deepest version of the Wudang program.",
    how_we_achieve: "Daily private teacher sessions in advanced Qigong and nei gong, Dao Yin practice, a full personalized TCM protocol, and a closing ceremony.",
    guest_feels: "Genuine internal skill development, deep rest, and a completed rite-of-passage experience.",
    included_services: "Premium suite, all meals, daily private teacher sessions, full TCM protocol, closing ceremony.",
    outcomes: ["Advanced internal practice", "Deep restoration", "Longevity protocol"],
    variants: [{ days: 10, nights: 9, basic: 3200, vip: 5000 }],
  },
  {
    property: "wudang", cohort: 1, is_composite: false,
    name: "Executive Burnout Recovery", slug: "wudang-executive-burnout-recovery",
    summary: "A five-day protocol combining digital detox, daily coaching, Qigong and TCM diagnosis, built specifically for burnout recovery.",
    goal: "Interrupt burnout with a structured, coached reset rather than a generic relaxation break.",
    target_guest: "Executives and high-stress professionals showing signs of burnout who need a structured, coached intervention.",
    how_we_achieve: "Daily 1-on-1 coaching, a strict digital detox policy, daily Qigong, a TCM diagnostic consultation, and a personalized recovery plan to take home.",
    guest_feels: "Genuinely disconnected from work stress, with a concrete recovery plan rather than just a week off.",
    included_services: "Premium room, all meals, daily coaching, TCM consultation, personalized recovery plan.",
    outcomes: ["Burnout recovery plan", "Digital detox", "Stress reduction"],
    variants: [{ days: 5, nights: 4, basic: 2000, vip: 3200 }],
  },
  // --- Mile Wellness Resort (source codes MIL-PRG-001..007) ---
  {
    property: "mile", cohort: 1, is_composite: false,
    name: "3D2N Detox & Anti-aging", slug: "mile-3d2n-detox-anti-aging",
    summary: "A short, focused reset at Mile's medical-grade silica hot springs, combining detox protocols, nutrition guidance, spa treatment and a TCM consultation.",
    goal: "A fast, accessible detox and anti-aging reset for guests short on time.",
    target_guest: "Guests wanting a fast, tangible reset without a long medical commitment.",
    how_we_achieve: "Daily detox treatments, hot spring access, a nutrition consultation, spa treatment, and a TCM consultation.",
    guest_feels: "Lighter, clearer-skinned, and reset ??? a strong first impression of the Mile ecosystem.",
    included_services: "Wellness room, all meals, daily treatments, TCM consultation, hot springs access.",
    outcomes: ["Detox", "Anti-aging", "Reduced toxin load"],
    variants: [{ days: 3, nights: 2, basic: 1200, vip: 2000 }],
  },
  {
    property: "mile", cohort: 1, is_composite: false,
    name: "5D4N Wellness Escape", slug: "mile-5d4n-wellness-escape",
    summary: "The full five-pillar Mile experience: hot springs, functional medicine introduction, spa and mindfulness practice across five days.",
    goal: "A complete introduction to Mile's five wellness pillars in a single stay.",
    target_guest: "Guests wanting a genuine multi-pillar wellness stay ??? medical, spa, and mindfulness combined.",
    how_we_achieve: "A daily program spanning hot springs, one functional medicine consult, spa treatment, and mindfulness sessions.",
    guest_feels: "Restored on multiple fronts ??? physically relaxed, medically checked-in, and mentally calmer.",
    included_services: "Wellness room, all meals, daily program, one medical consult, spa, hot springs.",
    outcomes: ["Full-pillar wellness reset", "Medical baseline", "Relaxation"],
    variants: [{ days: 5, nights: 4, basic: 2200, vip: 3500 }],
  },
  {
    property: "mile", cohort: 4, is_composite: true,
    name: "7D6N Deep Recovery", slug: "mile-7d6n-deep-recovery",
    summary: "A comprehensive medical-wellness protocol over seven days: functional medicine, IV therapy, TCM, rehabilitation and full hot-spring spa access.",
    goal: "A genuine recovery protocol for guests carrying real physical strain, not just a relaxation break.",
    target_guest: "Guests recovering from sustained physical or metabolic strain who need a comprehensive protocol.",
    how_we_achieve: "Daily treatments spanning a full medical panel, IV therapy protocol, TCM, rehabilitation sessions, and full spa/hot-spring access.",
    guest_feels: "Measurably recovered, with a medical panel result in hand and a clear picture of what's next.",
    included_services: "Deluxe room, all meals, daily treatments, medical panel, IV protocol, full spa access.",
    outcomes: ["Comprehensive recovery", "Medical panel", "IV protocol"],
    variants: [{ days: 7, nights: 6, basic: 4500, vip: 7000 }],
  },
  {
    property: "mile", cohort: 2, is_composite: false,
    name: "Executive Health & Recovery", slug: "mile-executive-health-recovery",
    summary: "A seven-day executive check-up and recovery protocol: full biomarker panel, functional medicine, hot springs and an English-language health report.",
    goal: "Give time-poor executives a rigorous health baseline plus a genuine recovery week.",
    target_guest: "Executives who want a rigorous medical check-up bundled with real recovery, not just a spa week.",
    how_we_achieve: "A full medical check-up with biomarker panel, daily functional-medicine-informed wellness treatments, and full hot-spring access.",
    guest_feels: "Informed about their real health status, physically recovered, and holding an English-language report to share with their own doctor.",
    included_services: "Suite, all meals, full medical check-up, English health report, daily wellness, hot springs.",
    outcomes: ["Executive health baseline", "Biomarker panel", "Recovery"],
    variants: [{ days: 7, nights: 6, basic: 5500, vip: 9000 }],
  },
  {
    property: "mile", cohort: 4, is_composite: true,
    name: "Medical Wellness Journey", slug: "mile-medical-wellness-journey",
    summary: "An extended medical wellness protocol (10-21 days) for chronic condition management, combining rehabilitation, NAD+ therapy and gut-health work with specialist consultations.",
    goal: "Manage a real chronic condition or extended recovery need within a wellness-resort setting rather than a hospital.",
    target_guest: "Guests managing a chronic condition or extended recovery who want ongoing specialist support in a resort setting.",
    how_we_achieve: "Daily medical and wellness treatment combining rehabilitation, NAD+ therapy, gut microbiome work, and specialist consultations throughout the stay.",
    guest_feels: "Genuinely supported through a real health challenge, with specialist oversight the whole way.",
    included_services: "Premium accommodation, all meals, daily medical + wellness treatment, specialist consultations.",
    outcomes: ["Chronic condition management", "NAD+ protocol", "Gut health"],
    variants: [{ days: 14, nights: 13, basic: 8000, vip: 25000 }],
  },
  {
    property: "mile", cohort: 2, is_composite: true,
    name: "Luxury Preventive Health Program", slug: "mile-luxury-preventive-health-program",
    summary: "A fully bespoke preventive health program with comprehensive diagnostics, an optional genomics panel, and a long-term plan built with a personal coordinator.",
    goal: "A fully custom, top-tier preventive health program for guests who want the most comprehensive option available.",
    target_guest: "High-net-worth guests wanting the most comprehensive, fully bespoke preventive health program available.",
    how_we_achieve: "A full diagnostics suite, an optional genomics panel, and a long-term health plan built one-on-one with a personal coordinator.",
    guest_feels: "In possession of the most complete picture of their health available, with a concrete long-term plan.",
    included_services: "VIP accommodation, all meals, full diagnostics suite, personal coordinator.",
    outcomes: ["Comprehensive diagnostics", "Long-term health plan", "Bespoke protocol"],
    variants: [],
    price_usd_fallback: 10000,
    duration_days_fallback: 10,
  },
  {
    property: "mile", cohort: 3, is_composite: false,
    name: "Wellness Escape (Short)", slug: "mile-wellness-escape-short",
    summary: "A short, restful stay centered on Mile's silica hot springs, one spa treatment and a light TCM session ??? rest and relaxation without a heavy medical protocol.",
    goal: "A quick, low-intensity reset for guests who want rest without a heavy medical commitment.",
    target_guest: "Guests wanting genuine rest and relaxation without committing to a medical-wellness protocol.",
    how_we_achieve: "Daily hot spring access, one spa treatment, one light TCM session, and unstructured rest time.",
    guest_feels: "Rested, relaxed, and unhurried.",
    included_services: "Wellness room, all meals, hot springs, one spa treatment, one TCM session.",
    outcomes: ["Rest", "Relaxation", "Light TCM"],
    variants: [{ days: 3, nights: 2, basic: 900, vip: 1500 }],
  },
]

async function main() {
  const propertyIds = {}
  for (const p of PROPERTIES) {
    const { data, error } = await supabase
      .from("properties")
      .insert({ name: p.name, slug: p.slug, island: p.island, country: p.country, contact_wa: p.contact_wa })
      .select("id, name")
      .single()
    if (error) throw new Error(`property ${p.name}: ${error.message}`)
    propertyIds[p.key] = data.id
    console.log("property:", data.name, data.id)
  }

  for (const prog of PROGRAMS) {
    const firstVariant = prog.variants[0]
    const duration_days = firstVariant ? firstVariant.days : prog.duration_days_fallback
    const price_usd = firstVariant ? firstVariant.basic : prog.price_usd_fallback

    const { data: progRow, error: progErr } = await supabase
      .from("programs")
      .insert({
        name: prog.name,
        slug: prog.slug,
        status: "draft",
        active: true,
        cohort: prog.cohort,
        is_composite: prog.is_composite,
        duration_days,
        price_usd,
        summary: prog.summary,
        goal: prog.goal,
        target_guest: prog.target_guest,
        how_we_achieve: prog.how_we_achieve,
        guest_feels: prog.guest_feels,
        included_services: prog.included_services,
        outcomes: prog.outcomes,
        sort_order: 500,
      })
      .select("id, name")
      .single()
    if (progErr) {
      console.error("program failed:", prog.name, progErr.message)
      continue
    }
    console.log("program:", progRow.name, progRow.id)

    const { error: linkErr } = await supabase
      .from("program_properties")
      .insert({ program_id: progRow.id, property_id: propertyIds[prog.property], role: "primary" })
    if (linkErr) console.error("  link failed:", linkErr.message)

    for (const v of prog.variants) {
      const { error: varErr } = await supabase.from("program_variants").insert({
        program_id: progRow.id,
        label: `${v.days}D/${v.nights}N`,
        duration_days: v.days,
        duration_nights: v.nights,
        price_basic_usd: v.basic,
        price_vip_usd: v.vip,
        active: true,
      })
      if (varErr) console.error("  variant failed:", varErr.message)
    }
  }
  console.log("done")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

