import Link from "next/link"
import type { Metadata } from "next"
import ReserveModal from "../../../../_components/ReserveModal"
import { MEDICAL_SITE } from "@/lib/medical-routes"

export const dynamic = "force-dynamic"

const NETWORK_PROPERTY_ID = "be89f687-8dd8-49fb-bbdf-11de13935ae0"
const PATH = "/medical/china/guides/second-opinion-china"
const TITLE = "Remote Medical Second Opinion from Hospitals in China"
const DESC = "Submit your medical records for review directly by a participating hospital in China before deciding whether to travel for treatment."

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: {
    canonical: PATH,
    languages: { en: PATH, ru: "https://dreamislands.ru/lechenie-v-kitae/gidy/vtoroe-mnenie/", "x-default": PATH },
  },
  openGraph: { title: TITLE + " | Dream Islands", description: DESC, url: MEDICAL_SITE + PATH, type: "article" },
}

const FAQ: { q: string; a: string }[] = [
  { q: "Who reviews my medical documents?", a: "A suitable hospital in China reviews them directly. Dream Islands and Better Migrate coordinate the case and do not act as a medical expert." },
  { q: "How is this different from the 30-minute online pre-consultation?", a: "The pre-consultation is part of the service package and is a preliminary assessment of your needs and routing. It is not a second medical opinion. The second opinion comes from the hospital, based on your medical documents." },
  { q: "How much does a remote second opinion cost and how fast is the answer?", a: "The fee, timing and format of the response are confirmed per case after you submit your request. We do not state them in advance." },
  { q: "How do I send my documents?", a: "Submit your case and briefly describe it. Please do not include passport details in the form. We will confirm how to send your documents securely." },
  { q: "Do you guarantee a diagnosis or a result?", a: "No. Diagnosis, treatment plans and results are determined by the hospital's physicians. We do not promise a diagnosis, a named doctor's opinion or any treatment outcome." },
]

const STEPS = [
  ["You submit your case", "Describe the situation briefly and what you would like to receive."],
  ["Dream Islands and Better Migrate coordinate", "We confirm the next steps, including how to send your documents."],
  ["A hospital reviews your documents", "A suitable hospital in China reviews the case directly."],
  ["You receive the result and decide", "If treatment or travel makes sense, we arrange the next step through a patient-specific quotation."],
]

export default function SecondOpinionChina() {
  const ld = [
    { "@context": "https://schema.org", "@type": "WebPage", name: TITLE, description: DESC, url: MEDICAL_SITE + PATH, inLanguage: "en" },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: MEDICAL_SITE + "/" },
      { "@type": "ListItem", position: 2, name: "Medical tourism in China", item: MEDICAL_SITE + "/medical/china" },
      { "@type": "ListItem", position: 3, name: "Remote second opinion", item: MEDICAL_SITE + PATH },
    ] },
  ]
  const modal = (
    <ReserveModal
      programs={[{
        id: "",
        name: "Remote second opinion - case review",
        property_id: NETWORK_PROPERTY_ID,
        property_name: "Better Migrate Medical Network",
        destination_country: "China",
        case_mode: true,
      }]}
      triggerLabel="Submit Your Case"
      triggerClassName="btn btn-primary"
    />
  )
  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {ld.map((j, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(j) }} />
      ))}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px" }}>
        <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 8 }}><Link href="/medical/china">Medical tourism in China</Link> / Remote second opinion</p>
        <h1 style={{ marginBottom: 16 }}>Remote Medical Second Opinion from Hospitals in China</h1>
        <p style={{ fontSize: 18, lineHeight: 1.7, marginBottom: 24 }}>
          Submit your medical records for review directly by a participating hospital in China before deciding whether to travel for treatment.
          Dream Islands and Better Migrate coordinate the case; the hospital reviews it.
        </p>
        <div style={{ marginBottom: 40 }}>{modal}</div>

        <h2>How it works</h2>
        <ol style={{ lineHeight: 1.8, paddingLeft: 22, marginBottom: 32 }}>
          {STEPS.map(([a, b]) => <li key={a}><strong>{a}.</strong> {b}</li>)}
        </ol>

        <h2>Who does what</h2>
        <p style={{ lineHeight: 1.7, marginBottom: 32 }}>
          Dream Islands: receives your case. Better Migrate: coordinates and passes the case on. Hospital in China: reviews the medical case. You: receive the result and decide on further treatment.
        </p>

        <h2>What is confirmed per case</h2>
        <p style={{ lineHeight: 1.7, marginBottom: 32 }}>
          Timing, fee and format of the response are confirmed individually after you submit your request. We do not promise a diagnosis, the opinion of a specific doctor or any treatment result.
        </p>

        <h2>If you decide to travel</h2>
        <p style={{ lineHeight: 1.7, marginBottom: 32 }}>
          Service fees for arranging the visit: <Link href="/programs/bm-package-a-outpatient-fast-track">Outpatient Fast-track from RMB 3,500 (approx. USD 521)</Link> and{" "}
          <Link href="/programs/bm-package-b-surgery-full-process">Surgery Full-process from RMB 18,000 (from approx. USD 2,679)</Link>.
          Service fees only; hospital charges are paid separately.
        </p>

        <h2>Frequently asked questions</h2>
        <div style={{ marginBottom: 40 }}>
          {FAQ.map((f) => (
            <div key={f.q} style={{ borderBottom: "1px solid rgba(128,128,128,.25)", padding: "14px 0" }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{f.q}</div>
              <div style={{ lineHeight: 1.6 }}>{f.a}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 32 }}>{modal}</div>
        <p style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.6 }}>
          Dream Islands coordinates travel and does not provide medical services or act as a medical institution. Diagnosis and treatment are provided by licensed hospitals and physicians.
          This information is for reference only and is not medical advice.
        </p>
      </div>
    </div>
  )
}
