// Phase 2: full China catalogue - services (Wudang/Mile/BM/Xi'an), accommodation (Wudang/Mile).
// Source: DIT_China_Ecosystem_v3_1.xlsx + DIT_BetterMigrate_DataModel_v1.xlsx.
// Wudang/Mile services link as optional add-ons to ALL of that destination's programs
// (source's per-program "+"-range inclusion rules simplified for this draft pass).
// BM Network / Xi'an Ops services are seeded standalone (cross-cutting, not program-specific).
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

const RMB_USD = 7.25
const rmb = (v) => (v == null ? null : Math.round((v / RMB_USD) * 100) / 100)

// { slug, name, category, price_usd, unit, description, destination }
// destination: "wudang" | "mile" | null (null = standalone, no program links)
const SERVICES = [
  // --- Wudang activities (WUD-ACT-001..019) ---
  { slug: "wud-taiji-group-class", name: "Taiji Group Class", category: "mind", price_usd: 20, unit: "per session", description: "Group Taiji (6-12 people), daily morning. $20-35.", destination: "wudang" },
  { slug: "wud-taiji-private-session", name: "Taiji Private Session", category: "mind", price_usd: 80, unit: "per session", description: "1-on-1 with a Taiji master, booking required. $80-130.", destination: "wudang" },
  { slug: "wud-qigong-morning-practice", name: "Qigong Morning Practice", category: "mind", price_usd: 15, unit: "per session", description: "Daily group practice at sunrise. $15-25.", destination: "wudang" },
  { slug: "wud-dao-yin-stretching", name: "Dao Yin (Guided Stretching)", category: "mind", price_usd: 20, unit: "per session", description: "Ancient Daoist yoga, group format. $20-30.", destination: "wudang" },
  { slug: "wud-nei-gong-inner-energy", name: "Inner Energy Practice (Nei Gong)", category: "mind", price_usd: 50, unit: "per session", description: "Advanced small-group / 1-on-1 practice. $50-100.", destination: "wudang" },
  { slug: "wud-breathing-workshop", name: "Breathing Techniques Workshop", category: "mind", price_usd: 25, unit: "per session", description: "Group breathwork workshop. $25-40.", destination: "wudang" },
  { slug: "wud-meditation-session", name: "Meditation Session", category: "mind", price_usd: 20, unit: "per session", description: "Group meditation, AM + PM. $20-35.", destination: "wudang" },
  { slug: "wud-mindfulness-practice", name: "Mindfulness Practice", category: "mind", price_usd: 20, unit: "per session", description: "Group mindfulness practice. $20-30.", destination: "wudang" },
  { slug: "wud-digital-detox", name: "Digital Detox Programme", category: "mind", price_usd: null, unit: "per stay", description: "No-devices policy, included in immersive programs.", destination: "wudang" },
  { slug: "wud-tcm-diagnostic", name: "TCM Diagnostic Consultation", category: "medical", price_usd: 60, unit: "per consult", description: "Tongue, pulse and constitution diagnostics. $60-100.", destination: "wudang" },
  { slug: "wud-acupuncture", name: "Acupuncture Treatment", category: "medical", price_usd: 50, unit: "per session", description: "$50-90.", destination: "wudang" },
  { slug: "wud-tuina-massage", name: "Tuina Massage", category: "massage", price_usd: 60, unit: "per session", description: "Therapeutic TCM massage. $60-100.", destination: "wudang" },
  { slug: "wud-herbal-protocol", name: "Herbal Medicine Protocol", category: "medical", price_usd: 80, unit: "per protocol", description: "Prescribed post-TCM-consult. $80-150.", destination: "wudang" },
  { slug: "wud-temple-tour", name: "Mountain Temple Tour", category: "other", price_usd: 40, unit: "per tour", description: "Licensed guide, UNESCO sites. $40-70.", destination: "wudang" },
  { slug: "wud-philosophy-lecture", name: "Daoist Philosophy Lecture", category: "other", price_usd: 30, unit: "per session", description: "Group lecture, EN interpreter required. $30-50.", destination: "wudang" },
  { slug: "wud-forest-therapy", name: "Forest Therapy Walk", category: "other", price_usd: 25, unit: "per session", description: "Shinrin-yoku style guided walk. $25-45.", destination: "wudang" },
  { slug: "wud-contemplative-walk", name: "Contemplative Mountain Walk", category: "other", price_usd: 20, unit: "per session", description: "Guided mountain trail walk. $20-35.", destination: "wudang" },
  { slug: "wud-airport-transfer-wuhan", name: "Airport Transfer (Wuhan)", category: "other", price_usd: 100, unit: "per transfer", description: "~4h; Enshi transfer also available. $100-160.", destination: "wudang" },
  { slug: "wud-ru-interpreter", name: "Russian-speaking Interpreter", category: "other", price_usd: 200, unit: "per day", description: "TBC via Xi'an hub.", destination: "wudang" },

  // --- Mile medical (MIL-MED-001..013) ---
  { slug: "mil-executive-checkup", name: "Executive Health Check-up", category: "medical", price_usd: 800, unit: "per person", description: "Full biomarker panel, EN health report. $800-1500.", destination: "mile" },
  { slug: "mil-functional-medicine", name: "Functional Medicine Consultation", category: "medical", price_usd: 150, unit: "per consult", description: "Lab interpretation + protocol design. $150-300.", destination: "mile" },
  { slug: "mil-iv-therapy", name: "IV Therapy", category: "medical", price_usd: 100, unit: "per session", description: "Nutritional / antioxidant infusions. $100-400.", destination: "mile" },
  { slug: "mil-nad-therapy", name: "NAD+ Therapy", category: "medical", price_usd: 300, unit: "per session", description: "Anti-aging / cellular energy. $300-800.", destination: "mile" },
  { slug: "mil-tcm-diagnostic", name: "TCM Diagnostic Consultation", category: "medical", price_usd: 80, unit: "per consult", description: "Constitution analysis + herb protocol. $80-150.", destination: "mile" },
  { slug: "mil-acupuncture", name: "Acupuncture", category: "medical", price_usd: 60, unit: "per session", description: "$60-120.", destination: "mile" },
  { slug: "mil-rehabilitation", name: "Rehabilitation Session", category: "medical", price_usd: 80, unit: "per session", description: "Post-surgery or chronic condition. $80-150.", destination: "mile" },
  { slug: "mil-gut-microbiome", name: "Gut Microbiome Programme", category: "medical", price_usd: 500, unit: "per programme", description: "Testing + protocol + nutrition plan. $500-1200.", destination: "mile" },
  { slug: "mil-pain-management", name: "Pain Management Programme", category: "medical", price_usd: 300, unit: "per programme", description: "Multi-modal; TCM + functional. $300-800.", destination: "mile" },
  { slug: "mil-sports-rehab", name: "Sports Rehabilitation", category: "medical", price_usd: 100, unit: "per session", description: "Movement + TCM + physio. $100-200.", destination: "mile" },
  { slug: "mil-health-screening-basic", name: "Health Screening (Basic)", category: "medical", price_usd: 200, unit: "per person", description: "Blood panel + vitals + consult. $200-400.", destination: "mile" },
  { slug: "mil-hydrogen-therapy-room", name: "Hydrogen Therapy (Room)", category: "medical", price_usd: null, unit: "in room", description: "DENBA tech, integrated into special rooms.", destination: "mile" },
  { slug: "mil-sleep-improvement", name: "Sleep Improvement Programme", category: "medical", price_usd: 150, unit: "per programme", description: "DENBA tech; room + protocols + sleep coaching. $150-300.", destination: "mile" },

  // --- Mile spa/beauty (MIL-SPA-001..009) ---
  { slug: "mil-hot-spring-day-access", name: "Hot Spring Day Access", category: "other", price_usd: 40, unit: "per person", description: "Silica mineral pools; multiple themed baths. $40-80.", destination: "mile" },
  { slug: "mil-signature-spa-ritual", name: "Signature Spa Ritual", category: "massage", price_usd: 150, unit: "per session", description: "SOTHYS signature treatment, 90-120 min. $150-280.", destination: "mile" },
  { slug: "mil-facial-treatment", name: "Facial Treatment", category: "beauty", price_usd: 80, unit: "per session", description: "SOTHYS/GeneoX, anti-aging focus available. $80-200.", destination: "mile" },
  { slug: "mil-body-treatment", name: "Body Treatment", category: "beauty", price_usd: 100, unit: "per session", description: "SOTHYS/LPG detox wraps, body contour. $100-220.", destination: "mile" },
  { slug: "mil-lpg-endermologie", name: "LPG Endermologie", category: "beauty", price_usd: 120, unit: "per session", description: "Body sculpting, lymphatic drainage. $120-200.", destination: "mile" },
  { slug: "mil-indiba-treatment", name: "INDIBA Treatment", category: "beauty", price_usd: 150, unit: "per session", description: "Radiofrequency; anti-aging; pain relief. $150-300.", destination: "mile" },
  { slug: "mil-geneox-facial", name: "GeneoX Facial", category: "beauty", price_usd: 120, unit: "per session", description: "Oxygenation + infusion technology. $120-200.", destination: "mile" },
  { slug: "mil-therapeutic-massage", name: "Therapeutic Massage", category: "massage", price_usd: 80, unit: "per session", description: "Various modalities. $80-150.", destination: "mile" },
  { slug: "mil-anti-aging-programme", name: "Anti-aging Programme", category: "beauty", price_usd: 800, unit: "per programme", description: "SOTHYS + INDIBA + LPG combined course. $800-2000.", destination: "mile" },

  // --- Better Migrate Medical Network (standalone, cross-cutting) ---
  { slug: "bm-basic-service-package", name: "Basic Service Package", category: "medical", price_usd: rmb(3500), unit: "per case", description: "Pre-consultation 30min, up to 2-day bilingual accompaniment, airport pickup x1, custom medical plan, insurance doc support. RMB 3500.", destination: null },
  { slug: "bm-outpatient-accompaniment", name: "Outpatient Visit Accompaniment (<=4h)", category: "medical", price_usd: rmb(600), unit: "per visit", description: "Bilingual escort, registration, payment, pharmacy. RMB 600.", destination: null },
  { slug: "bm-fullday-accompaniment", name: "Full-day Accompaniment (8h)", category: "medical", price_usd: rmb(800), unit: "per day", description: "RMB 800.", destination: null },
  { slug: "bm-inpatient-accompaniment", name: "Inpatient / Surgery Accompaniment", category: "medical", price_usd: rmb(1000), unit: "per day", description: "Includes medical instruction recording. RMB 1000.", destination: null },
  { slug: "bm-continuous-inpatient", name: "Continuous Inpatient Escort (3+ days)", category: "medical", price_usd: rmb(800), unit: "per day", description: "Discounted rate for 3+ continuous days. RMB 800.", destination: null },
  { slug: "bm-general-specialist-appt", name: "General Specialist Appointment", category: "medical", price_usd: rmb(800), unit: "per appointment", description: "Registration + dept coordination + follow-up. RMB 800-1000.", destination: null },
  { slug: "bm-senior-vip-appt", name: "Senior Specialist / VIP Clinic Appointment", category: "medical", price_usd: rmb(1500), unit: "per appointment", description: "VIP clinic access, scarce resource coordination. RMB 1500-4000.", destination: null },
  { slug: "bm-top-named-appt", name: "Top Specialist / Named Doctor Appointment", category: "medical", price_usd: rmb(4000), unit: "per appointment", description: "Priority scheduling, dedicated case manager. RMB 4000-20000.", destination: null },
  { slug: "bm-surgery-assoc-chief", name: "Surgery Coordination - Associate Chief Physician", category: "medical", price_usd: rmb(3000), unit: "per surgery", description: "Bed coord, pre-op exam, schedule follow-up. RMB 3000-8000.", destination: null },
  { slug: "bm-surgery-chief", name: "Surgery Coordination - Chief Physician", category: "medical", price_usd: rmb(12000), unit: "per surgery", description: "VIP bed, fast-track exam. RMB 12000-20000.", destination: null },
  { slug: "bm-surgery-renowned", name: "Surgery Coordination - Renowned Specialist", category: "medical", price_usd: rmb(25000), unit: "per surgery", description: "Priority scheduling, named specialist. RMB 25000-38000.", destination: null },
  { slug: "bm-airport-pickup", name: "Airport / Railway Pickup (BM)", category: "other", price_usd: rmb(300), unit: "per transfer", description: "Citywide private transfer. RMB 300.", destination: null },
  { slug: "bm-hotel-booking", name: "Hotel Booking Assistance (BM)", category: "other", price_usd: rmb(100), unit: "per booking", description: "RMB 100.", destination: null },
  { slug: "bm-interpretation", name: "Multilingual Interpretation (BM)", category: "other", price_usd: rmb(200), unit: "per hour", description: "Beyond standard bilingual escort. RMB 200.", destination: null },
  { slug: "bm-insurance-docs", name: "Insurance Claim Document Organization", category: "other", price_usd: rmb(300), unit: "per set", description: "RMB 300.", destination: null },
  { slug: "bm-emergency-access", name: "24h Emergency Medical Access Coordination", category: "medical", price_usd: rmb(1500), unit: "per event", description: "RMB 1500.", destination: null },
  { slug: "bm-package-a", name: "Package A - Outpatient Fast-track", category: "medical", price_usd: rmb(3500), unit: "per case", description: "Basic package + specialist appt coord + full-day bilingual + priority exam. RMB 3500.", destination: null },
  { slug: "bm-package-b", name: "Package B - Surgery Full-process", category: "medical", price_usd: rmb(18000), unit: "from", description: "Basic + specialist + pre-op + surgery coord + inpatient + post-op guidance + medication. RMB 18000+.", destination: null },
  { slug: "bm-oncology-coordination", name: "Oncology Care Coordination", category: "medical", price_usd: null, unit: "custom quote", description: "Cancer screening, second opinion, treatment coordination, personalized care plan.", destination: null },
  { slug: "bm-neurosurgery-coordination", name: "Neurosurgery Coordination", category: "medical", price_usd: null, unit: "custom quote", description: "Complex brain & spine; MRI fast-track (3 days).", destination: null },
  { slug: "bm-ophthalmology-coordination", name: "Ophthalmology Coordination", category: "medical", price_usd: null, unit: "custom quote", description: "LASIK/ICL, cataract, glaucoma, eye health management.", destination: null },
  { slug: "bm-dental-coordination", name: "Dental Care Coordination", category: "medical", price_usd: null, unit: "custom quote", description: "Root canal, implants, oral exam, restoration, veneers.", destination: null },
  { slug: "bm-health-checkup-coordination", name: "Health Checkup Coordination", category: "medical", price_usd: null, unit: "custom quote", description: "Comprehensive screening + preventive health assessment.", destination: null },
  { slug: "bm-tcm-integrated-care", name: "TCM Integrated Care", category: "medical", price_usd: null, unit: "custom quote", description: "TCM therapies for rehabilitation & long-term wellness.", destination: null },

  // --- Xi'an Operations Hub (standalone, cross-cutting) ---
  { slug: "xian-patient-registration", name: "Patient Registration & Case Opening", category: "other", price_usd: null, unit: "per case", description: "Initial intake; case file creation. Included in all packages.", destination: null },
  { slug: "xian-medical-plan", name: "Medical Plan Development", category: "other", price_usd: null, unit: "per case", description: "Hospital + doctor + timeline plan. Included in all packages.", destination: null },
  { slug: "xian-specialist-booking", name: "Specialist Appointment Booking", category: "other", price_usd: null, unit: "per appointment", description: "Coordination with hospital department. Included in all packages.", destination: null },
  { slug: "xian-exam-scheduling", name: "Examination Scheduling", category: "other", price_usd: null, unit: "per case", description: "Imaging, lab, diagnostics. Included in all packages.", destination: null },
  { slug: "xian-insurance-assistance", name: "Insurance Assistance", category: "other", price_usd: rmb(300), unit: "per set", description: "Claim docs + communication. RMB 300.", destination: null },
  { slug: "xian-emergency-access", name: "24h Emergency Access", category: "medical", price_usd: rmb(1500), unit: "per event", description: "Hospital emergency coordination. RMB 1500.", destination: null },
  { slug: "xian-followup", name: "Post-treatment Follow-up", category: "other", price_usd: null, unit: "per case", description: "Health records, long-term tracking. Included in all packages.", destination: null },
  { slug: "xian-longterm-case-mgmt", name: "Long-term Case Management", category: "other", price_usd: null, unit: "per month", description: "Chronic / oncology / complex cases. Custom quote.", destination: null },
  { slug: "xian-bilingual-escort", name: "Bilingual Medical Escort (CN/EN)", category: "other", price_usd: rmb(600), unit: "per visit/day", description: "Hospital process, doctor-patient communication. RMB 600 (<=4h) / 800 (8h) / 1000 (inpatient).", destination: null },
  { slug: "xian-medical-interpretation", name: "Medical Interpretation (Add-on)", category: "other", price_usd: rmb(200), unit: "per hour", description: "Beyond standard bilingual included in packages. RMB 200.", destination: null },
  { slug: "xian-document-translation", name: "Medical Document Translation", category: "other", price_usd: null, unit: "per set", description: "EN/RU <-> Chinese; history, reports, prescriptions. Price TBD.", destination: null },
  { slug: "xian-ru-interpreter", name: "Russian-speaking Interpreter", category: "other", price_usd: null, unit: "per day", description: "CRITICAL for RU/CIS market - price to confirm.", destination: null },
  { slug: "xian-report-translation", name: "Report Translation (EN Health Report)", category: "other", price_usd: null, unit: "per report", description: "Check-up result in EN for guest. Included in check-up packages.", destination: null },
  { slug: "xian-personal-coordinator", name: "Personal Medical Coordinator", category: "other", price_usd: null, unit: "per case", description: "Dedicated case manager, single point of contact. Included in all packages.", destination: null },
  { slug: "xian-vip-concierge", name: "VIP Medical Concierge Package", category: "other", price_usd: null, unit: "per case", description: "Private escort, priority access, luxury transfer, hotel. Custom quote.", destination: null },
  { slug: "xian-insurance-doc-support", name: "Insurance Document Support", category: "other", price_usd: rmb(300), unit: "per set", description: "Paperwork, communication, claim support. RMB 300.", destination: null },
  { slug: "xian-outpatient-support", name: "Outpatient Support Service", category: "other", price_usd: null, unit: "per case", description: "Fast-track outpatient + specialist + bilingual. Included in Package A.", destination: null },
  { slug: "xian-surgery-coordination-pkg", name: "Surgery Coordination Package", category: "medical", price_usd: rmb(18000), unit: "per case", description: "Pre-op + hospital + inpatient + post-op guidance + medication. From RMB 18000.", destination: null },
  { slug: "xian-airport-railway-pickup", name: "Airport / Railway Pickup (Xi'an)", category: "other", price_usd: rmb(300), unit: "per transfer", description: "Citywide private, Xi'an area. RMB 300.", destination: null },
  { slug: "xian-hotel-booking", name: "Hotel Booking near Hospital", category: "other", price_usd: rmb(100), unit: "per booking", description: "Nearby accommodation coordination. RMB 100.", destination: null },
  { slug: "xian-intercity-transfer", name: "Inter-city Medical Transfer", category: "other", price_usd: null, unit: "per trip", description: "E.g. Xi'an -> Kunming for Mile + hospital combo. Custom quote.", destination: null },
  { slug: "xian-visa-support", name: "Visa Support Information", category: "other", price_usd: null, unit: "per case", description: "Guidance only. Included in all packages.", destination: null },
  { slug: "xian-hospital-itinerary", name: "Travel Itinerary Around Hospital", category: "other", price_usd: null, unit: "per trip", description: "Sightseeing customized around medical schedule. Custom quote.", destination: null },
  { slug: "xian-wudang-transfer", name: "Wudang Transfer Coordination", category: "other", price_usd: null, unit: "per transfer", description: "From Xi'an or Wuhan to Wudang. Custom quote.", destination: null },
  { slug: "xian-mile-transfer", name: "Mile Resort Transfer Coordination", category: "other", price_usd: null, unit: "per transfer", description: "Kunming KMG to Mile (~2.5h) or Mengzi (~1h). Custom quote.", destination: null },
]

// { property: "wudang"|"mile", room_type, capacity, has_pool, price_usd_night_low, description }
const ACCOMMODATION = [
  { property: "wudang", room_type: "Wellness Hotel Room", capacity: 2, has_pool: false, price: 60, description: "Modern wellness-standard room; nature views; in-room wellness amenities." },
  { property: "wudang", room_type: "Retreat Room", capacity: 2, has_pool: false, price: 50, description: "Quiet, minimalist; designed for meditation & reflection; no TV." },
  { property: "wudang", room_type: "Mountain View Room", capacity: 2, has_pool: false, price: 80, description: "Panoramic mountain/temple views; balcony; peaceful setting." },
  { property: "wudang", room_type: "Premium Suite", capacity: 2, has_pool: false, price: 150, description: "Spacious; best views; separate sitting area; premium bedding & bath." },
  { property: "mile", room_type: "Wellness Room (Standard)", capacity: 2, has_pool: false, price: 120, description: "Modern wellness-standard rooms with nature views; wellness amenities included." },
  { property: "mile", room_type: "Sleep Improvement Room", capacity: 2, has_pool: false, price: 150, description: "Thematic room with DENBA sleep technology; blackout; sound-optimized; sleep coaching." },
  { property: "mile", room_type: "Hydrogen Therapy Room", capacity: 2, has_pool: false, price: 180, description: "Integrated hydrogen therapy technology; recovery-focused specialty room." },
  { property: "mile", room_type: "DENBA Recovery Room", capacity: 2, has_pool: false, price: 200, description: "Full DENBA technology suite; cellular recovery protocols; premium amenity." },
  { property: "mile", room_type: "Deluxe Room", capacity: 2, has_pool: false, price: 200, description: "Larger floor plan; enhanced views; premium bedding & bath." },
  { property: "mile", room_type: "Premium Suite", capacity: 2, has_pool: false, price: 350, description: "Spacious suite; best resort views; separate living area; VIP bath; butler option." },
]

async function main() {
  const { data: props } = await supabase
    .from("properties")
    .select("id, slug")
    .in("slug", ["wudang-mountain-wellness-center", "mile-wellness-resort"])
  const propertyId = Object.fromEntries(props.map((p) => [p.slug.startsWith("wudang") ? "wudang" : "mile", p.id]))

  const { data: progs } = await supabase
    .from("programs")
    .select("id, slug")
    .or("slug.like.wudang-%,slug.like.mile-%")
  const programsByDest = { wudang: [], mile: [] }
  for (const p of progs) {
    if (p.slug.startsWith("wudang-")) programsByDest.wudang.push(p.id)
    else if (p.slug.startsWith("mile-")) programsByDest.mile.push(p.id)
  }
  console.log(`programs found: wudang=${programsByDest.wudang.length} mile=${programsByDest.mile.length}`)

  let svcOk = 0, svcFail = 0, linkOk = 0, linkFail = 0
  for (const s of SERVICES) {
    const { data: svcRow, error: svcErr } = await supabase
      .from("services")
      .insert({
        name: s.name,
        slug: s.slug,
        category: s.category,
        description: s.description,
        price_usd: s.price_usd,
        dit_commission_pct: 15,
        active: true,
      })
      .select("id")
      .single()
    if (svcErr) {
      console.error("service failed:", s.slug, svcErr.message)
      svcFail++
      continue
    }
    svcOk++
    if (s.destination) {
      const programIds = programsByDest[s.destination] ?? []
      for (const programId of programIds) {
        const { error: linkErr } = await supabase
          .from("program_services")
          .insert({ program_id: programId, service_id: svcRow.id, is_included: false })
        if (linkErr) { linkFail++ } else { linkOk++ }
      }
    }
  }
  console.log(`services: ${svcOk} ok, ${svcFail} failed. program_services links: ${linkOk} ok, ${linkFail} failed.`)

  let accOk = 0, accFail = 0
  for (const a of ACCOMMODATION) {
    const { error: accErr } = await supabase.from("accommodation_rates").insert({
      property_id: propertyId[a.property],
      room_type: a.room_type,
      capacity: a.capacity,
      has_pool: a.has_pool,
      price_thb_per_night: a.price, // storing USD/night value; column is THB-named but reused here
      description: a.description,
      active: true,
    })
    if (accErr) { console.error("accommodation failed:", a.room_type, accErr.message); accFail++ } else accOk++
  }
  console.log(`accommodation: ${accOk} ok, ${accFail} failed.`)
  console.log("done")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

