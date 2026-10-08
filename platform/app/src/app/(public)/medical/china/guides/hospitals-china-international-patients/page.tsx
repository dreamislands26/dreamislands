import GuideLayout, { guideMetadata, type GuideSection } from "../_guide"
import Link from "next/link"
import { MEDICAL_HOSPITALS } from "@/lib/medical-routes"

const NAMES: Record<string, string> = {
  "peking-union-medical-college-hospital": "Peking Union Medical College Hospital",
  "peking-university-first-hospital": "Peking University First Hospital",
  "peking-university-international-hospital": "Peking University International Hospital",
  "fudan-zhongshan-hospital": "Zhongshan Hospital, Fudan University",
  "ruijin-hospital": "Ruijin Hospital, Shanghai Jiao Tong University",
  "shanghai-jiahui-international-hospital": "Shanghai Jiahui International Hospital",
  "west-china-hospital": "West China Hospital, Sichuan University",
  "sun-yat-sen-university-hospital": "Sun Yat-sen University Affiliated Hospital",
  "xian-international-medical-center": "Xi'an International Medical Center",
}
const CITIES = ["Beijing", "Shanghai", "Chengdu", "Guangzhou", "Xi'an"]

const AFTER: { h: string; paras: string[]; links: [string, string][] }[] = [{"h": "How to get an appointment", "paras": ["Submit your case. The process is described in our guide; service fees are in the cost guide, and hospital charges are paid separately."], "links": [["How to arrange medical treatment in China", "/medical/china/guides/how-to-arrange-treatment-china"], ["Cost of medical treatment in China", "/medical/china/guides/cost-of-treatment-china"], ["Remote second opinion", "/medical/china/guides/second-opinion-china"]]}]

function HospitalsByCity() {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2>Hospitals in our network, by city</h2>
      <p style={{ lineHeight: 1.7, marginBottom: 12 }}>Nine hospitals in five cities. We do not rank them or assign specialties without confirmation: a specific hospital is matched after case review.</p>
      {CITIES.map((c) => (
        <div key={c}>
          <h3>{c}</h3>
          <ul style={{ lineHeight: 1.8, paddingLeft: 22 }}>
            {MEDICAL_HOSPITALS.filter((h) => h.city === c).map((h) => (
              <li key={h.en}><Link href={"/medical/china/hospitals/" + h.en}>{NAMES[h.en]}</Link></li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}

export const dynamic = "force-dynamic"

const SLUG = "hospitals-china-international-patients"
const TITLE = "Hospitals in China for International Patients"
const DESC = "Best hospitals in China for international patients: nine hospitals in Beijing, Shanghai, Chengdu, Guangzhou and Xi'an in the Better Migrate network. Matched to your case."
export const metadata = guideMetadata(SLUG, TITLE, DESC)

const SECTIONS: GuideSection[] = [
  {
    "h": "What counts as the best hospital for your case",
    "paras": [
      "It is the hospital that has the right department and specialist, works comfortably with international patients and offers clear timing and costs. The criteria are covered in our guide."
    ],
    "links": [
      [
        "How to choose a hospital in China",
        "/medical/china/guides/how-to-choose-hospital-china"
      ]
    ]
  }
]

const FAQ = [
  {
    "q": "Which hospital in China is the best for foreigners?",
    "a": "There is no single best hospital: the suitable one depends on the diagnosis, the type of care and the city. We do not rank hospitals. A hospital, department and specialist are matched after we review your case."
  },
  {
    "q": "How many hospitals are in the network?",
    "a": "The Better Migrate network that Dream Islands works with has nine hospitals in Beijing, Shanghai, Xi'an, Chengdu and Guangzhou."
  },
  {
    "q": "Can I go to a hospital without a coordinator?",
    "a": "It is possible, but registration, appointments and language are harder for a foreign patient. With a coordinator the service includes matching, appointments and bilingual accompaniment."
  },
  {
    "q": "Do I need to speak Chinese?",
    "a": "No. Bilingual hospital accompaniment is part of the service."
  },
  {
    "q": "How do I know whether a hospital fits my diagnosis?",
    "a": "Submit your case. The coordinators confirm a suitable hospital, department and specialist for it."
  }
]

export default function Page() {
  return (
    <GuideLayout slug={SLUG} title={TITLE} desc={DESC} h1="Hospitals in China for International Patients" crumb="Hospitals for international patients" intro="If you are looking for the best hospitals in China, note that there is no single list of the best: the right hospital depends on the diagnosis and the type of care. These are the hospitals Dream Islands and Better Migrate arrange treatment with for international patients." sections={SECTIONS} faq={FAQ} formName="Hospital matching in China - case review">
      <HospitalsByCity />
      {AFTER.map((s) => (
        <section key={s.h} style={{ marginBottom: 32 }}>
          <h2>{s.h}</h2>
          {s.paras.map((p) => <p key={p} style={{ lineHeight: 1.7, marginBottom: 12 }}>{p}</p>)}
          <ul style={{ lineHeight: 1.8, paddingLeft: 22 }}>{s.links.map(([n, h]) => <li key={h}><Link href={h}>{n}</Link></li>)}</ul>
        </section>
      ))}
    </GuideLayout>
  )
}
