#!/usr/bin/env python3
# Run ON the main VPS from /opt/dit-platform:  python3 patch_guides_en.py
# Wave 1 EN guides under /medical/china/guides/: cost, how to arrange, how to choose, hospitals for international patients.
# Shared layout _guide.tsx; hub link block; sitemap + llms.txt. Confirmed data only (RMB source of truth, USD approx at 6.72).
import os, shutil, sys, time
ROOT = "/opt/dit-platform"
BK = "/tmp/guides_en_backup_" + time.strftime("%Y%m%d%H%M%S")
os.makedirs(BK, exist_ok=True)
GD = ROOT + "/src/app/(public)/medical/china/guides"

def wr(p, c):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "w", encoding="utf-8").write(c)

# ------------------------------------------------------------------ shared layout
wr(GD + "/_guide.tsx", r'''import Link from "next/link"
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
''')

def page(slug, title, desc, h1, crumb, intro, sections, faq, form, extra_import="", children=""):
    return r'''import GuideLayout, { guideMetadata, type GuideSection } from "../_guide"
%s
export const dynamic = "force-dynamic"

const SLUG = "%s"
const TITLE = "%s"
const DESC = "%s"
export const metadata = guideMetadata(SLUG, TITLE, DESC)

const SECTIONS: GuideSection[] = %s

const FAQ = %s

export default function Page() {
  return (
    <GuideLayout slug={SLUG} title={TITLE} desc={DESC} h1="%s" crumb="%s" intro="%s" sections={SECTIONS} faq={FAQ} formName="%s">
%s
    </GuideLayout>
  )
}
''' % (extra_import, slug, title, desc, sections, faq, h1, crumb, intro, form, children)

import json
def S(sections): return json.dumps(sections, ensure_ascii=False, indent=2)
def F(faq): return json.dumps([{"q": q, "a": a} for q, a in faq], ensure_ascii=False, indent=2)

PA = "Outpatient Fast-track: RMB 3,500 (approx. USD 521)"
PB = "Surgery Full-process: from RMB 18,000 (approx. USD 2,679)"
PROG_LINKS = [["Outpatient Fast-track (service fee)", "/programs/bm-package-a-outpatient-fast-track"], ["Surgery Full-process (service fee)", "/programs/bm-package-b-surgery-full-process"]]

# ------------------------------------------------------------------ 1 cost
cost_sections = [
 {"h": "What makes up the cost", "steps": [
   "Service fee.|| Dream Islands and Better Migrate arrange the treatment: hospital and specialist matching, appointments, bilingual accompaniment and case follow-up. Tariffs are fixed and stated in RMB.",
   "Hospital costs.|| Consultations, diagnostics, surgery, hospitalization and medication. They are paid separately and confirmed per case."]},
 {"h": "Service fees", "items": [
   "Outpatient Fast-track:|| RMB 3,500 (approx. USD 521). Specialist consultation or examination pathway without inpatient treatment.",
   "Surgery Full-process:|| from RMB 18,000 (approx. USD 2,679). Includes the basic package, specialist arrangement, pre-operative examination support, surgery scheduling, inpatient assistance, post-operative guidance and medication service support. Complex cases (oncology, neurosurgery, rare diseases) are arranged individually after case review."],
  "paras": ["Prices are in RMB, which is the source of truth. USD figures are approximate at a single rate of 6.72 RMB per USD."]},
 {"h": "What the service fee includes", "paras": ["A 30-minute online pre-consultation (a preliminary assessment and routing, not a second medical opinion), hospital, department and specialist matching, specialist appointment coordination, registration and identity verification, bilingual hospital accompaniment, support with payment, examinations and pharmacy, one complimentary citywide airport or railway station pickup, basic insurance communication and claim-document organization, and case follow-up. The exact scope is confirmed in your quotation."]},
 {"h": "What is paid separately", "items": [
   "Hospital and medical charges:|| consultations, diagnostics, surgery, medication.",
   "Travel:|| flights and accommodation.",
   "Visa fees."]},
 {"h": "Optional services and partner tariffs", "paras": ["The final amount is confirmed in your quotation."], "items": [
   "Additional airport or railway pickup:|| RMB 300 per trip.",
   "Hotel booking assistance near the hospital:|| RMB 100.",
   "Interpretation:|| RMB 200 per hour.",
   "Insurance claim document organization:|| RMB 300 per set.",
   "24-hour emergency medical access coordination:|| RMB 1,500 per time.",
   "Bilingual hospital accompaniment:|| outpatient visit up to 4 hours RMB 600, full day (8 hours) RMB 800, inpatient or surgery RMB 1,000 per day.",
   "Travel itinerary assistance:|| quoted on request."],
  "paras2": []},
 {"h": "What hospital costs depend on", "paras": ["Hospital charges depend on the hospital and department, the scope of examinations, the type of treatment or surgery, the length of hospitalization and medication. We do not publish general price lists without data for your case. An estimate for hospital costs is confirmed in your individual proposal."]},
 {"h": "How to get your total cost", "steps": [
   "Submit your case.|| Describe the situation in your own words. Please do not include passport details.",
   "Case review.|| Better Migrate coordinates your case and a suitable hospital is matched.",
   "Proposal.|| You receive the scope of service and the price.",
   "Confirmation.|| Booking and payment only after you agree to the scope and price. No payment is needed to submit a case."],
  "paras": ["For companies, official VAT invoices and corporate bank transfer are available."]},
 {"h": "Before you decide to travel", "paras": ["You can request a remote second opinion first: a suitable hospital in China reviews your documents directly."], "links": [["Remote second opinion", "/medical/china/guides/second-opinion-china"], ["How to arrange medical treatment in China", "/medical/china/guides/how-to-arrange-treatment-china"]]},
]
cost_faq = [
 ("How much does medical treatment in China cost for a foreign patient?", "Cost has two parts. The Dream Islands and Better Migrate service fee is RMB 3,500 (approx. USD 521) for an outpatient visit and from RMB 18,000 (approx. USD 2,679) for surgery coordination. Hospital charges are paid separately and depend on the case; an estimate is given after case review."),
 ("Are hospital charges included in the service fee?", "No. The service fee covers arrangement and accompaniment. Hospital charges are paid separately unless your individual proposal states otherwise."),
 ("Can I find out the cost before travelling?", "Yes. Submit your case and, after review, you receive an individual proposal with the scope of service and the price. Booking and payment follow only after your confirmation."),
 ("Do I pay when I submit a case?", "No. No payment is required to submit a case."),
 ("Which currency are prices in?", "Service prices are set in RMB. USD amounts are approximate at a single rate of 6.72 RMB per USD and may differ at the time of payment."),
 ("Why don't you publish prices for surgery and examinations?", "Hospital charges depend on the hospital, department, scope of examinations, type of treatment and length of stay. General figures without data for your case would be misleading, so they are given in your individual proposal."),
]

# ------------------------------------------------------------------ 2 arrange
arr_sections = [
 {"h": "Six steps", "steps": [
   "You submit your case.|| Describe the diagnosis or symptoms and what you need. Please do not include passport details.",
   "Better Migrate coordinates your case.|| Our partner receives the request from Dream Islands and prepares it for the hospital.",
   "A hospital reviews the case.|| A suitable hospital assesses your documents and whether it can see you.",
   "You receive a proposed plan.|| The scope of service, the price and the next steps.",
   "You confirm.|| Booking and payment of the service only after you agree to the scope and price.",
   "Treatment and accompaniment.|| Appointments, bilingual accompaniment at the hospital, examinations and, where needed, admission and surgery."]},
 {"h": "Who does what", "items": [
   "Dream Islands:|| receives your case and stays in touch with you.",
   "Better Migrate:|| coordinates the case with hospitals and arranges appointments and accompaniment.",
   "Hospital in China:|| reviews the case, makes the diagnosis and provides treatment.",
   "You:|| decide on treatment."]},
 {"h": "What to prepare", "paras": ["Discharge summaries, test and examination results, imaging descriptions, a list of current medication and a short history of the condition. Your set does not need to be perfect: we confirm what is missing after you submit the case, and we confirm how to send documents securely."]},
 {"h": "Cost", "paras": ["Service fees: outpatient visit RMB 3,500 (approx. USD 521), surgery coordination from RMB 18,000 (approx. USD 2,679). Hospital charges are paid separately and confirmed per case."], "links": [["Cost of medical treatment in China", "/medical/china/guides/cost-of-treatment-china"]]},
 {"h": "Visa and travel", "paras": ["Visa requirements depend on your citizenship and the purpose of the trip, and we clarify them during case review. Transfers, a hotel near the hospital and other details are agreed per case."]},
 {"h": "Before you travel", "paras": ["If you want a hospital's view first, you can request a remote second opinion."], "links": [["Remote second opinion", "/medical/china/guides/second-opinion-china"]]},
]
arr_faq = [
 ("Where do I start?", "With a case: briefly describe the diagnosis or symptoms and what you need (consultation, second opinion, examination or surgery). No payment is needed at this stage."),
 ("Who chooses the hospital and doctor?", "Dream Islands and Better Migrate coordinate the matching after case review, and the hospital reviews the case and confirms it can see you. Availability of a specific doctor is confirmed per case."),
 ("How long does it take to arrange?", "Timing depends on the case, the hospital and your documents, so we do not state it in advance. It is confirmed after we review your request."),
 ("Do I need to speak Chinese?", "No. Bilingual hospital accompaniment is part of the service."),
 ("Do I need a visa?", "Requirements depend on your citizenship and the purpose of the trip. We clarify them during case review."),
 ("Can I get a hospital's opinion remotely first?", "Yes. A remote second opinion is available: a suitable hospital in China reviews your documents directly. Timing, fee and format are confirmed per case."),
]

# ------------------------------------------------------------------ 3 choose
ch_sections = [
 {"h": "Criteria for choosing a hospital", "items": [
   "A profile that fits your case.|| A department and specialist who work with your diagnosis.",
   "The right format.|| A consultation, examination, outpatient treatment and surgery need different arrangements.",
   "Experience with international patients.|| Registration, communication and paperwork are easier where the hospital is used to foreign patients.",
   "Language.|| Bilingual accompaniment removes the barrier at appointments and examinations.",
   "City and logistics.|| Flights, accommodation near the hospital and length of stay.",
   "Cost transparency.|| It should be clear what is in the service fee and what is paid to the hospital separately.",
   "Doctor availability.|| Whether a specific specialist is available, and the nearest appointment, are confirmed per case."]},
 {"h": "How matching works with us", "paras": ["Dream Islands and Better Migrate do not choose a hospital from a general list. After you submit a case, the coordinators review it, match a hospital, department and specialist from the partner network and confirm the scope and price in an individual proposal."]},
 {"h": "What we do not do", "paras": ["We do not rank hospitals and we do not assign specialties to hospitals without confirmation. The hospitals in our network are listed here."], "links": [["Hospitals in China for international patients", "/medical/china/guides/hospitals-china-international-patients"]]},
 {"h": "If you need an assessment first", "paras": ["Request a remote second opinion: a suitable hospital in China reviews your documents directly, and you decide about travelling with that result."], "links": [["Remote second opinion", "/medical/china/guides/second-opinion-china"]]},
 {"h": "Service fees", "paras": ["Outpatient visit RMB 3,500 (approx. USD 521), surgery coordination from RMB 18,000 (approx. USD 2,679). Hospital charges are paid separately."], "links": [["Cost of medical treatment in China", "/medical/china/guides/cost-of-treatment-china"]]},
]
ch_faq = [
 ("How do I choose a hospital in China?", "Look at how well the hospital's profile fits your diagnosis, whether the needed specialist is available, experience with international patients, language support, logistics and cost transparency. Specific matching is done after case review."),
 ("Do you recommend a specific hospital in advance?", "No. A hospital, department and specialist are matched to your case. We do not assign specialties to hospitals without confirmation and we do not publish rankings."),
 ("Can I choose the hospital myself?", "Yes. Mention a preferred city or hospital in your case; availability of places and specialists is confirmed per case."),
 ("What if I am unsure about travelling at all?", "You can first request a remote second opinion: a suitable hospital in China reviews your documents directly, before you decide to travel."),
 ("Do you guarantee a treatment result?", "No. Diagnosis, treatment plan and results are determined by the hospital's physicians."),
]

# ------------------------------------------------------------------ 4 hospitals (children = list by city)
hos_sections = [
 {"h": "What counts as the best hospital for your case", "paras": ["It is the hospital that has the right department and specialist, works comfortably with international patients and offers clear timing and costs. The criteria are covered in our guide."], "links": [["How to choose a hospital in China", "/medical/china/guides/how-to-choose-hospital-china"]]},
]
hos_after = [
 {"h": "How to get an appointment", "paras": ["Submit your case. The process is described in our guide; service fees are in the cost guide, and hospital charges are paid separately."], "links": [["How to arrange medical treatment in China", "/medical/china/guides/how-to-arrange-treatment-china"], ["Cost of medical treatment in China", "/medical/china/guides/cost-of-treatment-china"], ["Remote second opinion", "/medical/china/guides/second-opinion-china"]]},
]
hos_faq = [
 ("Which hospital in China is the best for foreigners?", "There is no single best hospital: the suitable one depends on the diagnosis, the type of care and the city. We do not rank hospitals. A hospital, department and specialist are matched after we review your case."),
 ("How many hospitals are in the network?", "The Better Migrate network that Dream Islands works with has nine hospitals in Beijing, Shanghai, Xi'an, Chengdu and Guangzhou."),
 ("Can I go to a hospital without a coordinator?", "It is possible, but registration, appointments and language are harder for a foreign patient. With a coordinator the service includes matching, appointments and bilingual accompaniment."),
 ("Do I need to speak Chinese?", "No. Bilingual hospital accompaniment is part of the service."),
 ("How do I know whether a hospital fits my diagnosis?", "Submit your case. The coordinators confirm a suitable hospital, department and specialist for it."),
]

HOS_CHILD = r'''      <HospitalsByCity />
      {AFTER.map((s) => (
        <section key={s.h} style={{ marginBottom: 32 }}>
          <h2>{s.h}</h2>
          {s.paras.map((p) => <p key={p} style={{ lineHeight: 1.7, marginBottom: 12 }}>{p}</p>)}
          <ul style={{ lineHeight: 1.8, paddingLeft: 22 }}>{s.links.map(([n, h]) => <li key={h}><Link href={h}>{n}</Link></li>)}</ul>
        </section>
      ))}'''

def fix(sections):
    # normalise helper keys: "||" markers, drop unused "paras2"
    for s in sections:
        s.pop("paras2", None)
    return sections

files = {
 "cost-of-treatment-china": ("Cost of Medical Treatment in China", "What medical treatment in China costs for foreign patients: service fees from RMB 3,500, hospital charges separate. Confirmed RMB tariffs and how to get your total.", "How Much Does Medical Treatment in China Cost?", "Cost of treatment", "The cost of medical treatment in China for a foreign patient has two parts: the service that arranges it and the hospital's own charges. This guide explains what each part includes, which service tariffs are confirmed and how to get the total for your case.", cost_sections, cost_faq, "Cost of treatment in China - case review"),
 "how-to-arrange-treatment-china": ("How to Arrange Medical Treatment in China", "How to arrange medical treatment in China as a foreign patient: submit your case, coordination, hospital review, proposed plan and price, confirmation, treatment.", "How to Arrange Medical Treatment in China", "How to arrange treatment", "Arranging treatment in China on your own is hard: you need a suitable hospital, an appointment with a specialist, registration and examinations in another language. This is the process through a coordinator and what happens at each step.", arr_sections, arr_faq, "Arrange treatment in China - case review"),
 "how-to-choose-hospital-china": ("How to Choose a Hospital in China", "How to choose a hospital in China as an international patient: selection criteria and how matching works through case review.", "How to Choose a Hospital in China", "How to choose a hospital", "China has many strong hospitals, and the right choice depends less on a general ranking than on your diagnosis, the type of care and logistics. These are the criteria to use and how matching works through a coordinator.", ch_sections, ch_faq, "Hospital matching in China - case review"),
 "hospitals-china-international-patients": ("Hospitals in China for International Patients", "Best hospitals in China for international patients: nine hospitals in Beijing, Shanghai, Chengdu, Guangzhou and Xi'an in the Better Migrate network. Matched to your case.", "Hospitals in China for International Patients", "Hospitals for international patients", "If you are looking for the best hospitals in China, note that there is no single list of the best: the right hospital depends on the diagnosis and the type of care. These are the hospitals Dream Islands and Better Migrate arrange treatment with for international patients.", hos_sections, hos_faq, "Hospital matching in China - case review"),
}

for slug, (title, desc, h1, crumb, intro, secs, faq, form) in files.items():
    secs = fix(secs)
    if slug == "hospitals-china-international-patients":
        imports = 'import Link from "next/link"\nimport { MEDICAL_HOSPITALS } from "@/lib/medical-routes"\n'
        imports += r'''
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

const AFTER: { h: string; paras: string[]; links: [string, string][] }[] = %s

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
''' % json.dumps(hos_after, ensure_ascii=False)
        # place intro sections first, then list, then AFTER; sections go before children
        content = page(slug, title, desc, h1, crumb, intro, S(secs), F(faq), form, extra_import=imports, children=HOS_CHILD)
    else:
        content = page(slug, title, desc, h1, crumb, intro, S(secs), F(faq), form)
    wr(GD + "/" + slug + "/page.tsx", content)
    print("page written:", slug)

# ------------------------------------------------------------------ hub link block
hub = ROOT + "/src/app/(public)/medical/china/page.tsx"
shutil.copy(hub, BK + "/hub.tsx")
s = open(hub, encoding="utf-8").read()
if "how-to-arrange-treatment-china" not in s:
    anchor = "        <h2>Visa, documents and travel</h2>"
    if s.count(anchor) != 1:
        print("hub anchor fail"); sys.exit(1)
    block = ('        <h2>Guides</h2>\n        <ul style={{ lineHeight: 1.8, paddingLeft: 22, marginBottom: 32 }}>\n'
             '          <li><Link href="/medical/china/guides/cost-of-treatment-china">Cost of medical treatment in China</Link></li>\n'
             '          <li><Link href="/medical/china/guides/how-to-arrange-treatment-china">How to arrange medical treatment in China</Link></li>\n'
             '          <li><Link href="/medical/china/guides/how-to-choose-hospital-china">How to choose a hospital in China</Link></li>\n'
             '          <li><Link href="/medical/china/guides/hospitals-china-international-patients">Hospitals in China for international patients</Link></li>\n'
             '        </ul>\n\n')
    open(hub, "w", encoding="utf-8").write(s.replace(anchor, block + anchor))
    print("hub linked")

# ------------------------------------------------------------------ sitemap + llms
sm = ROOT + "/public/sitemap.xml"
shutil.copy(sm, BK + "/sitemap.xml")
t = open(sm, encoding="utf-8").read()
add = ""
for slug in files:
    loc = "https://dreamislands.org/medical/china/guides/" + slug
    if loc not in t:
        add += "  <url><loc>%s</loc><lastmod>2026-10-06</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>\n" % loc
if add:
    open(sm, "w", encoding="utf-8").write(t.replace("</urlset>", add + "</urlset>"))
    print("sitemap +%d" % add.count("<url>"))
ll = ROOT + "/public/llms.txt"
if os.path.exists(ll):
    u = open(ll, encoding="utf-8").read()
    add = ""
    for slug, v in files.items():
        if slug not in u:
            add += "- [%s](https://dreamislands.org/medical/china/guides/%s)\n" % (v[2], slug)
    if add:
        open(ll, "w", encoding="utf-8").write(u.rstrip("\n") + "\n" + add)
        print("llms.txt updated")
print("NEXT: npm run build && pm2 restart dit. Backup:", BK)
