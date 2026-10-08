#!/usr/bin/env python3
"""Stage 1 patcher for /opt/dit-platform (global Next.js).
  python3 apply_stage1.py --dry                  -> patches a temp copy, writes /tmp/stage1.diff, prints per-file report
  python3 apply_stage1.py --apply                -> patches the real tree (deploy_stage1.sh calls this after backup)
Every anchor is exact-match; a missing anchor is reported as MISSING and nothing is half-applied silently.
"""
import os, re, sys, shutil, subprocess, glob

REAL = "/opt/dit-platform"
PACK = os.path.dirname(os.path.abspath(__file__))
DRY = "--dry" in sys.argv
ROOT = "/tmp/stage1_work" if DRY else REAL
if DRY:
    shutil.rmtree(ROOT, ignore_errors=True)
    os.makedirs(ROOT)
    shutil.copytree(REAL + "/src", ROOT + "/src")
    os.makedirs(ROOT + "/public")
    shutil.copy(REAL + "/public/sitemap.xml", ROOT + "/public/sitemap.xml")
    shutil.copytree(REAL + "/src", "/tmp/stage1_orig_src", dirs_exist_ok=True) if not os.path.exists("/tmp/stage1_orig_src") else None
    shutil.rmtree("/tmp/stage1_orig_src"); shutil.copytree(REAL + "/src", "/tmp/stage1_orig_src")

report, problems = [], []
PUB = ROOT + "/src/app/(public)"

def rd(p):
    s = open(p, encoding="utf-8").read()
    crlf = "\r\n" in s
    return s.replace("\r\n", "\n"), crlf
def wr(p, s, crlf):
    if crlf: s = s.replace("\n", "\r\n")
    open(p, "w", encoding="utf-8", newline="").write(s)
def rep(path, old, new, label, count=1):
    s, crlf = rd(path)
    if old not in s:
        problems.append("MISSING anchor [%s] in %s" % (label, os.path.relpath(path, ROOT))); return False
    s = s.replace(old, new, count)
    wr(path, s, crlf); report.append("ok  %s  (%s)" % (label, os.path.relpath(path, ROOT))); return True

# ---- 1. new files
for rel in ["src/lib/supabase-public.ts", "src/lib/stats.ts", "src/lib/hero.ts", "src/app/sitemap.ts",
            "src/app/(public)/_lib/programMappingResolved.ts"]:
    dst = ROOT + "/" + rel
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy(PACK + "/" + rel, dst); report.append("new " + rel)

# ---- 2. sitemap-static.ts from the current static sitemap (non-entity pages only)
x = open(REAL + "/public/sitemap.xml", encoding="utf-8").read()
lines = ['// Generated from the previous static sitemap. Only non-entity pages; entity URLs come from Supabase (sitemap.ts).',
         'export const STATIC_ROUTES: Array<{ path: string; changefreq: "weekly" | "monthly"; priority: number }> = [']
n_static = 0
for m in re.finditer(r"<url>\s*<loc>https://dreamislands\.org([^<]*)</loc>(.*?)</url>", x, re.S):
    path, rest = m.group(1) or "/", m.group(2)
    if re.match(r"^/(programs|properties)/[^/]+$", path) or re.match(r"^/destinations/[^/]+$", path) or re.match(r"^/medical/china/hospitals/[^/]+$", path):
        continue
    cf = re.search(r"<changefreq>(\w+)</changefreq>", rest); pr = re.search(r"<priority>([\d.]+)</priority>", rest)
    cf = cf.group(1) if cf and cf.group(1) in ("weekly", "monthly") else "monthly"
    lines.append('  { path: "%s", changefreq: "%s", priority: %s },' % (path, cf, pr.group(1) if pr else "0.5")); n_static += 1
lines.append("]"); open(ROOT + "/src/app/sitemap-static.ts", "w", encoding="utf-8").write("\n".join(lines) + "\n")
report.append("new src/app/sitemap-static.ts (%d static routes)" % n_static)

# ---- 3. programMapping.ts: heroSource on LandingProgram
rep(PUB + "/_lib/programMapping.ts",
    "  hero_image_url: string | null\n  contact_wa: string | null\n}",
    '  hero_image_url: string | null\n  heroSource?: "own" | "property" | "destination" | "global"\n  contact_wa: string | null\n}',
    "LandingProgram.heroSource")

# ---- 4. home page.tsx: resolved mapping + stats
hp = PUB + "/page.tsx"
rep(hp, 'import HomeView from "./_components/HomeView"',
    'import HomeView from "./_components/HomeView"\nimport { getCatalogStats } from "@/lib/stats"', "home import stats")
rep(hp, "  return <HomeView programs={programs} reviews={(reviewRows ?? []) as Review[]} />",
    "  const stats = await getCatalogStats()\n  return <HomeView programs={programs} reviews={(reviewRows ?? []) as Review[]} stats={stats} />", "home pass stats")

# ---- 5. HomeView.tsx: counters from stats
hv = PUB + "/_components/HomeView.tsx"
rep(hv, '''// Program count is filled in from the live list at render time so it always
// matches the "Explore all N programs" button (was a hardcoded 54 vs 62).
const TRACTION_STATS = [
  { n: "300+", sub: "guests hosted" },
  { n: "{programs}", sub: "standardized programs" },
  { n: "17", sub: "partner destinations" },
  { n: "7", sub: "Asian markets" },
  { n: "3,000+", sub: "community" },
  { n: "70+", sub: "travel partners" },
] as const
''', "// Homepage counters come from getCatalogStats() (Supabase). No hardcoded inventory or marketing claims.\n", "HomeView drop TRACTION_STATS")
rep(hv, '''const CHINA_STATS = [
  { n: "3", sub: "wellness destinations" },
  { n: "9", sub: "partner hospitals" },
  { n: "17", sub: "China programs" },
] as const
''', "", "HomeView drop CHINA_STATS")
rep(hv, 'import OutcomeSignature from "./journey/OutcomeSignature"',
    'import OutcomeSignature from "./journey/OutcomeSignature"\nimport type { CatalogStats } from "@/lib/stats"', "HomeView import type")
rep(hv, "export default async function HomeView({ programs, reviews }: { programs: LandingProgram[]; reviews: Review[] }) {",
    '''export default async function HomeView({ programs, reviews, stats }: { programs: LandingProgram[]; reviews: Review[]; stats: CatalogStats }) {
  const TRACTION_STATS = [
    { n: String(stats.programs), sub: "standardized programs" },
    { n: String(stats.countries), sub: "Asian markets" },
    { n: String(stats.properties), sub: "wellness properties" },
    { n: String(stats.clinics), sub: "partner hospitals" },
  ]
  const CHINA_STATS = [
    { n: String(stats.china.wellnessDestinations), sub: "wellness destinations" },
    { n: String(stats.china.clinics), sub: "partner hospitals" },
    { n: String(stats.china.programs), sub: "China programs" },
  ]''', "HomeView signature + stats")
rep(hv, '{s.n === "{programs}" ? programs.length : s.n}', "{s.n}", "HomeView traction value")

# ---- 6. codemod: every .map(mapProgram) -> await mapProgramsResolved(...)
pat = re.compile(r"\(\((\w+) \?\? \[\]\) as unknown as DbProgramRow\[\]\)\.map\(mapProgram\)")
imp = re.compile(r'import \{ mapProgram, type DbProgramRow \} from "([^"]+)/programMapping"')
changed, skipped = [], []
for f in glob.glob(PUB + "/**/*.tsx", recursive=True) + glob.glob(PUB + "/**/*.ts", recursive=True):
    if f.endswith("programMapping.ts") or f.endswith("programMappingResolved.ts"): continue
    s, crlf = rd(f)
    if "mapProgram" not in s: continue
    s2, n = pat.subn(lambda m: "await mapProgramsResolved((%s ?? []) as unknown as DbProgramRow[])" % m.group(1), s)
    if n == 0:
        skipped.append(os.path.relpath(f, ROOT)); continue
    m = imp.search(s2)
    if not m:
        problems.append("import form not matched in " + os.path.relpath(f, ROOT)); continue
    still = len(re.findall(r"\bmapProgram\b", s2)) - 1  # minus the import itself
    base = m.group(1)
    new_imp = ('import { mapProgram, type DbProgramRow } from "%s/programMapping"\n' % base if still > 0
               else 'import { type DbProgramRow } from "%s/programMapping"\n' % base)
    new_imp += 'import { mapProgramsResolved } from "%s/programMappingResolved"' % base
    s2 = imp.sub(lambda _: new_imp, s2, count=1)
    wr(f, s2, crlf); changed.append(os.path.relpath(f, ROOT))
report.append("codemod: %d files switched to mapProgramsResolved" % len(changed))
for c in changed: report.append("     " + c)
for sk in skipped: report.append("SKIPPED (non-standard mapProgram call, review manually): " + sk)

# ---- 6b. tanya-samui: filtered chain, same resolver
tp = PUB + "/tanya-samui/page.tsx"
s, crlf = rd(tp)
if "const programs = ((progRows ?? [])" in s and "as unknown as DbProgramRow[]).map(mapProgram)" in s:
    s = s.replace("const programs = ((progRows ?? [])", "const programs = await mapProgramsResolved((progRows ?? [])", 1)
    s = s.replace("as unknown as DbProgramRow[]).map(mapProgram)", "as unknown as DbProgramRow[])", 1)
    m = imp.search(s)
    if m:
        still = len(re.findall(r"\bmapProgram\b", s)) - 1
        base = m.group(1)
        new_imp = ('import { mapProgram, type DbProgramRow } from "%s/programMapping"\n' % base if still > 0
                   else 'import { type DbProgramRow } from "%s/programMapping"\n' % base)
        new_imp += 'import { mapProgramsResolved } from "%s/programMappingResolved"' % base
        s = imp.sub(lambda _: new_imp, s, count=1); wr(tp, s, crlf); report.append("ok  tanya-samui switched to mapProgramsResolved")
    else:
        problems.append("tanya-samui import not matched")
else:
    problems.append("tanya-samui anchor not found")

# ---- 6c. program detail page (/programs/[slug]): hero, og:image, twitter image and JSON-LD all use the resolver
dp = PUB + "/programs/[slug]/page.tsx"
rep(dp, 'import { supabaseAdmin } from "@/lib/supabase-server"\n',
    'import { supabaseAdmin } from "@/lib/supabase-server"\nimport { resolveHeroes } from "../../_lib/programMappingResolved"\n', "detail import resolver")
rep(dp, '.select("name, summary, hero_image_url, translations, program_properties(properties(island, country))")',
    '.select("name, summary, hero_image_url, translations, program_properties(properties(id, island, country))")', "detail metadata select (+property id)")
rep(dp, "  const location = row.program_properties?.[0]?.properties\n",
    "  const [metaHero] = await resolveHeroes([row as any])\n  row.hero_image_url = metaHero.url\n  const location = row.program_properties?.[0]?.properties\n", "detail metadata hero")
rep(dp, "  const program = data as unknown as ProgramDetail\n",
    "  const program = data as unknown as ProgramDetail\n  const [pageHero] = await resolveHeroes([program as any])\n  program.hero_image_url = pageHero.url\n", "detail page hero")

# ---- 7. /programs JSON-LD uses the resolved hero
pp = PUB + "/programs/page.tsx"
rep(pp, "  const jsonLd =\n    (rows ?? []).length > 0",
    "  const heroBySlug = new Map(programs.map((p) => [p.slug, p.hero_image_url]))\n  const jsonLd =\n    (rows ?? []).length > 0", "programs jsonld heroBySlug")
rep(pp, "...(r.hero_image_url ? { image: r.hero_image_url } : {}),",
    "...(heroBySlug.get(r.slug) ? { image: heroBySlug.get(r.slug) } : {}),", "programs jsonld image")

# ---- 8. country page: existence/routing from destination_countries
cp = PUB + "/destinations/[country]/page.tsx"
rep(cp, 'import { COUNTRY_FLAGS, countryFromSlug } from "../../_lib/countries"',
    '''import { COUNTRY_FLAGS } from "../../_lib/countries"
import { supabasePublic } from "@/lib/supabase-public"

// destination_countries is the source of truth for which countries exist and for their slugs.
async function countryFromDb(slug: string): Promise<string | null> {
  const { data } = await supabasePublic
    .from("destination_countries")
    .select("country")
    .eq("slug", slug.toLowerCase())
    .eq("active", true)
    .maybeSingle()
  return (data?.country as string | undefined) ?? null
}''', "country import + countryFromDb")
rep(cp, "const country = countryFromSlug(slug)", "const country = await countryFromDb(slug)", "country lookup", count=2)

# ---- 9. proxy: /sitemap.xml must be reachable
px = ROOT + "/src/proxy.ts"
s, crlf = rd(px)
n = s.count('  "/medical",\n]')
if n >= 2:
    s = s.replace('  "/medical",\n]', '  "/medical",\n  "/sitemap.xml",\n]', 2); wr(px, s, crlf); report.append("ok  proxy: /sitemap.xml added to PUBLIC_PATHS and PUBLIC_HOST_ALLOWED")
else:
    problems.append("proxy anchor not found (%d)" % n)

# ---- 10. old static sitemap is removed (real run only; deploy script already saved the old URL list)
if not DRY:
    if os.path.exists(REAL + "/public/sitemap.xml"):
        os.remove(REAL + "/public/sitemap.xml"); report.append("removed public/sitemap.xml (served by src/app/sitemap.ts now)")
else:
    os.remove(ROOT + "/public/sitemap.xml"); report.append("(dry) public/sitemap.xml would be removed")

print("\n".join(report))
print("\n== PROBLEMS: %d" % len(problems))
for p in problems: print("  " + p)

if DRY:
    out = subprocess.run(["diff", "-ru", "/tmp/stage1_orig_src", ROOT + "/src"], capture_output=True, text=True).stdout
    open("/tmp/stage1.diff", "w", encoding="utf-8").write(out)
    print("\ndiff written: /tmp/stage1.diff (%d lines)" % out.count("\n"))
    print("\n== places that may still resolve hero outside mapProgram (not covered by the codemod):")
    subprocess.run("cd %s && grep -rnE 'hero_image_url|heroImage|hero_image' 'src/app/(public)/programs/[slug]' 'src/app/(public)/properties/[slug]' 'src/app/(public)/_components' 2>/dev/null | cut -c1-200 | head -40" % REAL, shell=True)
sys.exit(1 if problems else 0)
