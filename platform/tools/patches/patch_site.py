#!/usr/bin/env python3
# Patches dit-platform: SEO title/meta from translations, trimmed meta descriptions, YouTube "Watch" block + VideoObject,
# sitemap.xml and llms.txt additions. Makes backups in /tmp/*.yunnan.bak. Does NOT build or restart anything.
import os, re, shutil, json, urllib.request

ROOT = "/opt/dit-platform"
PROP = ROOT + "/src/app/(public)/properties/[slug]/page.tsx"
PROG = ROOT + "/src/app/(public)/programs/[slug]/page.tsx"
SITEMAP = ROOT + "/public/sitemap.xml"
LLMS = ROOT + "/public/llms.txt"

def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()

def write(p, s):
    with open(p, "w", encoding="utf-8") as f:
        f.write(s)

def backup(p):
    shutil.copy(p, "/tmp/" + os.path.basename(os.path.dirname(p)).replace("[", "").replace("]", "") + "_" + os.path.basename(p) + ".yunnan.bak")

def rep(s, old, new, label):
    n = s.count(old)
    if n != 1:
        raise SystemExit("ANCHOR PROBLEM (%s): found %d times" % (label, n))
    return s.replace(old, new)

HELPER = r'''
function trimMeta(input: string, max = 155): string {
  const t = input.replace(/\s+/g, " ").trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const i = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "))
  if (i > 80) return cut.slice(0, i + 1)
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "") + "..."
}
'''
IMPORT_LINE = 'import { dataLayerScript } from "../../_lib/track"'

# ---------- property page ----------
s = read(PROP)
if "trimMeta" in s:
    print("property page already patched, skipping")
else:
    backup(PROP)
    s = rep(s, IMPORT_LINE, IMPORT_LINE + "\n" + HELPER, "prop import")
    s = rep(s, '.select("name, island, country, description, image_url")',
               '.select("name, island, country, description, image_url, translations")', "prop meta select")
    s = rep(s,
        '  const title = location ? `${row.name.trim()} - ${location}` : row.name.trim()\n'
        '  const description = row.description ?? `${row.name.trim()}, a verified wellness property on Dream Islands.`\n',
        '  const trEn = (((data as any).translations?.en) ?? {}) as { seo_title?: string; meta_description?: string }\n'
        '  const seoTitle = trEn.seo_title ? String(trEn.seo_title).replace(/\\s*\\|\\s*Dream Islands\\s*$/i, "") : null\n'
        '  const title = seoTitle ?? (location ? `${row.name.trim()} - ${location}` : row.name.trim())\n'
        '  const description = trimMeta(trEn.meta_description ?? row.description ?? `${row.name.trim()}, a verified wellness property on Dream Islands.`)\n',
        "prop title/description")
    s = rep(s, '.select("id, name, slug, island, country, cohort_tags, certified, description, image_url, contact_wa, active")',
               '.select("id, name, slug, island, country, cohort_tags, certified, description, image_url, contact_wa, active, translations")',
               "prop main select")
    s = rep(s, '  const propertyJsonLd = {',
        '  const videos: { youtube_id: string; title_en?: string }[] = Array.isArray((property as any).translations?.videos)\n'
        '    ? (property as any).translations.videos\n'
        '    : []\n\n'
        '  const propertyJsonLd = {', "prop videos const")
    s = rep(s,
        '      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(propertyJsonLd) }} />\n',
        '      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(propertyJsonLd) }} />\n'
        '      {videos.map((v) => (\n'
        '        <script\n'
        '          key={"vo-" + v.youtube_id}\n'
        '          type="application/ld+json"\n'
        '          dangerouslySetInnerHTML={{\n'
        '            __html: JSON.stringify({\n'
        '              "@context": "https://schema.org",\n'
        '              "@type": "VideoObject",\n'
        '              name: `${v.title_en ?? property.name.trim()} | ${property.name.trim()}`,\n'
        '              description: `${v.title_en ?? "Video"} at ${property.name.trim()}${property.island ? ", " + property.island : ""}${property.country ? ", " + property.country : ""}.`,\n'
        '              thumbnailUrl: [`https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg`],\n'
        '              uploadDate: "2026-10-06T00:00:00+00:00",\n'
        '              contentUrl: `https://youtu.be/${v.youtube_id}`,\n'
        '              embedUrl: `https://www.youtube.com/embed/${v.youtube_id}`,\n'
        '              publisher: { "@type": "Organization", name: "Dream Islands", url: "https://dreamislands.org" },\n'
        '            }),\n'
        '          }}\n'
        '        />\n'
        '      ))}\n', "prop videoobject")
    s = rep(s, '        <div className="section-head">\n',
        '        {videos.length > 0 && (\n'
        '          <div style={{ margin: "40px 0" }}>\n'
        '            <h2 style={{ fontSize: 22, marginBottom: 16 }}>Watch</h2>\n'
        '            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>\n'
        '              {videos.map((v) => (\n'
        '                <div key={v.youtube_id}>\n'
        '                  <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: 14 }}>\n'
        '                    <iframe\n'
        '                      src={`https://www.youtube.com/embed/${v.youtube_id}`}\n'
        '                      title={v.title_en ?? property.name.trim()}\n'
        '                      loading="lazy"\n'
        '                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}\n'
        '                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"\n'
        '                      allowFullScreen\n'
        '                    />\n'
        '                  </div>\n'
        '                  <div style={{ fontSize: 14, marginTop: 8 }}>{v.title_en}</div>\n'
        '                </div>\n'
        '              ))}\n'
        '            </div>\n'
        '          </div>\n'
        '        )}\n\n'
        '        <div className="section-head">\n', "prop watch block")
    write(PROP, s)
    print("property page patched")

# ---------- program page ----------
s = read(PROG)
if "trimMeta" in s:
    print("program page already patched, skipping")
else:
    backup(PROG)
    s = rep(s, IMPORT_LINE, IMPORT_LINE + "\n" + HELPER, "prog import")
    s = rep(s, '.select("name, summary, hero_image_url, program_properties(properties(island, country))")',
               '.select("name, summary, hero_image_url, translations, program_properties(properties(island, country))")', "prog select")
    s = rep(s,
        '  const title = locationLabel ? `${row.name} - ${locationLabel}` : row.name\n'
        '  const description = row.summary ?? `${row.name}, a wellness program offered through Dream Islands.`\n',
        '  const trEn = (((data as any).translations?.en) ?? {}) as { seo_title?: string; meta_description?: string }\n'
        '  const seoTitle = trEn.seo_title ? String(trEn.seo_title).replace(/\\s*\\|\\s*Dream Islands\\s*$/i, "") : null\n'
        '  const title = seoTitle ?? (locationLabel ? `${row.name} - ${locationLabel}` : row.name)\n'
        '  const description = trimMeta(trEn.meta_description ?? row.summary ?? `${row.name}, a wellness program offered through Dream Islands.`)\n',
        "prog title/description")
    write(PROG, s)
    print("program page patched")

# ---------- sitemap.xml + llms.txt ----------
env = read(ROOT + "/.env.local")
def envval(pat):
    m = re.search(r"^(" + pat + r")=(.*)$", env, re.M)
    return m.group(2).strip().strip('"').strip("'") if m else None
url = envval(r"NEXT_PUBLIC_SUPABASE_URL") or "https://xbzrtofanbrahasxbisf.supabase.co"
key = envval(r"[A-Z_]*SERVICE_ROLE[A-Z_]*")
def fetch(path):
    req = urllib.request.Request(url + "/rest/v1/" + path, headers={"apikey": key, "Authorization": "Bearer " + key})
    return json.loads(urllib.request.urlopen(req, timeout=30).read().decode())

props = [r["slug"] for r in fetch("properties?select=slug&active=eq.true")]
progs = [r["slug"] for r in fetch("programs?select=slug&active=eq.true&status=eq.published")]
skip = {"tanya-core", "bunya-clinic", "tanya-wellbeing"}
sm = read(SITEMAP)
backup(SITEMAP)
add = []
for slug in props:
    loc = "https://dreamislands.org/properties/" + slug
    if slug not in skip and loc not in sm:
        add.append("  <url><loc>%s</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>" % loc)
for slug in progs:
    loc = "https://dreamislands.org/programs/" + slug
    if loc not in sm:
        add.append("  <url><loc>%s</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>" % loc)
if add:
    sm = sm.replace("</urlset>", "\n".join(add) + "\n</urlset>")
    write(SITEMAP, sm)
print("sitemap: added %d urls" % len(add))

ll = read(LLMS)
if "## China wellness destinations" in ll:
    print("llms.txt already has China section")
else:
    backup(LLMS)
    section = """
## China wellness destinations
- [Mile Wellness Resort, Mile, Yunnan](https://dreamislands.org/properties/mile-wellness-resort) - forest hot springs and 3-7 day wellness programs
- [Pu'er Forest Wellness Base, Yunnan](https://dreamislands.org/properties/puer-forest-wellness-base) - forest and tea-culture base, 3-5 day stays
- [Wyndham Jinghong Resort, Xishuangbanna](https://dreamislands.org/properties/xishuangbanna-jinghong-resort) - resort with open-air hot springs, tropical gardens and Dai culture
- [Pu'er Forest & Tea Culture Wellness](https://dreamislands.org/programs/puer-forest-tea-wellness)
- [Xishuangbanna Hot Springs & Dai Culture Wellness](https://dreamislands.org/programs/xishuangbanna-hotsprings-dai-wellness)
- [Pu'er & Xishuangbanna Combined Wellness Journey](https://dreamislands.org/programs/puer-xishuangbanna-combined-journey)
- [Huizhou TCM workshop](https://dreamislands.org/properties/traditional-chinese-medicine-workshop-huizhou)
- [Better Migrate medical coordination, Xi'an](https://dreamislands.org/properties/better-migrate-medical-network)
"""
    marker = "## Flagship partner"
    if marker in ll:
        ll = ll.replace(marker, section.lstrip("\n") + "\n" + marker, 1)
    else:
        ll = ll.rstrip("\n") + "\n" + section
    write(LLMS, ll)
    print("llms.txt updated")
print("DONE. Next: cd /opt/dit-platform && rm -rf .next && npm run build   then   pm2 restart dit")
