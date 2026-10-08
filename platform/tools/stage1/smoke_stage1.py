#!/usr/bin/env python3
"""Smoke test for Stage 1. Checks not only HTTP 200, but that counters / hero / URLs come from the new logic.
Usage: python3 smoke_stage1.py [port]    (run on the EN VPS, app already restarted)"""
import sys, re, json, os, urllib.request, urllib.parse, html

PORT = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("PORT", "3000")
BASE = "http://127.0.0.1:%s" % PORT
HOST = {"Host": "dreamislands.org", "User-Agent": "stage1-smoke"}
env = {}
for line in open("/opt/dit-platform/.env.local", encoding="utf-8", errors="ignore"):
    if "=" in line and not line.startswith("#"):
        k, v = line.strip().split("=", 1); env[k] = v.strip().strip('"').strip("'")
SB, KEY = env["NEXT_PUBLIC_SUPABASE_URL"], env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
fails = []

def get(path, host=HOST):
    req = urllib.request.Request(BASE + path, headers=host)
    try:
        r = urllib.request.urlopen(req, timeout=40); return r.status, r.read().decode("utf-8", "ignore")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "ignore")
def rest(q):
    req = urllib.request.Request(SB + "/rest/v1/" + q, headers={"apikey": KEY, "Authorization": "Bearer " + KEY})
    return json.load(urllib.request.urlopen(req, timeout=40))
def check(ok, msg):
    print(("PASS  " if ok else "FAIL  ") + msg)
    if not ok: fails.append(msg)

# ---- expected values straight from Supabase (anon / RLS)
progs = rest("programs?select=slug,hero_image_url,program_properties(property_id)&active=eq.true&status=eq.published&limit=1000")
props = rest("properties?select=id,slug,country,entity_type,image_url&active=eq.true&limit=1000")
media = rest("media_assets?select=property_id,public_url,asset_type&active=eq.true&limit=5000")
dest = rest("destination_countries?select=country,slug,hero_image_url,hero_is_neutral&active=eq.true")
wellness = [p for p in props if p["entity_type"] == "wellness_property"]
clinics = [p for p in props if p["entity_type"] == "hospital_clinic"]
exp = {"programs": len(progs), "countries": len({p["country"] for p in wellness if p["country"]}),
       "properties": len(wellness), "clinics": len(clinics)}
print("expected from DB:", exp)

# ---- pages
for path in ["/", "/programs", "/destinations/china", "/destinations/thailand", "/medical/china",
             "/programs/sanya-island-tcm-wellness", "/properties/sanya-coastal-wellness-resort", "/robots.txt"]:
    code, body = get(path); check(code == 200, "%s -> %s" % (path, code))
code, _ = get("/destinations/not-a-country"); check(code == 404, "/destinations/not-a-country -> %s (must be 404, routing from DB)" % code)
for d in dest:
    c, _ = get("/destinations/" + d["slug"]); check(c == 200, "/destinations/%s -> %s (slug from destination_countries)" % (d["slug"], c))

# ---- homepage counters come from the DB, marketing claims are gone
_, home = get("/")
txt = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", home))
for label, key in [("standardized programs", "programs"), ("Asian markets", "countries"),
                   ("wellness properties", "properties"), ("partner hospitals", "clinics")]:
    m = re.search(r"(\d+)\s+%s" % re.escape(label), txt)
    check(bool(m) and int(m.group(1)) == exp[key], "home counter '%s' = %s (expected %s)" % (label, m.group(1) if m else None, exp[key]))
for bad in ["300+", "3,000+", "70+", "17 partner destinations"]:
    check(bad not in txt, "home no longer contains hardcoded '%s'" % bad)

# ---- /programs: JSON-LD image vs. cross-property invariant
_, pg = get("/programs")
ld = []
for blk in re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', pg, re.S):
    try: ld.append(json.loads(html.unescape(blk)))
    except Exception: pass
items = [i for d in ld if d.get("@type") == "ItemList" for i in d["itemListElement"]]
photos = {}
for p in props:
    if p["image_url"]: photos.setdefault(p["id"], set()).add(p["image_url"])
for m in media:
    if m["public_url"] and m["asset_type"] in ("hero", "gallery"): photos.setdefault(m["property_id"], set()).add(m["public_url"])
neutral = {d["hero_image_url"] for d in dest if d.get("hero_is_neutral") and d["hero_image_url"]}
allowed_by_slug = {}
for g in progs:
    a = set(neutral)
    if g["hero_image_url"]: a.add(g["hero_image_url"])
    for pp in g["program_properties"] or []: a |= photos.get(pp["property_id"], set())
    allowed_by_slug[g["slug"]] = a
check(len(items) == exp["programs"], "/programs JSON-LD lists %d programs (expected %d)" % (len(items), exp["programs"]))
cross, fallback = [], 0
for it in items:
    slug = it["url"].rsplit("/", 1)[-1]; img = (it.get("item") or {}).get("image")
    if not img: continue
    if img not in allowed_by_slug.get(slug, set()): fallback += 1
    # anything that is a Supabase /properties/ photo but not linked to this program = cross-property
    if "/object/public/properties/" in img and img not in allowed_by_slug.get(slug, set()): cross.append(slug)
print("      programs showing global fallback image: %d" % fallback)
check(not cross, "Cross-property hero = %d %s" % (len(cross), cross[:5]))
check(any(n.split("/")[-1] in pg for n in neutral), "/programs renders a neutral destination hero")
sanya = [g for g in progs if g["slug"] == "sanya-island-tcm-wellness"]
sp = [i for i in items if i["url"].endswith("/sanya-island-tcm-wellness")]
check(bool(sp) and "sanya-ruijia-futai-hotel-hotel-03" in json.dumps(sp[0]), "Sanya program hero = its own property hero (ruijia hotel-03)")

# ---- program detail page uses the same resolver (og:image + hero), not only its own hero_image_url
for slug, must, must_not in [("why-nam-beach-meditation-reset-3d", "koh-samui-aerial-tropical-beach", "tanya-property-hero"),
                             ("sanya-island-tcm-wellness", "sanya-ruijia-futai-hotel-hotel-03", None)]:
    if not any(g["slug"] == slug for g in progs): continue
    c, pgd = get("/programs/" + slug)
    check(c == 200 and must in pgd, "program page %s uses resolved hero (%s)" % (slug, must))
    if must_not: check(must_not not in pgd, "program page %s has no cross-property image (%s)" % (slug, must_not))

# ---- sitemap
c, sm = get("/sitemap.xml"); check(c == 200 and "<urlset" in sm, "/sitemap.xml -> %s (single sitemap, from sitemap.ts)" % c)
locs = re.findall(r"<loc>([^<]+)</loc>", sm)
check(len(locs) == len(set(locs)), "sitemap has no duplicate URLs (%d urls)" % len(locs))
old = set(open("/root/sitemap_old_urls.txt").read().split()) if os.path.exists("/root/sitemap_old_urls.txt") else set()
new = set(locs)
if old:
    print("      removed vs old sitemap (%d): %s" % (len(old - new), sorted(old - new)[:25]))
    print("      added   vs old sitemap (%d): %s" % (len(new - old), sorted(new - old)[:25]))
else:
    print("      (no saved old sitemap URL list - comparing against the DB instead)")
for p in wellness:
    u = "https://dreamislands.org/properties/%s" % p["slug"]
    if u not in new: check(False, "sitemap has wellness property %s" % p["slug"])
for p in clinics:
    if p["country"] == "China":
        u = "https://dreamislands.org/medical/china/hospitals/%s" % p["slug"]
        if u not in new: check(False, "sitemap has China clinic %s" % p["slug"])
for d in dest:
    u = "https://dreamislands.org/destinations/%s" % d["slug"]
    check(u in new, "sitemap has destination %s" % d["slug"])
for g in progs: check("https://dreamislands.org/programs/%s" % g["slug"] in new, "sitemap has program %s" % g["slug"]) if ("https://dreamislands.org/programs/%s" % g["slug"] not in new) else None
n_lastmod = len(re.findall(r"<lastmod>", sm))
ent = sum(1 for u in locs if re.search(r"/(programs|properties)/[^/]+$|/destinations/[^/]+$|/medical/china/hospitals/[^/]+$", u))
check(n_lastmod <= ent, "lastmod only on DB entities (%d lastmod, %d entity urls)" % (n_lastmod, ent))
c, rb = get("/robots.txt"); check("Sitemap: https://dreamislands.org/sitemap.xml" in rb, "robots.txt points to /sitemap.xml")

print("\nSMOKE %s (%d failures)" % ("FAILED" if fails else "OK", len(fails)))
sys.exit(1 if fails else 0)
