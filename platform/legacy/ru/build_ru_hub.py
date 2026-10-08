#!/usr/bin/env python3
# DRAFT of the Supabase-driven RU generator (entity aggregation layer, RU side).
# Run ON the RU VPS:  python3 /root/build_ru_hub.py [China]
# Reads PUBLISHED rows through the public anon/publishable key (RLS already limits it to active properties and
# published+active programs), computes counters/cards/photos/links, rewrites the body of /destinations/china/.
# Needs /root/build_ru_medical.py (helpers) and /root/dit_public.env with SUPABASE_URL and SUPABASE_KEY.
# No hardcoded counts. Editorial featured list: FEATURED_OVERRIDE below until programs.is_featured/featured_rank exist.
import os, re, sys, json, shutil, html, urllib.request, urllib.parse

COUNTRY = sys.argv[1] if len(sys.argv) > 1 else "China"
GATE_STRICT = False  # True: skip entities failing the minimal publish gate; False: include and print a warning

src = open("/root/build_ru_medical.py", encoding="utf-8").read()
exec(compile(src.split("pages = [build_pillar()")[0], "head", "exec"), globals())

env = {}
for line in open("/root/dit_public.env", encoding="utf-8"):
    if "=" in line and not line.startswith("#"):
        k, v = line.strip().split("=", 1); env[k] = v
SB, KEY = env["SUPABASE_URL"].rstrip("/"), env["SUPABASE_KEY"]

def q(table, **params):
    url = "%s/rest/v1/%s?%s" % (SB, table, urllib.parse.urlencode(params, safe="*,().:"))
    req = urllib.request.Request(url, headers={"apikey": KEY, "Authorization": "Bearer " + KEY})
    return json.load(urllib.request.urlopen(req, timeout=30))

EN_SITE = "https://dreamislands.org"
CH = ROOT + "/destinations/china/index.html"
G = "/lechenie-v-kitae/gidy/"

FEATURED_OVERRIDE = [  # editorial order until featured flags exist; unknown/unpublished slugs are skipped
 "mile-3d2n-detox-anti-aging", "mile-5d4n-wellness-escape", "mile-7d6n-deep-recovery", "mile-medical-wellness-journey",
 "wudang-3-day-mind-reset", "wudang-5-day-dao-wellness", "wudang-7-day-tai-chi-longevity", "xian-wudang-wellness-journey-11d"]
FEATURED_MAX = 8

def ru(t, key, default):
    try: return (t or {}).get("ru", {}).get(key) or default
    except AttributeError: return default

# ---------------- fetch published inventory
props = q("properties", select="id,name,slug,entity_type,island,country,image_url,description,translations", active="eq.true", country="ilike.*%s*" % COUNTRY, order="name.asc")
pid = {p["id"]: p for p in props}
links = q("program_properties", select="program_id,property_id,role")
progs = q("programs", select="id,slug,name,duration_days,price_usd,hero_image_url,translations,sort_order,summary", order="sort_order.asc.nullslast,name.asc", limit="500")
media = q("media_assets", select="property_id,public_url,sort_order,is_featured", active="eq.true", property_id="in.(%s)" % ",".join(pid), order="sort_order.asc.nullslast", limit="2000") if pid else []
med1 = {}
for m in media:
    med1.setdefault(m["property_id"], m["public_url"])

def photo(p): return p.get("image_url") or med1.get(p["id"])

LOC_RU = {"Beijing": "Пекин", "Shanghai": "Шанхай", "Chengdu": "Чэнду", "Guangzhou": "Гуанчжоу", "Xi'an": "Сиань",
          "Mile": "Миле", "Yunnan": "Юньнань", "Wudang Mountain": "Гора Уданг", "Huizhou": "Хуэйчжоу", "Guangdong": "Гуандун",
          "Pu'er": "Пуэр", "Sanya": "Санья", "Hainan": "Хайнань", "Xishuangbanna": "Сишуанбаньна", "Multi-city Network": "Сеть клиник"}
def loc(s): return ", ".join(LOC_RU.get(x.strip(), x.strip()) for x in (s or "").split(","))

wellness = [p for p in props if p["entity_type"] == "wellness_property"]
hospitals = [p for p in props if p["entity_type"] == "hospital_clinic"]
network = [p for p in props if p["entity_type"] == "network_coordinator"]

by_prog = {}
for l in links:
    by_prog.setdefault(l["program_id"], set()).add(l["property_id"])
prog_by_id = {g["id"]: g for g in progs}
def progs_of(prop_ids):
    return [g for g in progs if by_prog.get(g["id"], set()) & prop_ids]
wprogs = progs_of({p["id"] for p in wellness})
mprogs = progs_of({p["id"] for p in network + hospitals})

# ---------------- publish-gate report (minimal rules from the spec)
def gate(p, needs_photo=True):
    miss = []
    if not (p.get("name") and p.get("slug")): miss.append("name/slug")
    if not (p.get("description") or ru(p.get("translations"), "description", "")): miss.append("description")
    if needs_photo and not photo(p): miss.append("hero image")
    return miss
shown_w = []
for p in wellness:
    miss = gate(p)
    if miss:
        print("GATE %s: %s: missing %s" % ("SKIP" if GATE_STRICT else "WARN", p["slug"], ", ".join(miss)))
        if GATE_STRICT: continue
    shown_w.append(p)
shown_h = []
for p in hospitals:
    miss = gate(p, needs_photo=False)
    if miss:
        print("GATE %s: %s: missing %s" % ("SKIP" if GATE_STRICT else "WARN", p["slug"], ", ".join(miss)))
        if GATE_STRICT: continue
    shown_h.append(p)

# ---------------- helpers
def prog_href(slug):
    return "/programs/%s/" % slug if os.path.isdir(ROOT + "/programs/" + slug) else "%s/programs/%s" % (EN_SITE, slug)
def ext(href): return ' target="_blank" rel="noopener"' if href.startswith("http") else ""
def short(t, n=170):
    t = re.sub(r"\s+", " ", t or "").strip()
    if len(t) <= n: return t
    cut = t[:n].rsplit(" ", 1)[0]
    return cut.rstrip(",;:") + "…"
def days(d):
    d = int(d or 0)
    return "%d %s" % (d, "день" if d % 10 == 1 and d != 11 else ("дня" if d % 10 in (2, 3, 4) and d not in (12, 13, 14) else "дней"))
def card(href, img, badge, country, name, desc, emoji="🏝️"):
    if img: im = '<div class="dest-card__img"><img src="%s" alt="%s" loading="lazy"><div class="dest-card__badge">%s</div></div>' % (esc(img), esc(name), esc(badge))
    else: im = '<div class="dest-card__img" style="display:flex;align-items:center;justify-content:center;font-size:5rem">%s<div class="dest-card__badge">%s</div></div>' % (emoji, esc(badge))
    return ('<a href="%s" class="dest-card"%s>%s<div class="dest-card__body"><div class="dest-card__country">%s</div><div class="dest-card__name">%s</div>%s</div></a>') % (
        href, ext(href), im, esc(country), esc(name), '<div class="dest-card__desc">%s</div>' % esc(desc) if desc else "")
H = lambda t, sub="": ('<h2 style="font-family:Optima,Georgia,serif;color:#fff;font-size:1.6rem;margin:3rem 0 .4rem">%s</h2>' % t) + \
                      (('<p style="color:var(--text-dim);margin-bottom:.5rem">%s</p>' % sub) if sub else "")

def place_href(p):
    if os.path.isdir(ROOT + "/destinations/" + p["slug"]): return "/destinations/%s/" % p["slug"]
    mine = [g for g in wprogs if p["id"] in by_prog.get(g["id"], set())]
    if not mine: return "%s/properties/%s" % (EN_SITE, p["slug"])
    # most relevant: RU page exists, then programs tied only to this place, then catalog order
    mine.sort(key=lambda g: (0 if os.path.isdir(ROOT + "/programs/" + g["slug"]) else 1, len(by_prog.get(g["id"], ())), g.get("sort_order") or 0))
    return prog_href(mine[0]["slug"])

def plural(n, one, few, many):
    n = abs(int(n))
    if n % 10 == 1 and n % 100 != 11: return one
    if 2 <= n % 10 <= 4 and not 12 <= n % 100 <= 14: return few
    return many

HOSP_BY_SLUG = {h[0]: h for h in HOSP}
def hosp_href(p):
    h = HOSP_BY_SLUG.get(p["slug"])
    return hosp_url(h) if h else "%s/properties/%s" % (EN_SITE, p["slug"])

# ---------------- counters
n_dest, n_prog, n_hosp, n_pack = len(shown_w), len(wprogs), len(shown_h), len(mprogs)
cities = sorted({(p.get("island") or "").strip() for p in shown_h if p.get("island")})
n_city = len(cities)
stats = ('<div style="display:flex;flex-wrap:wrap;gap:1rem 2.5rem;justify-content:center;margin:0 0 1rem">' +
         "".join('<div style="text-align:center"><div style="font-size:1.8rem;font-family:Optima,Georgia,serif;color:var(--mint)">%s</div><div style="font-size:.82rem;color:var(--text-dim)">%s</div></div>' % (n, l)
                 for n, l in [(n_dest, plural(n_dest, "велнес-направление", "велнес-направления", "велнес-направлений")),
                              (n_prog, plural(n_prog, "велнес-программа", "велнес-программы", "велнес-программ")),
                              (n_hosp, plural(n_hosp, "клиника-партнёр", "клиники-партнёра", "клиник-партнёров")),
                              (n_pack, plural(n_pack, "медицинский пакет", "медицинских пакета", "медицинских пакетов"))]) + '</div>')

# ---------------- cards
# order: places with the most programs first (editorial rank replaces this once featured_rank exists)
_cnt = lambda p: sum(1 for g in wprogs if p["id"] in by_prog.get(g["id"], set()))
shown_w.sort(key=lambda p: (-_cnt(p), p["name"]))
for p in shown_w:  # RU hub must not show English copy: warn when RU translation is missing
    if not ru(p.get("translations"), "name", ""): print("I18N WARN: %s has no ru name" % p["slug"])
    if not ru(p.get("translations"), "description", ""): print("I18N WARN: %s has no ru description" % p["slug"])
dest_cards = "".join(card(place_href(p), photo(p), loc(p.get("island")).split(",")[-1].strip() or "Китай",
                          "🇨🇳 " + loc(p.get("island")), ru(p.get("translations"), "name", p["name"]),
                          short(ru(p.get("translations"), "description", ""), 150)) for p in shown_w)

feat = [prog_by_id_slug for prog_by_id_slug in [next((g for g in wprogs if g["slug"] == s), None) for s in FEATURED_OVERRIDE] if prog_by_id_slug]
for g in wprogs:
    if len(feat) >= FEATURED_MAX: break
    if g not in feat: feat.append(g)
feat = feat[:FEATURED_MAX]
def prog_img(g):
    if g.get("hero_image_url"): return g["hero_image_url"]
    for pi in by_prog.get(g["id"], ()):
        if pid.get(pi) and photo(pid[pi]): return photo(pid[pi])
def _pname(g): return ru(g.get("translations"), "name", g["name"])
prog_cards = "".join(card(prog_href(g["slug"]), prog_img(g), "Программа", "" if re.search(r"\d", _pname(g)) else days(g["duration_days"]), _pname(g), "") for g in feat)

hosp_cards = "".join(card(hosp_href(p), photo(p), "Клиника", "🇨🇳 " + loc(p.get("island")), ru(p.get("translations"), "name", p["name"]), "") for p in shown_h)

medical_block = (
  '<div style="margin:3rem 0 0;padding:2rem;border:1px solid rgba(174,225,192,.3);border-radius:14px;background:var(--panel)">'
  '<div class="dest-eyebrow" style="margin-bottom:.6rem">Медицина</div>'
  '<h2 style="font-family:Optima,Georgia,serif;color:#fff;font-size:1.8rem;margin:0 0 .8rem">Лечение в Китае</h2>'
  '<p style="color:var(--text-dim);max-width:760px;line-height:1.7">%d клиник-партнёров в %d городах. Подбор клиники и специалиста, дистанционное второе мнение, сопровождение медицинского кейса и организация лечения. '
  'Сервис: амбулаторный визит 3 500 RMB (≈ $521), сопровождение операции от 18 000 RMB (от ≈ $2 679); расходы клиники оплачиваются отдельно. Лечение осуществляют лицензированные клиники и врачи, результат не гарантируется.</p>'
  '<p style="margin-top:1.2rem"><a href="/lechenie-v-kitae/" class="btn btn-mint">Лечение в Китае →</a> &nbsp; <a href="%svtoroe-mnenie/" class="btn">Дистанционное второе мнение</a></p>'
  '<ul style="list-style:none;display:flex;flex-wrap:wrap;gap:.6rem 1.5rem;padding:0;margin:1.2rem 0 0">%s</ul></div>') % (
  n_hosp, n_city, G, "".join('<li><a href="%s" style="color:var(--mint)">%s</a></li>' % (p, esc(n)) for n, p in [
    ("Стоимость лечения в Китае", G + "stoimost-lecheniya-v-kitae/"), ("Как организовать лечение", G + "kak-organizovat-lechenie-v-kitae/"),
    ("Как выбрать клинику", G + "kak-vybrat-kliniku-v-kitae/"), ("Клиники для иностранных пациентов", G + "kliniki-kitaya-dlya-inostrantsev/")]))

body = (
  '  <div class="dest-header" data-china-v2="1">\n'
  '  <a href="/destinations/" style="display:inline-block;margin-bottom:1.5rem;color:var(--mint);text-decoration:none;font-size:.85rem">← Все направления</a>\n'
  '    <div class="dest-eyebrow">Dream Islands · Азия</div>\n'
  '    <h1 class="dest-title">🇨🇳 Китай — велнес, ретриты и лечение</h1>\n'
  '    <p class="dest-sub">Велнес-программы, традиционные практики, медицинские услуги и проверенные партнёры Dream Islands в Китае — от Юньнани и Хайнаня до Сианя, Пекина и Шанхая.</p>\n'
  '  </div>\n' + stats +
  H("Велнес в Китае", "%d %s: от лесных термальных источников Юньнани до даосских практик горы Уданг." % (n_dest, plural(n_dest, "направление", "направления", "направлений"))) + '<div class="dest-grid">' + dest_cards + '</div>' +
  H("Популярные программы", "Избранные программы из %d %s Китая." % (n_prog, plural(n_prog, "велнес-программы", "велнес-программ", "велнес-программ"))) + '<div class="dest-grid">' + prog_cards + '</div>' +
  '<p style="text-align:center;margin:1.5rem 0 0"><a href="/programs/" class="btn">Все программы Китая →</a></p>' +
  medical_block +
  H("Клиники-партнёры", "%d клиник в %d городах. Конкретная клиника подбирается после разбора случая." % (n_hosp, n_city)) +
  '<div class="dest-grid">' + hosp_cards + '</div>' +
  '<p style="text-align:center;margin:2.5rem 0 0"><a href="/lechenie-v-kitae/#case" class="btn btn-mint">Отправить медицинский запрос →</a></p>\n')

s = open(CH, encoding="utf-8").read()
start = s.find('  <div class="dest-header"')
end = s.find('</div><div style="max-width:1000px;margin:1rem auto 3rem;padding:0 2rem" data-medlink="1">')
if start < 0 or end < 0 or end < start:
    print("ANCHOR FAIL", start, end); sys.exit(1)
if "--dry" in sys.argv:
    print("DRY RUN: wellness=%d programs=%d hospitals=%d cities=%d packages=%d featured=%d" % (n_dest, n_prog, n_hosp, n_city, n_pack, len(feat))); sys.exit(0)
shutil.copy(CH, BACKUP + "/destinations__china.index.html.bak3")
open(CH, "w", encoding="utf-8").write(s[:start] + body + s[end:])
print("china hub from Supabase: wellness=%d programs=%d hospitals=%d cities=%d packages=%d featured=%d" % (n_dest, n_prog, n_hosp, n_city, n_pack, len(feat)))
