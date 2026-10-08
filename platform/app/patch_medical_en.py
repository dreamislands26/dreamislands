#!/usr/bin/env python3
# Run ON the main VPS from /opt/dit-platform:  python3 patch_medical_en.py
# Adds EN medical architecture WITHOUT redirects (redirects = patch_medical_redirects.py, run after verification):
#   src/lib/medical-routes.ts                         slug map
#   (public)/properties/[slug]/page.tsx               canonical/og/JSON-LD -> new URL for the 9 hospitals; Hospital/Organization type
#   (public)/medical/china/hospitals/[slug]/page.tsx  wrapper over the property page
#   (public)/medical/china/page.tsx                   EN hub
#   src/proxy.ts                                      allow /medical
#   public/sitemap.xml, public/llms.txt               new URLs
import os, shutil, sys, time
ROOT = "/opt/dit-platform"
SRC = ROOT + "/src"
BK = "/tmp/medical_en_backup_" + time.strftime("%Y%m%d%H%M%S")
os.makedirs(BK, exist_ok=True)

def rd(p): return open(p, encoding="utf-8").read()
def wr(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "w", encoding="utf-8").write(s)
def bk(p):
    if os.path.exists(p): shutil.copy(p, BK + "/" + p.replace("/", "__"))
def rep(s, old, new, count=1, name=""):
    n = s.count(old)
    if n != count:
        print("ANCHOR FAIL (%s): expected %d, found %d" % (name or old[:50], count, n)); sys.exit(1)
    return s.replace(old, new)

# 1) slug map
wr(SRC + "/lib/medical-routes.ts", r'''export const MEDICAL_SITE = "https://dreamislands.org"

export type MedicalHospital = { en: string; db: string; city: string }

// en = canonical slug in /medical/china/hospitals/<en>; db = properties.slug
export const MEDICAL_HOSPITALS: MedicalHospital[] = [
  { en: "peking-union-medical-college-hospital", db: "peking-union-medical-college-hospital", city: "Beijing" },
  { en: "fudan-zhongshan-hospital", db: "fudan-zhongshan-hospital", city: "Shanghai" },
  { en: "ruijin-hospital", db: "shanghai-jiaotong-ruijin-hospital", city: "Shanghai" },
  { en: "xian-international-medical-center", db: "xian-international-medical-center", city: "Xi'an" },
  { en: "shanghai-jiahui-international-hospital", db: "shanghai-jiahui-international-hospital", city: "Shanghai" },
  { en: "peking-university-first-hospital", db: "peking-university-first-hospital", city: "Beijing" },
  { en: "peking-university-international-hospital", db: "peking-university-international-hospital", city: "Beijing" },
  { en: "west-china-hospital", db: "sichuan-university-west-china-hospital", city: "Chengdu" },
  { en: "sun-yat-sen-university-hospital", db: "sun-yat-sen-university-affiliated-hospital", city: "Guangzhou" },
]

export function dbSlugForEn(en: string): string | null {
  return MEDICAL_HOSPITALS.find((h) => h.en === en)?.db ?? null
}

// Canonical path for a property slug (new medical URL for the 9 hospitals, /properties/<slug> otherwise)
export function canonicalPathForDbSlug(db: string): string {
  const h = MEDICAL_HOSPITALS.find((x) => x.db === db)
  return h ? "/medical/china/hospitals/" + h.en : "/properties/" + db
}
''')

# 2) property page
pp = SRC + "/app/(public)/properties/[slug]/page.tsx"
bk(pp)
s = rd(pp)
if "medical-routes" in s:
    print("property page already patched")
else:
    s = rep(s, 'import { dataLayerScript } from "../../_lib/track"\n',
            'import { dataLayerScript } from "../../_lib/track"\nimport { canonicalPathForDbSlug, MEDICAL_SITE } from "@/lib/medical-routes"\n', name="import")
    s = rep(s, "alternates: { canonical: `/properties/${slug}` },",
            "alternates: { canonical: canonicalPathForDbSlug(slug) },", name="canonical")
    s = rep(s, "url: `https://dreamislands.org/properties/${slug}`,",
            "url: `${MEDICAL_SITE}${canonicalPathForDbSlug(slug)}`,", name="og url")
    s = rep(s, "  const propertyJsonLd = {\n",
            "  const jsonLdType = (property as any).entity_type === \"hospital_clinic\" ? \"Hospital\" : (property as any).entity_type === \"network_coordinator\" ? \"Organization\" : \"LodgingBusiness\"\n  const propertyJsonLd = {\n", name="jsonld pre")
    s = rep(s, '"@type": "LodgingBusiness",', '"@type": jsonLdType,', name="jsonld type")
    s = rep(s, "url: `https://dreamislands.org/properties/${property.slug}`,",
            "url: `${MEDICAL_SITE}${canonicalPathForDbSlug(property.slug)}`,", name="jsonld url")
    wr(pp, s)
    print("property page patched")

# 3) wrapper
wr(SRC + "/app/(public)/medical/china/hospitals/[slug]/page.tsx", r'''import { notFound } from "next/navigation"
import type { Metadata } from "next"
import PropertyDetailPage, { generateMetadata as propertyMetadata } from "@/app/(public)/properties/[slug]/page"
import { dbSlugForEn } from "@/lib/medical-routes"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const db = dbSlugForEn(slug)
  if (!db) return { title: "Hospital not found" }
  return propertyMetadata({ params: Promise.resolve({ slug: db }) })
}

export default async function MedicalHospitalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = dbSlugForEn(slug)
  if (!db) notFound()
  return PropertyDetailPage({ params: Promise.resolve({ slug: db }) })
}
''')

# 4) hub
wr(SRC + "/app/(public)/medical/china/page.tsx", r'''import Image from "next/image"
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
  { q: "Can I get a second opinion before travelling?", a: "Submit your case. The review determines which format is suitable for your situation." },
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
            <p style={{ margin: 0, lineHeight: 1.6 }}>Specialist consultation, examination pathway or second opinion without inpatient treatment.</p>
          </Link>
          <Link href="/programs/bm-package-b-surgery-full-process" style={{ border: "1px solid rgba(128,128,128,.35)", borderRadius: 12, padding: 20, textDecoration: "none", color: "inherit" }}>
            <h3 style={{ marginTop: 0 }}>Surgery Full-process Service</h3>
            <p style={{ fontSize: 18, margin: "4px 0 10px" }}>From RMB 18,000 (from approx. USD 2,679)</p>
            <p style={{ margin: 0, lineHeight: 1.6 }}>Specialist arrangement, pre-operative examinations, scheduling, admission, inpatient support and post-operative communication. Oncology, neurosurgery, rare-disease and complex cases are arranged as individual plans.</p>
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
          Included in the service fee: appointment coordination, bilingual accompaniment, registration and identity verification, check-in and triage guidance,
          examination coordination, case follow-up. Not included: hospital and medical charges, medication, flights, visa fees, hotel (hotel booking assistance is an add-on).
        </p>

        <h2>Optional services, quoted per case</h2>
        <p style={{ lineHeight: 1.7 }}>
          Interpreter, airport pickup, hotel near the hospital, insurance-document support, 24h emergency access coordination, named specialist appointment, report translation.
        </p>

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
''')
print("hub + wrapper written")

# 5) proxy: allow /medical on public host
px = SRC + "/proxy.ts"
bk(px)
s = rd(px)
if '"/medical"' in s:
    print("proxy already patched")
else:
    s = rep(s, '  "/destinations",\n]', '  "/destinations",\n  "/medical",\n]', count=2, name="proxy lists")
    wr(px, s)
    print("proxy patched")

# 6) sitemap + llms
sm = ROOT + "/public/sitemap.xml"
bk(sm)
s = rd(sm)
urls = [MEDICAL for MEDICAL in ["/medical/china"] + ["/medical/china/hospitals/" + x for x in [
    "peking-union-medical-college-hospital", "fudan-zhongshan-hospital", "ruijin-hospital", "xian-international-medical-center",
    "shanghai-jiahui-international-hospital", "peking-university-first-hospital", "peking-university-international-hospital",
    "west-china-hospital", "sun-yat-sen-university-hospital"]]]
add = ""
for u in urls:
    loc = "https://dreamislands.org" + u
    if loc not in s:
        add += "  <url><loc>%s</loc><lastmod>2026-10-06</lastmod><changefreq>monthly</changefreq><priority>%s</priority></url>\n" % (loc, "0.9" if u == "/medical/china" else "0.8")
if add:
    s = rep(s, "</urlset>", add + "</urlset>", name="sitemap")
    wr(sm, s)
print("sitemap +%d" % add.count("<url>"))

ll = ROOT + "/public/llms.txt"
if os.path.exists(ll):
    bk(ll)
    s = rd(ll)
    if "/medical/china" not in s:
        block = "\n## Medical tourism in China\n- [Medical Tours to China for International Patients](https://dreamislands.org/medical/china): hospital and specialist matching, bilingual support, surgery coordination; service fees from RMB 3,500\n"
        for u in urls[1:]:
            block += "- [%s](https://dreamislands.org%s)\n" % (u.rsplit("/", 1)[1].replace("-", " ").title(), u)
        wr(ll, s.rstrip("\n") + "\n" + block)
        print("llms.txt updated")
print("BACKUPS in", BK)
print("NEXT: npm run build && pm2 restart dit")
