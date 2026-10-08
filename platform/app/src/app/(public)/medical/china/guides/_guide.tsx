import Link from "next/link"
import type { Metadata } from "next"
import type { ReactNode } from "react"
import ReserveModal from "../../../_components/ReserveModal"
import { MEDICAL_SITE } from "@/lib/medical-routes"

const NETWORK_PROPERTY_ID = "be89f687-8dd8-49fb-bbdf-11de13935ae0"

export type GuideSection = {
  h: string
  paras?: string[]
  items?: string[] // "Lead||text" renders bold lead
  steps?: string[] // ordered, "Lead||text"
  links?: [string, string][]
}
export type Faq = { q: string; a: string }

export const GUIDE_LINKS: [string, string][] = [
  ["Cost of Medical Treatment in China", "/medical/china/guides/cost-of-treatment-china"],
  ["How to Arrange Medical Treatment in China", "/medical/china/guides/how-to-arrange-treatment-china"],
  ["How to Choose a Hospital in China", "/medical/china/guides/how-to-choose-hospital-china"],
  ["Hospitals in China for International Patients", "/medical/china/guides/hospitals-china-international-patients"],
  ["Remote second opinion", "/medical/china/guides/second-opinion-china"],
  ["Medical tourism in China: overview", "/medical/china"],
]

export const GUIDE_RU: Record<string, string> = {
  "cost-of-treatment-china": "https://dreamislands.ru/lechenie-v-kitae/gidy/stoimost-lecheniya-v-kitae/",
  "how-to-arrange-treatment-china": "https://dreamislands.ru/lechenie-v-kitae/gidy/kak-organizovat-lechenie-v-kitae/",
  "how-to-choose-hospital-china": "https://dreamislands.ru/lechenie-v-kitae/gidy/kak-vybrat-kliniku-v-kitae/",
  "hospitals-china-international-patients": "https://dreamislands.ru/lechenie-v-kitae/gidy/kliniki-kitaya-dlya-inostrantsev/",
}

export function guideMetadata(slug: string, title: string, desc: string): Metadata {
  const path = "/medical/china/guides/" + slug
  return {
    title,
    description: desc,
    alternates: { canonical: path, languages: { en: path, ru: GUIDE_RU[slug], "x-default": path } },
    openGraph: { title: title + " | Dream Islands", description: desc, url: MEDICAL_SITE + path, type: "article" },
  }
}

function lead(s: string) {
  const i = s.indexOf("||")
  if (i < 0) return <>{s}</>
  return <><strong>{s.slice(0, i)}</strong> {s.slice(i + 2)}</>
}

export default function GuideLayout(props: {
  slug: string
  title: string
  desc: string
  h1: string
  crumb: string
  intro: string
  sections: GuideSection[]
  faq: Faq[]
  formName: string
  children?: ReactNode
}) {
  const path = "/medical/china/guides/" + props.slug
  const ld = [
    { "@context": "https://schema.org", "@type": "WebPage", name: props.title, description: props.desc, url: MEDICAL_SITE + path, inLanguage: "en" },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: props.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: MEDICAL_SITE + "/" },
      { "@type": "ListItem", position: 2, name: "Medical tourism in China", item: MEDICAL_SITE + "/medical/china" },
      { "@type": "ListItem", position: 3, name: props.crumb, item: MEDICAL_SITE + path },
    ] },
  ]
  const modal = (
    <ReserveModal
      programs={[{
        id: "",
        name: props.formName,
        property_id: NETWORK_PROPERTY_ID,
        property_name: "Better Migrate Medical Network",
        destination_country: "China",
        case_mode: true,
      }]}
      triggerLabel="Submit Your Case"
      triggerClassName="btn btn-primary"
    />
  )
  const related = GUIDE_LINKS.filter(([, p]) => p !== path)
  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {ld.map((j, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(j) }} />
      ))}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px" }}>
        <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 8 }}><Link href="/medical/china">Medical tourism in China</Link> / {props.crumb}</p>
        <h1 style={{ marginBottom: 16 }}>{props.h1}</h1>
        <p style={{ fontSize: 18, lineHeight: 1.7, marginBottom: 24 }}>{props.intro}</p>
        <div style={{ marginBottom: 40 }}>{modal}</div>

        {props.sections.map((s) => (
          <section key={s.h} style={{ marginBottom: 32 }}>
            <h2>{s.h}</h2>
            {s.paras?.map((p) => <p key={p} style={{ lineHeight: 1.7, marginBottom: 12 }}>{p}</p>)}
            {s.steps && <ol style={{ lineHeight: 1.8, paddingLeft: 22 }}>{s.steps.map((x) => <li key={x}>{lead(x)}</li>)}</ol>}
            {s.items && <ul style={{ lineHeight: 1.8, paddingLeft: 22 }}>{s.items.map((x) => <li key={x}>{lead(x)}</li>)}</ul>}
            {s.links && <ul style={{ lineHeight: 1.8, paddingLeft: 22 }}>{s.links.map(([n, h]) => <li key={h}><Link href={h}>{n}</Link></li>)}</ul>}
          </section>
        ))}
        {props.children}

        <h2>Frequently asked questions</h2>
        <div style={{ marginBottom: 40 }}>
          {props.faq.map((f) => (
            <div key={f.q} style={{ borderBottom: "1px solid rgba(128,128,128,.25)", padding: "14px 0" }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{f.q}</div>
              <div style={{ lineHeight: 1.6 }}>{f.a}</div>
            </div>
          ))}
        </div>

        <h2>Related guides</h2>
        <ul style={{ lineHeight: 1.8, paddingLeft: 22, marginBottom: 32 }}>
          {related.map(([n, h]) => <li key={h}><Link href={h}>{n}</Link></li>)}
        </ul>

        <div style={{ marginBottom: 32 }}>{modal}</div>
        <p style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.6 }}>
          Dream Islands coordinates travel and does not provide medical services or act as a medical institution. Diagnosis and treatment are provided by licensed hospitals and physicians.
          This information is for reference only and is not medical advice. Treatment results are not guaranteed.
        </p>
      </div>
    </div>
  )
}
