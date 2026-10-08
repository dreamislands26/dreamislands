import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import ReserveModal from "../../_components/ReserveModal"
import { MEDICAL_HOSPITALS, MEDICAL_SITE } from "@/lib/medical-routes"

export const dynamic = "force-dynamic"

const NETWORK_PROPERTY_ID = "be89f687-8dd8-49fb-bbdf-11de13935ae0"
const PATH = "/medical/china"
const TITLE = "Medical Tourism in China for International Patients | Dream Islands"
const DESC = "Medical treatment in China for international patients: hospital and specialist matching, bilingual support, surgery coordination and clear service fees."

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: {
    canonical: PATH,
    languages: { en: PATH, ru: "https://dreamislands.ru/lechenie-v-kitae/", "x-default": PATH },
  },
  openGraph: { title: TITLE, description: DESC, url: MEDICAL_SITE + PATH, type: "website" },
}

const FAQ: { q: string; a: string }[] = [
  { q: "How much does a medical tour to China cost?", a: "Service fees start at RMB 3,500 (approx. USD 521) for outpatient coordination and from RMB 18,000 (approx. USD 2,679) for surgery coordination. Hospital charges are separate and depend on the case." },
  { q: "Do you provide treatment?", a: "No. Hospitals and physicians provide diagnosis and treatment; we coordinate the route." },
  { q: "Which hospitals can I be referred to?", a: "See the list on this page. The hospital is chosen after case review." },
  { q: "Do I need to speak Chinese?", a: "No. Bilingual accompaniment is part of the service." },
  { q: "Can I get a second opinion before travelling?", a: "Yes. A remote second opinion is available: your medical documents are reviewed directly by a suitable hospital in China, before you decide whether to travel. Dream Islands and Better Migrate coordinate the case and do not provide the medical opinion. Submit your case and we will confirm the next steps, including how to send your documents. Timing, fee and format of the response are confirmed per case." },
  { q: "Can you guarantee results?", a: "No. No cure, treatment success or clinical result is guaranteed." },
]

const STEPS = [
  "Submit your case: symptoms or diagnosis, and what you need (consultation, second opinion, examination, surgery).",
  "Case review: we match a hospital, department and specialist.",
  "Confirmed scope and price: a patient-specific quotation before any booking.",
  "Travel and appointments: documents, hotel near the hospital, airport pickup (confirmed per case).",
  "Bilingual accompaniment in hospital, examinations and, where needed, surgery and inpatient coordination.",
  "Post-treatment communication and documents for your insurer.",
]

export default async function MedicalChinaHub() {
  const dbSlugs = MEDICAL_HOSPITALS.map((h) => h.db)
  const { data } = await supabaseAdmin
    .from("properties")
    .select("slug, name, description, image_url")
    .in("slug", dbSlugs)
    .eq("active", true)
  const rows = (data ?? []) as unknown as { slug: string; name: string; description: string | null; image_url: string | null }[]
  const bySlug = new Map(rows.map((r) => [r.slug, r]))
  const cards = MEDICAL_HOSPITALS.map((h) => ({ h, row: bySlug.get(h.db) })).filter((x) => x.row)

  const ld = [
    { "@context": "https://schema.org", "@type": "WebPage", name: TITLE, description: DESC, url: MEDICAL_SITE + PATH, inLanguage: "en" },
    {
      "@context": "https://schema.org", "@type": "Service",
      name: "Medical treatment coordination in China for international patients",
      serviceType: "Medical coordination (not a medical service)", areaServed: "CN",
      provider: { "@type": "Organization", name: "Dream Islands Travel", url: MEDICAL_SITE },
      offers: [
        { "@type": "Offer", name: "Outpatient Fast-track Service", price: "3500", priceCurrency: "CNY" },
        { "@type": "Offer", name: "Surgery Full-process Service (from)", price: "18000", priceCurrency: "CNY" },
      ],
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: MEDICAL_SITE + "/" },
      { "@type": "ListItem", position: 2, name: "Medical tourism in China", item: MEDICAL_SITE + PATH },
    ] },
  ]

  const waHref = "https://wa.me/66811612662?text=" + encodeURIComponent("Hi! I'd like to ask about medical treatment in China.")

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {ld.map((j, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(j) }} />
      ))}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px" }}>
        <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 8 }}>Medical tourism · China</p>
        <h1 style={{ marginBottom: 16 }}>Medical Tours to China for International Patients</h1>
        <p style={{ fontSize: 18, lineHeight: 1.7, marginBottom: 24 }}>
          Dream Islands and Better Migrate coordinate medical care in China from first case review to follow-up: we match your case with a hospital,
          department and specialist, arrange appointments, accompany you in the hospital in two languages, and stay in touch after treatment.
          Diagnosis and treatment are delivered by licensed hospitals and physicians.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 48 }}>
          <ReserveModal
            programs={[{
              id: "",
              name: "Case review - medical tourism in China",
              property_id: NETWORK_PROPERTY_ID,
              property_name: "Better Migrate Medical Network",
              destination_country: "China",
              case_mode: true,
            }]}
            triggerLabel="Submit Your Case"
            triggerClassName="btn btn-primary"
          />
          <a href={waHref} className="btn" target="_blank" rel="noopener noreferrer">Ask a coordinator on WhatsApp</a>
        </div>

        <h2>How a medical tour to China works</h2>
        <ol style={{ lineHeight: 1.8, paddingLeft: 22, marginBottom: 40 }}>
          {STEPS.map((t) => <li key={t}>{t}</li>)}
        </ol>

        <h2>Two ways to start (service fees)</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, margin: "16px 0" }}>
          <Link href="/programs/bm-package-a-outpatient-fast-track" style={{ border: "1px solid rgba(128,128,128,.35)", borderRadius: 12, padding: 20, textDecoration: "none", color: "inherit" }}>
            <h3 style={{ marginTop: 0 }}>Outpatient Fast-track Service</h3>
            <p style={{ fontSize: 18, margin: "4px 0 10px" }}>RMB 3,500 per case (approx. USD 521)</p>
            <p style={{ margin: 0, lineHeight: 1.6 }}>Specialist consultation or examination pathway without inpatient treatment. Includes a 30-minute online pre-consultation (a preliminary assessment and routing, not a second medical opinion), hospital, department and specialist matching, bilingual hospital accompaniment, priority examination arrangement, one complimentary airport or railway station pickup and basic insurance document support.</p>
          </Link>
          <Link href="/programs/bm-package-b-surgery-full-process" style={{ border: "1px solid rgba(128,128,128,.35)", borderRadius: 12, padding: 20, textDecoration: "none", color: "inherit" }}>
            <h3 style={{ marginTop: 0 }}>Surgery Full-process Service</h3>
            <p style={{ fontSize: 18, margin: "4px 0 10px" }}>From RMB 18,000 (from approx. USD 2,679)</p>
            <p style={{ margin: 0, lineHeight: 1.6 }}>Includes the basic package, specialist arrangement, pre-operative examination support, surgery scheduling, inpatient assistance, post-operative guidance and medication service support. Oncology, neurosurgery, rare-disease and complex cases are arranged as individual plans.</p>
          </Link>
        </div>
        <p style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.6, marginBottom: 40 }}>
          Service and coordination fees only. Hospital consultations, diagnostics, surgery and medication are paid separately to the hospital unless a quotation states otherwise.
          RMB is the source price; USD is approximate at 6.72 RMB/USD. No clinical result is guaranteed.
        </p>

        <h2>Hospitals we coordinate with</h2>
        <p style={{ opacity: 0.8 }}>Descriptions are provided by the partner. The hospital is chosen after case review.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, margin: "16px 0 40px" }}>
          {cards.map(({ h, row }) => (
            <Link key={h.en} href={"/medical/china/hospitals/" + h.en} style={{ border: "1px solid rgba(128,128,128,.35)", borderRadius: 12, overflow: "hidden", textDecoration: "none", color: "inherit", display: "block" }}>
              {row!.image_url && (
                <Image src={row!.image_url} alt={row!.name.trim() + ", " + h.city} width={560} height={320} style={{ width: "100%", height: 160, objectFit: "cover" }} />
              )}
              <div style={{ padding: 16 }}>
                <h3 style={{ margin: "0 0 4px" }}>{row!.name.trim()}</h3>
                <p style={{ margin: "0 0 8px", fontSize: 13, opacity: 0.7 }}>{h.city}, China</p>
                {row!.description && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>{row!.description.length > 150 ? row!.description.slice(0, 150).replace(/\s+\S*$/, "") + "…" : row!.description}</p>}
              </div>
            </Link>
          ))}
        </div>

        <h2>What is included / not included</h2>
        <p style={{ lineHeight: 1.7 }}>
          Included in the service fee: 30-minute online pre-consultation (preliminary assessment and routing), hospital, department and specialist matching,
          specialist appointment coordination, registration and identity verification, bilingual hospital accompaniment, support with payment, examinations and pharmacy,
          one complimentary citywide airport or railway station pickup, basic insurance communication and claim-document organization, case follow-up.
          The exact scope is confirmed in your quotation. Not included: hospital and medical charges (consultations, diagnostics, surgery, medication), flights, visa fees, accommodation.
          For companies: official VAT invoices and corporate bank transfer.
        </p>

        <h2>Optional services and partner tariffs</h2>
        <p style={{ lineHeight: 1.7 }}>
          Partner tariffs; the final amount is confirmed in your quotation. Additional airport or railway pickup: RMB 300 per trip. Hotel booking assistance near the hospital: RMB 100.
          Interpretation: RMB 200 per hour. Insurance claim document organization: RMB 300 per set. 24-hour emergency medical access coordination: RMB 1,500 per time.
          Travel itinerary assistance: quoted on request. Bilingual hospital accompaniment: outpatient visit up to 4 hours RMB 600, full day (8 hours) RMB 800, inpatient or surgery RMB 1,000 per day.
        </p>

        <h2>Second opinion before you travel</h2>
        <p style={{ lineHeight: 1.7 }}>Your medical documents can be reviewed remotely, directly by a suitable hospital in China. <Link href="/medical/china/guides/second-opinion-china">How the remote second opinion works</Link>.</p>

        <h2>Guides</h2>
        <ul style={{ lineHeight: 1.8, paddingLeft: 22, marginBottom: 32 }}>
          <li><Link href="/medical/china/guides/cost-of-treatment-china">Cost of medical treatment in China</Link></li>
          <li><Link href="/medical/china/guides/how-to-arrange-treatment-china">How to arrange medical treatment in China</Link></li>
          <li><Link href="/medical/china/guides/how-to-choose-hospital-china">How to choose a hospital in China</Link></li>
          <li><Link href="/medical/china/guides/hospitals-china-international-patients">Hospitals in China for international patients</Link></li>
        </ul>

        <h2>Visa, documents and travel</h2>
        <p style={{ lineHeight: 1.7 }}>Requirements depend on nationality and purpose of travel and are confirmed per case during case review.</p>

        <h2>Frequently asked questions</h2>
        <div style={{ marginBottom: 40 }}>
          {FAQ.map((f) => (
            <div key={f.q} style={{ borderBottom: "1px solid rgba(128,128,128,.25)", padding: "14px 0" }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{f.q}</div>
              <div style={{ lineHeight: 1.6 }}>{f.a}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 32 }}>
          <ReserveModal
            programs={[{
              id: "",
              name: "Case review - medical tourism in China",
              property_id: NETWORK_PROPERTY_ID,
              property_name: "Better Migrate Medical Network",
              destination_country: "China",
              case_mode: true,
            }]}
            triggerLabel="Submit Your Case"
            triggerClassName="btn btn-primary"
          />
        </div>
        <p style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.6 }}>
          Dream Islands coordinates travel and does not provide medical services or act as a medical institution. Diagnosis and treatment are provided by licensed hospitals and physicians.
          This information is for reference only and is not medical advice.
        </p>
      </div>
    </div>
  )
}
