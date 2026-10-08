#!/usr/bin/env python3
# Supabase-driven RU generator for ALL countries (entity aggregation layer, RU side). DRAFT v1.
# Run ON the RU VPS:   python3 /root/build_ru_all.py [--dry] [--only properties,programs,hubs,counters]
# Needs: /root/build_ru_medical.py (helpers), /root/dit_public.env (SUPABASE_URL, SUPABASE_KEY = public key; RLS = published rows only).
# What it does (idempotent, backups to BACKUP dir):
#   1. properties : creates missing /destinations/<slug>/ pages (wellness properties) from Supabase
#   2. programs   : creates missing /programs/<slug>/ shells (the site's program-detail.js renders the content live)
#   3. hubs       : rebuilds the body of /destinations/<country>/ for every country (counters, cards, photos, links)
#   4. counters   : refreshes the program/country counters on /programs/
#   5. sitemap.xml: adds URLs of newly created pages
# Existing property/program pages are never overwritten. China hub keeps the medical block and clinics.
import os, re, sys, json, shutil, html, urllib.request, urllib.parse

ARGS = sys.argv[1:]
DRY = "--dry" in ARGS
ONLY = set((ARGS[ARGS.index("--only") + 1] if "--only" in ARGS else "properties,programs,hubs,index,counters").split(","))

src = open("/root/build_ru_medical.py", encoding="utf-8").read()
exec(compile(src.split("pages = [build_pillar()")[0], "head", "exec"), globals())

env = {}
for line in open("/root/dit_public.env", encoding="utf-8"):
    if "=" in line and not line.startswith("#"):
        k, v = line.strip().split("=", 1); env[k] = v
SB, KEY = env["SUPABASE_URL"].rstrip("/"), env["SUPABASE_KEY"]

def qall(table, **params):
    out, off = [], 0
    while True:
        p = dict(params); p["limit"] = "1000"; p["offset"] = str(off)
        url = "%s/rest/v1/%s?%s" % (SB, table, urllib.parse.urlencode(p, safe="*,().:"))
        req = urllib.request.Request(url, headers={"apikey": KEY, "Authorization": "Bearer " + KEY})
        rows = json.load(urllib.request.urlopen(req, timeout=60))
        out += rows
        if len(rows) < 1000: return out
        off += 1000

SITE_RU = "https://dreamislands.ru"
EN_SITE = "https://dreamislands.org"
S = "https://xbzrtofanbrahasxbisf.supabase.co/storage/v1/object/public/properties/"
G = "/lechenie-v-kitae/gidy/"
WHATSAPP = "https://wa.me/66811612662"

COUNTRIES = {  # DB country -> (ru name, flag, dir)
 "China": ("Китай", "🇨🇳", "china"), "Thailand": ("Таиланд", "🇹🇭", "thailand"), "Indonesia": ("Индонезия", "🇮🇩", "indonesia"),
 "Philippines": ("Филиппины", "🇵🇭", "philippines"), "Singapore": ("Сингапур", "🇸🇬", "singapore"),
 "Malaysia": ("Малайзия", "🇲🇾", "malaysia"), "Vietnam": ("Вьетнам", "🇻🇳", "vietnam")}
LOC_RU = {"Beijing": "Пекин", "Shanghai": "Шанхай", "Chengdu": "Чэнду", "Guangzhou": "Гуанчжоу", "Xi'an": "Сиань", "Mile": "Миле", "Yunnan": "Юньнань",
          "Wudang Mountain": "Гора Уданг", "Huizhou": "Хуэйчжоу", "Guangdong": "Гуандун", "Pu'er": "Пуэр", "Sanya": "Санья", "Hainan": "Хайнань",
          "Xishuangbanna": "Сишуанбаньна", "Multi-city Network": "Сеть клиник", "Koh Samui": "Ко Самуи", "Koh Phangan": "Ко Пханган", "Bali": "Бали",
          "Bintan": "Бинтан", "Penang": "Пенанг", "Langkawi": "Лангкави", "Cebu": "Себу", "Boracay": "Боракай", "Singapore": "Сингапур",
          "Sentosa": "Сентоза", "Phu Quoc": "Фукуок"}

# ---------------- helpers
def ru(t, key, default=""):
    try: return (t or {}).get("ru", {}).get(key) or default
    except AttributeError: return default
def loc(s): return ", ".join(LOC_RU.get(x.strip(), x.strip()) for x in (s or "").split(","))
def short(t, n=170):
    t = re.sub(r"\s+", " ", t or "").strip()
    if len(t) <= n: return t
    return t[:n].rsplit(" ", 1)[0].rstrip(",;:") + "…"
def plural(n, one, few, many):
    n = abs(int(n))
    if n % 10 == 1 and n % 100 != 11: return one
    if 2 <= n % 10 <= 4 and not 12 <= n % 100 <= 14: return few
    return many
def days(d):
    d = int(d or 0)
    return "%d %s" % (d, plural(d, "день", "дня", "дней"))
def ext(href): return ' target="_blank" rel="noopener"' if href.startswith("http") else ""
def backup(path, tag):
    if os.path.exists(path): shutil.copy(path, "%s/%s.%s.bak" % (BACKUP, path.replace(ROOT, "").strip("/").replace("/", "__"), tag))
def put(path, content):
    if DRY: return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w", encoding="utf-8").write(content)

# ---------------- fetch published inventory
props = qall("properties", select="id,name,slug,entity_type,island,country,image_url,description,translations", active="eq.true", order="name.asc")
links = qall("program_properties", select="program_id,property_id,role")
progs = qall("programs", select="id,slug,name,duration_days,price_usd,hero_image_url,translations,sort_order,summary", order="sort_order.asc.nullslast,name.asc")
media = qall("media_assets", select="property_id,public_url,sort_order", active="eq.true", property_id="not.is.null", order="sort_order.asc.nullslast")
gallery = {}
for m in media: gallery.setdefault(m["property_id"], []).append(m["public_url"])
by_prog = {}
for l in links: by_prog.setdefault(l["program_id"], set()).add(l["property_id"])
pid = {p["id"]: p for p in props}
def photo(p): return p.get("image_url") or (gallery.get(p["id"]) or [None])[0]
def progs_of_props(ids): return [g for g in progs if by_prog.get(g["id"], set()) & ids]

# ---- hero resolution (single rule for the whole RU frontend; never copied into the entity, resolved at generation time):
#      1. program.hero_image_url  2. property hero  3. destination (country) hero  4. global fallback image  (emoji only if even 4 is unavailable)
_dc = qall("destination_countries", select="country,hero_image_url,hero_is_neutral", active="eq.true")
dest_hero_card = {r["country"]: r.get("hero_image_url") for r in _dc}                      # country cards / hubs (any country photo)
dest_hero = {r["country"]: r.get("hero_image_url") for r in _dc if r.get("hero_is_neutral") and r.get("hero_image_url")}  # fallback: ONLY neutral heroes, never another property's photo
GLOBAL_FALLBACK = SITE_RU + "/assets/img/og-image.webp" if "SITE_RU" in globals() else "https://dreamislands.ru/assets/img/og-image.webp"
def prog_props(g):
    ps = [pid[i] for i in by_prog.get(g["id"], ()) if i in pid]
    ps.sort(key=lambda p: (0 if p["entity_type"] == "wellness_property" else 1, p["name"]))
    return ps
def prog_country(g):
    for p in prog_props(g):
        if p.get("country"): return p["country"]
def resolve_prog_image(g):
    """-> (url, source) with source in own | property | destination | global"""
    if g.get("hero_image_url"): return g["hero_image_url"], "own"
    for p in prog_props(g):
        if photo(p): return photo(p), "property"
    c = prog_country(g)
    if c and dest_hero.get(c): return dest_hero[c], "destination"
    return GLOBAL_FALLBACK, "global"
def resolve_prop_image(p):
    if photo(p): return photo(p), "own"
    if p.get("country") and dest_hero.get(p["country"]): return dest_hero[p["country"]], "destination"
    return GLOBAL_FALLBACK, "global"
def exists_prog(slug): return os.path.isdir(ROOT + "/programs/" + slug)
def exists_dest(slug): return os.path.isdir(ROOT + "/destinations/" + slug)
def prog_href(slug): return "/programs/%s/" % slug if exists_prog(slug) or DRY_WILL_CREATE_PROG(slug) else "%s/programs/%s" % (EN_SITE, slug)
def pname(g): return ru(g.get("translations"), "name", g["name"])
def pdesc(g): return ru(g.get("translations"), "short_description") or ru(g.get("translations"), "description") or (g.get("summary") or "")

created_progs, created_dests = [], []
touched = set()   # URL paths rebuilt in this run -> get a fresh <lastmod> in sitemap.xml
import datetime
TODAY = datetime.date.today().isoformat()
def DRY_WILL_CREATE_PROG(slug): return DRY and slug in created_progs

# ============ 1. property pages (wellness properties without an RU page)
def property_page(p, tpl):
    country_ru, flag, _ = COUNTRIES.get(p["country"], (p["country"], "", ""))
    name = ru(p.get("translations"), "name", p["name"])
    desc = ru(p.get("translations"), "description", "")
    title = "%s — Dream Islands · %s" % (name, country_ru)
    path = "/destinations/%s/" % p["slug"]
    img = photo(p)
    mine = [g for g in progs_of_props({p["id"]})]
    hero = ('<img src="%s" class="obj-hero__img active" alt="%s" loading="eager">' % (esc(img), esc(name))) if img else '<div class="obj-hero__icon">🏝️</div>'
    gal = [u for u in gallery.get(p["id"], []) if u != img][:8]
    gal_html = ('<div class="obj-gallery"><div class="obj-gallery__title">Фото</div><div class="obj-gallery__grid">%s</div></div>' %
                "".join('<div class="obj-gallery__item"><img src="%s" alt="%s" loading="lazy"></div>' % (esc(u), esc(name)) for u in gal)) if gal else ""
    plist = "".join('<a class="obj-program" href="/programs/%s/" style="display:block;text-decoration:none">%s</a>' % (g["slug"], esc(pname(g))) for g in mine) or '<div class="obj-program">Программы уточняются</div>'
    main = ('<main class="obj-page"><div class="obj-container">\n'
      '  <div class="obj-hero" id="objHero"><div class="obj-hero__slider" id="heroSlider">%s</div><div class="obj-hero__overlay"></div>'
      '<div class="obj-hero__content"><div class="obj-hero__flag">%s</div><div class="obj-hero__country">%s · %s</div><h1 class="obj-hero__title">%s</h1></div></div>\n'
      '  <div class="obj-grid"><div><p class="obj-desc">%s</p>%s</div>\n'
      '    <div class="obj-sidebar"><div class="obj-card"><div class="obj-card__title">Программы</div><div class="obj-programs">%s</div></div>\n'
      '      <div class="obj-card"><div class="obj-card__title">Связаться</div>'
      '<p style="font-size:.88rem;color:var(--text-dim);margin-bottom:1rem">Персональный менеджер подберёт программу и организует поездку</p>'
      '<a href="%s" class="obj-cta" target="_blank" rel="noopener">WhatsApp · +66 811 612 662</a>'
      '<a href="/start/" class="obj-cta" style="background:transparent;border:1px solid rgba(174,225,192,.3);color:var(--mint);margin-top:.5rem">Пройти чек-ап →</a></div></div></div>\n'
      '</div></main>') % (hero, flag, esc(country_ru), esc(loc(p.get("island"))), esc(name), esc(desc), gal_html, plist, WHATSAPP)
    t = tpl
    sub = lambda pat, new, s: re.sub(pat, lambda m: new, s, count=1, flags=re.S)
    t = sub(r"<title>.*?</title>", "<title>%s</title>" % esc(title), t)
    t = sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="%s">' % esc(short(desc, 200)), t)
    t = sub(r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="%s%s">' % (SITE_RU, path), t)
    t = sub(r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="%s">' % esc(name), t)
    t = sub(r'<meta property="og:description" content="[^"]*">', '<meta property="og:description" content="%s">' % esc(short(desc, 200)), t)
    og_extra = '<meta property="og:url" content="%s%s">' % (SITE_RU, path) + ('<meta property="og:image" content="%s">' % esc(img) if img else "")
    t = t.replace('<meta property="og:site_name" content="Dream Islands">', '<meta property="og:site_name" content="Dream Islands">' + og_extra, 1)
    ld = [{"@context": "https://schema.org", "@type": "WebPage", "name": title, "description": short(desc, 200), "url": SITE_RU + path, "inLanguage": "ru"},
          {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
              {"@type": "ListItem", "position": 1, "name": "Главная", "item": SITE_RU + "/"},
              {"@type": "ListItem", "position": 2, "name": "Направления", "item": SITE_RU + "/destinations/"},
              {"@type": "ListItem", "position": 3, "name": country_ru, "item": "%s/destinations/%s/" % (SITE_RU, COUNTRIES.get(p["country"], ("", "", ""))[2])},
              {"@type": "ListItem", "position": 4, "name": name, "item": SITE_RU + path}]}]
    t = t.replace("</head>", "".join('<script type="application/ld+json">%s</script>' % json.dumps(j, ensure_ascii=False) for j in ld) + "</head>", 1)
    t = sub(r'<main class="obj-page">.*?</main>', main, t)
    return path, t

if "properties" in ONLY:
    tpl_path = ROOT + "/destinations/tanya-wellbeing/index.html"
    tpl = open(tpl_path, encoding="utf-8").read()
    for p in props:
        if p["entity_type"] != "wellness_property" or exists_dest(p["slug"]): continue
        if not (p.get("description") or ru(p.get("translations"), "description")):
            print("SKIP property (no description):", p["slug"]); continue
        path, content = property_page(p, tpl)
        put(ROOT + path + "index.html", content); created_dests.append(path)
        print("%s property page: %s" % ("WOULD CREATE" if DRY else "created", path))

# ============ 2. program shells (content rendered live by /js/program-detail.js)
if "programs" in ONLY:
    tpl_path = ROOT + "/programs/wudang-3-day-mind-reset/index.html"
    tpl = open(tpl_path, encoding="utf-8").read()
    for g in progs:
        if exists_prog(g["slug"]): continue
        name, desc = pname(g), short(pdesc(g), 200)
        if not name: print("SKIP program (no name):", g["slug"]); continue
        if not desc: print("WARN program without RU description:", g["slug"])
        path = "/programs/%s/" % g["slug"]
        title = "%s | Dream Islands" % name
        sub = lambda pat, new, s: re.sub(pat, lambda m: new, s, count=1, flags=re.S)
        t = tpl
        t = sub(r"<title>.*?</title>", "<title>%s</title>" % esc(title), t)
        t = sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="%s">' % esc(desc), t)
        t = sub(r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="%s%s">' % (SITE_RU, path), t)
        t = sub(r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="%s">' % esc(title), t)
        t = sub(r'<meta property="og:description" content="[^"]*">', '<meta property="og:description" content="%s">' % esc(desc), t)
        t = sub(r'<meta property="og:url" content="[^"]*">', '<meta property="og:url" content="%s%s">' % (SITE_RU, path), t)
        og_img = resolve_prog_image(g)[0]
        t = sub(r'<meta property="og:image" content="[^"]*">', '<meta property="og:image" content="%s">' % esc(og_img), t)
        t = sub(r'<meta name="twitter:image" content="[^"]*">', '<meta name="twitter:image" content="%s">' % esc(og_img), t)
        ld = {"@context": "https://schema.org", "@graph": [
            {"@type": "WebPage", "name": name, "description": desc, "url": SITE_RU + path, "isPartOf": {"@type": "WebSite", "url": SITE_RU}},
            {"@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Главная", "item": SITE_RU},
                {"@type": "ListItem", "position": 2, "name": "Программы", "item": SITE_RU + "/programs/"},
                {"@type": "ListItem", "position": 3, "name": name, "item": SITE_RU + path}]}]}
        t = sub(r'<script type="application/ld\+json">.*?</script>', '<script type="application/ld+json">%s</script>' % json.dumps(ld, ensure_ascii=False), t)
        # server-side fallback text for crawlers; the page script replaces #pdRoot on load
        t = t.replace('<p class="dim">Загружаем программу…</p>', '<h1>%s</h1><p>%s</p><p class="dim">Загружаем программу…</p>' % (esc(name), esc(desc)), 1)
        # neutral footer text (template is Tanya-specific)
        t = t.replace("Холистический оздоровительный ретрит. Ко Самуи, Таиланд. Медицина · Детокс · Восстановление · Долголетие.", "Велнес-программы и организация лечения в Азии.")
        t = t.replace("&copy; 2024&ndash;2026 Dream Islands Holistic Health Retreat &middot; Ко Самуи, Таиланд", "&copy; 2024&ndash;2026 Dream Islands")
        put(ROOT + path + "index.html", t); created_progs.append(g["slug"])
        print("%s program shell: %s" % ("WOULD CREATE" if DRY else "created", path))

# ============ 3. country hubs
def card(href, img, badge, country, name, desc, emoji="🏝️"):
    if img: im = '<div class="dest-card__img"><img src="%s" alt="%s" loading="lazy"><div class="dest-card__badge">%s</div></div>' % (esc(img), esc(name), esc(badge))
    else: im = '<div class="dest-card__img" style="display:flex;align-items:center;justify-content:center;font-size:5rem">%s<div class="dest-card__badge">%s</div></div>' % (emoji, esc(badge))
    return ('<a href="%s" class="dest-card"%s>%s<div class="dest-card__body"><div class="dest-card__country">%s</div><div class="dest-card__name">%s</div>%s</div></a>') % (
        href, ext(href), im, esc(country), esc(name), '<div class="dest-card__desc">%s</div>' % esc(desc) if desc else "")
H = lambda t, sub="": ('<h2 style="font-family:Optima,Georgia,serif;color:#fff;font-size:1.6rem;margin:3rem 0 .4rem">%s</h2>' % t) + \
                      (('<p style="color:var(--text-dim);margin-bottom:.5rem">%s</p>' % sub) if sub else "")
def stat(n, l): return '<div style="text-align:center"><div style="font-size:1.8rem;font-family:Optima,Georgia,serif;color:var(--mint)">%s</div><div style="font-size:.82rem;color:var(--text-dim)">%s</div></div>' % (n, l)

def place_href(p, wprogs):
    if exists_dest(p["slug"]) or (DRY and "/destinations/%s/" % p["slug"] in created_dests): return "/destinations/%s/" % p["slug"]
    mine = [g for g in wprogs if p["id"] in by_prog.get(g["id"], set())]
    if not mine: return "%s/properties/%s" % (EN_SITE, p["slug"])
    mine.sort(key=lambda g: (0 if exists_prog(g["slug"]) else 1, len(by_prog.get(g["id"], ())), g.get("sort_order") or 0))
    return prog_href(mine[0]["slug"])

CN_FEATURED = ["mile-3d2n-detox-anti-aging", "mile-5d4n-wellness-escape", "mile-7d6n-deep-recovery", "mile-medical-wellness-journey",
               "wudang-3-day-mind-reset", "wudang-5-day-dao-wellness", "wudang-7-day-tai-chi-longevity", "xian-wudang-wellness-journey-11d"]
HOSP_BY_SLUG = {h[0]: h for h in HOSP}

def hub_body(country):
    cru, flag, d = COUNTRIES[country]
    cp = [p for p in props if p["country"] == country]
    wellness = [p for p in cp if p["entity_type"] == "wellness_property"]
    wprogs = progs_of_props({p["id"] for p in wellness})
    wellness.sort(key=lambda p: (-sum(1 for g in wprogs if p["id"] in by_prog.get(g["id"], set())), p["name"]))
    n_dest, n_prog = len(wellness), len(wprogs)
    for p in wellness:
        if not ru(p.get("translations"), "name"): print("I18N WARN: %s has no ru name" % p["slug"])
        if not photo(p): print("PHOTO MISSING: %s" % p["slug"])
    dest_cards = "".join(card(place_href(p, wprogs), resolve_prop_image(p)[0],loc(p.get("island")).split(",")[-1].strip() or cru, "%s %s" % (flag, loc(p.get("island"))),
                              ru(p.get("translations"), "name", p["name"]), short(ru(p.get("translations"), "description"), 150)) for p in wellness)
    if country == "China":
        feat = [g for g in (next((x for x in wprogs if x["slug"] == s), None) for s in CN_FEATURED) if g]
    else:
        feat = []
    for g in wprogs:
        if len(feat) >= 8: break
        if g not in feat: feat.append(g)
    feat = feat[:8]
    def pimg(g): return resolve_prog_image(g)[0]
    prog_cards = "".join(card(prog_href(g["slug"]), pimg(g), "Программа", "" if re.search(r"\d", pname(g)) else days(g["duration_days"]), pname(g), "") for g in feat)
    stats_items = [(n_dest, plural(n_dest, "велнес-направление", "велнес-направления", "велнес-направлений")),
                   (n_prog, plural(n_prog, "программа", "программы", "программ"))]
    med = ""
    if country == "China":
        hosp = [p for p in cp if p["entity_type"] == "hospital_clinic"]
        pack = progs_of_props({p["id"] for p in cp if p["entity_type"] in ("network_coordinator", "hospital_clinic")})
        stats_items = [(n_dest, stats_items[0][1]), (n_prog, plural(n_prog, "велнес-программа", "велнес-программы", "велнес-программ")),
                       (len(hosp), plural(len(hosp), "клиника-партнёр", "клиники-партнёра", "клиник-партнёров")),
                       (len(pack), plural(len(pack), "медицинский пакет", "медицинских пакета", "медицинских пакетов"))]
        n_city = len({(p.get("island") or "") for p in hosp})
        hl = [("Стоимость лечения в Китае", G + "stoimost-lecheniya-v-kitae/"), ("Как организовать лечение", G + "kak-organizovat-lechenie-v-kitae/"),
              ("Как выбрать клинику", G + "kak-vybrat-kliniku-v-kitae/"), ("Клиники для иностранных пациентов", G + "kliniki-kitaya-dlya-inostrantsev/")]
        med = ('<div style="margin:3rem 0 0;padding:2rem;border:1px solid rgba(174,225,192,.3);border-radius:14px;background:var(--panel)">'
               '<div class="dest-eyebrow" style="margin-bottom:.6rem">Медицина</div><h2 style="font-family:Optima,Georgia,serif;color:#fff;font-size:1.8rem;margin:0 0 .8rem">Лечение в Китае</h2>'
               '<p style="color:var(--text-dim);max-width:760px;line-height:1.7">%d клиник-партнёров в %d городах. Подбор клиники и специалиста, дистанционное второе мнение, сопровождение медицинского кейса и организация лечения. '
               'Сервис: амбулаторный визит 3 500 RMB (≈ $521), сопровождение операции от 18 000 RMB (от ≈ $2 679); расходы клиники оплачиваются отдельно. Лечение осуществляют лицензированные клиники и врачи, результат не гарантируется.</p>'
               '<p style="margin-top:1.2rem"><a href="/lechenie-v-kitae/" class="btn btn-mint">Лечение в Китае →</a> &nbsp; <a href="%svtoroe-mnenie/" class="btn">Дистанционное второе мнение</a></p>'
               '<ul style="list-style:none;display:flex;flex-wrap:wrap;gap:.6rem 1.5rem;padding:0;margin:1.2rem 0 0">%s</ul></div>') % (
               len(hosp), n_city, G, "".join('<li><a href="%s" style="color:var(--mint)">%s</a></li>' % (a, esc(b)) for b, a in hl))
        hc = ""
        for p in hosp:
            h = HOSP_BY_SLUG.get(p["slug"])
            href = hosp_url(h) if h else "%s/properties/%s" % (EN_SITE, p["slug"])
            hc += card(href, photo(p), "Клиника", "🇨🇳 " + loc(p.get("island")), ru(p.get("translations"), "name", p["name"]), "")
        med += H("Клиники-партнёры", "%d клиник в %d городах. Конкретная клиника подбирается после разбора случая." % (len(hosp), n_city)) + '<div class="dest-grid">' + hc + '</div>' + \
               '<p style="text-align:center;margin:2.5rem 0 0"><a href="/lechenie-v-kitae/#case" class="btn btn-mint">Отправить медицинский запрос →</a></p>\n'
        title_h1 = "%s %s — велнес, ретриты и лечение" % (flag, cru)
        sub = "Велнес-программы, традиционные практики, медицинские услуги и проверенные партнёры Dream Islands в Китае — от Юньнани и Хайнаня до Сианя, Пекина и Шанхая."
        sect = H("Велнес в Китае", "%d %s: от лесных термальных источников Юньнани до даосских практик горы Уданг." % (n_dest, plural(n_dest, "направление", "направления", "направлений")))
        meta_desc = "Китай: велнес-программы в Юньнани, на Хайнане, в Хуэйчжоу и на горе Уданг, организация лечения в %d клиниках Пекина, Шанхая, Чэнду, Гуанчжоу и Сианя. Dream Islands и Better Migrate." % len(hosp)
        meta_title = "Китай: велнес, ретриты и лечение для иностранцев | Dream Islands"
    else:
        title_h1 = "%s %s — велнес и восстановление" % (flag, cru)
        sub = "%s: %d %s и %d %s восстановления, оздоровления и спорта от партнёров Dream Islands." % (
            cru, n_dest, plural(n_dest, "направление", "направления", "направлений"), n_prog, plural(n_prog, "программа", "программы", "программ"))
        sect = H("Направления", "")
        meta_desc = "%s — велнес-направления Dream Islands: %d %s и %d %s восстановления, детокса, спорта и оздоровления." % (
            cru, n_dest, plural(n_dest, "направление", "направления", "направлений"), n_prog, plural(n_prog, "программа", "программы", "программ"))
        meta_title = "%s — велнес-направления и программы | Dream Islands" % cru
    stats = '<div style="display:flex;flex-wrap:wrap;gap:1rem 2.5rem;justify-content:center;margin:0 0 1rem">%s</div>' % "".join(stat(n, l) for n, l in stats_items)
    prog_h = H("Популярные программы" if n_prog > 8 else "Программы", "Показаны %d из %d %s." % (len(feat), n_prog, plural(n_prog, "программы", "программ", "программ")) if n_prog > 8 else "")
    more = '<p style="text-align:center;margin:1.5rem 0 0"><a href="/programs/" class="btn">Все программы →</a></p>' if n_prog > 8 else ""
    body = ('  <div class="dest-header" data-hub-v2="1">\n  <a href="/destinations/" style="display:inline-block;margin-bottom:1.5rem;color:var(--mint);text-decoration:none;font-size:.85rem">← Все направления</a>\n'
            '    <div class="dest-eyebrow">Dream Islands · %s</div>\n    <h1 class="dest-title">%s</h1>\n    <p class="dest-sub">%s</p>\n  </div>\n' % (esc(cru), esc(title_h1), esc(sub)) +
            stats + sect + '<div class="dest-grid">' + dest_cards + '</div>' + prog_h + '<div class="dest-grid">' + prog_cards + '</div>' + more + med)
    return body, meta_title, meta_desc, (n_dest, n_prog)

if "hubs" in ONLY:
    for country, (cru, flag, d) in COUNTRIES.items():
        path = ROOT + "/destinations/%s/index.html" % d
        if not os.path.exists(path): print("SKIP hub (no file):", path); continue
        s = open(path, encoding="utf-8").read()
        start = s.find('  <div class="dest-header"')
        end = s.find('</div><div style="max-width:1000px;margin:1rem auto 3rem;padding:0 2rem" data-medlink="1">')
        if end < 0: end = s.rfind("</div></main>")
        if start < 0 or end < 0 or end < start: print("ANCHOR FAIL hub", country); continue
        body, mtitle, mdesc, (nd, npg) = hub_body(country)
        s2 = s[:start] + body + s[end:]
        s2 = re.sub(r"<title>.*?</title>", lambda m: "<title>%s</title>" % esc(mtitle), s2, count=1, flags=re.S)
        s2 = re.sub(r'<meta name="description" content="[^"]*">', lambda m: '<meta name="description" content="%s">' % esc(mdesc), s2, count=1)
        if not DRY: backup(path, "hub"); put(path, s2)
        touched.add("/destinations/%s/" % d)
        print("%s hub %s: destinations=%d programs=%d" % ("WOULD REBUILD" if DRY else "rebuilt", d, nd, npg))

# ============ 3b. /destinations/ index: country cards from destination_countries + live counts
def index_cards():
    rows = qall("destination_countries", select="*", active="eq.true", order="sort_order.asc")
    out, n_active = [], 0
    for r in rows:
        cp = [p for p in props if p["country"] == r["country"]]
        wellness = [p for p in cp if p["entity_type"] == "wellness_property"]
        hosp = [p for p in cp if p["entity_type"] == "hospital_clinic"]
        wprogs = progs_of_props({p["id"] for p in wellness})
        if not wellness: continue
        n_active += 1
        wellness.sort(key=lambda p: (-sum(1 for g in wprogs if p["id"] in by_prog.get(g["id"], set())), p["name"]))
        img = r.get("hero_image_url") or next((photo(p) for p in wellness if photo(p)), None)
        img_html = ('<div class="dest-card__img"><img src="%s" alt="%s"></div>' % (esc(img), esc(r["name_ru"]))) if img else '<div class="dest-card__img dest-card__img--icon">🌏</div>'
        areas = []
        for p in wellness:
            a = loc((p.get("island") or "").split(",")[-1])
            if a and a not in areas: areas.append(a)
        if hosp: areas.append("медицинская сеть по %s" % ("Китаю" if r["country"] == "China" else r["name_ru"]))
        n_dest, n_prog = len(wellness), len(wprogs)
        count = "%d %s · %d %s" % (n_dest, plural(n_dest, "направление", "направления", "направлений"), n_prog, plural(n_prog, "программа", "программы", "программ"))
        if hosp: count += " · %d %s" % (len(hosp), plural(len(hosp), "клиника", "клиники", "клиник"))
        out.append(
            '    <a href="/destinations/%s/" class="dest-card">\n      %s\n      <div class="dest-card__body">\n'
            '        <div class="dest-card__country">%s %s</div>\n        <div class="dest-card__pos">%s</div>\n        <div class="dest-card__reason">%s</div>\n'
            '        <div class="dest-card__outcomes"><b>Сюда стоит ехать за:</b>%s</div>\n'
            '        <div class="dest-card__areas"><b>%s:</b>%s</div>\n        <div class="dest-card__areas"><b>В каталоге:</b>%s</div>\n'
            '        <span class="dest-card__cta">%s</span>\n      </div>\n    </a>\n' % (
                r["slug"], img_html, r.get("flag") or "", esc(r["name_ru"]), esc(r.get("positioning_ru") or ""), esc(r.get("reason_ru") or ""),
                esc(r.get("outcomes_ru") or ""), "Основные места" if len(areas) > 1 else "Основное место", esc(" · ".join(areas)), count,
                esc(ru(r.get("translations"), "cta", "Смотреть →"))))
    return "\n".join(out), n_active

if "index" in ONLY:
    ip = ROOT + "/destinations/index.html"
    s = open(ip, encoding="utf-8").read()
    gs = s.find('  <div class="dest-grid">')
    ge = s.rfind("</div></main>")
    if gs < 0 or ge < 0 or ge < gs:
        print("ANCHOR FAIL /destinations/ index")
    else:
        cards, n_c = index_cards()
        s2 = s[:gs] + '  <div class="dest-grid">\n\n' + cards + '\n  </div>\n' + s[ge:]
        word = plural(n_c, "страна", "страны", "стран")
        gen = {1: "страны", 2: "стран"}
        s2 = re.sub(r"(<strong>)\d+ стран\w* Азии", lambda m: "%s%d %s Азии" % (m.group(1), n_c, plural(n_c, "страна", "страны", "стран")), s2, count=1)
        s2 = re.sub(r'(<meta name="description" content=")\d+ стран\w* Азии', lambda m: "%s%d %s Азии" % (m.group(1), n_c, plural(n_c, "страна", "страны", "стран")), s2, count=1)
        if not DRY: backup(ip, "index"); put(ip, s2)
        touched.add("/destinations/")
        print("%s /destinations/ index: %d countries" % ("WOULD REBUILD" if DRY else "rebuilt", n_c))

# ============ 4. counters on /programs/
if "counters" in ONLY:
    total = len(progs)
    n_countries = len({p["country"] for p in props if p["entity_type"] == "wellness_property"})
    pp = ROOT + "/programs/index.html"
    s = open(pp, encoding="utf-8").read()
    pat = re.compile(r"\d+ програм\w* в \d+ стран\w* Азии")
    new = "%d %s в %d %s Азии" % (total, plural(total, "программа", "программы", "программ"), n_countries, plural(n_countries, "стране", "странах", "странах"))
    if pat.search(s):
        if not DRY: backup(pp, "counters"); put(pp, pat.sub(new, s))
        touched.add("/programs/")
        print("%s /programs/ counters: %s" % ("WOULD SET" if DRY else "set", new))
    else:
        print("counters pattern not found on /programs/")

    # ---- home + about: every counter is computed from the DB (no hardcode)
    n_obj = len([p for p in props if p["entity_type"] == "wellness_property"])      # wellness storefront: selected objects = active wellness properties only (clinics are counted separately, see n_clin)
    n_clin = len([p for p in props if p["entity_type"] == "hospital_clinic"])       # medical entities, shown as a separate figure where needed
    w_prog = plural(total, "программа", "программы", "программ")
    w_obj = plural(n_obj, "отобранный объект", "отобранных объекта", "отобранных объектов")
    w_cty = plural(n_countries, "страна", "страны", "стран")
    w_cty2 = plural(n_countries - 2, "страна", "страны", "стран")
    subs = [
        (r'(h3-traction__n">)\d+(</div><div class="h3-traction__l">отобран)', lambda m: "%s%d%s" % (m.group(1), n_obj, m.group(2))),
        (r'(h3-traction__n">)\d+(</div><div class="h3-traction__l">програм)', lambda m: "%s%d%s" % (m.group(1), total, m.group(2))),
        (r'(h3-traction__n">)\d+(</div><div class="h3-traction__l">стран)', lambda m: "%s%d%s" % (m.group(1), n_countries, m.group(2))),
        (r'(h3-traction__l">)отобран\w* объект\w*', lambda m: m.group(1) + w_obj),
        (r'(h3-traction__l">)програм\w*', lambda m: m.group(1) + w_prog),
        (r'(h3-traction__l">)стран\w*', lambda m: m.group(1) + w_cty),
        (r'\d+ програм\w* · \d+ отобранн\w* объект\w* · \d+ стран\w*', lambda m: "%d %s · %d %s · %d %s" % (total, w_prog, n_obj, w_obj, n_countries, w_cty)),
        (r'ещё \d+ стран\w* Азии', lambda m: "ещё %d %s Азии" % (n_countries - 2, w_cty2)),
        (r'\d+ програм\w*, \d+ объект\w*, \d+ стран\w*', lambda m: "%d %s, %d %s, %d %s" % (total, w_prog, n_obj, plural(n_obj, "объект", "объекта", "объектов"), n_countries, w_cty)),
        (r'(<h2[^>]*>)\d+ стран\w* Азии', lambda m: "%s%d %s Азии" % (m.group(1), n_countries, w_cty)),
        (r'(в )\d+ (стран\w*) Азии', lambda m: "%s%d %s Азии" % (m.group(1), n_countries, plural(n_countries, "стране", "странах", "странах"))),
    ]
    for rel in ("/index.html", "/about/index.html"):
        fp = ROOT + rel
        if not os.path.exists(fp): continue
        s = open(fp, encoding="utf-8").read(); s2 = s; hits = 0
        for pat, fn in subs:
            s2, k = re.subn(pat, fn, s2); hits += k
        if s2 != s:
            if not DRY: backup(fp, "counters"); put(fp, s2)
            touched.add("/" if rel == "/index.html" else "/about/")
        print("%s %s counters: %d replacements -> programs=%d wellness_objects=%d countries=%d (clinics=%d, separate)" % ("WOULD SET" if DRY else "set", rel, hits, total, n_obj, n_countries, n_clin))

# ============ 4b. hero audit (programs): own / property / destination / global
if "audit" in ONLY or ONLY >= {"hubs"}:
    cnt = {"own": 0, "property": 0, "destination": 0, "global": 0}
    detail = {"destination": [], "global": []}
    for g in progs:
        u, src = resolve_prog_image(g); cnt[src] += 1
        if src in detail: detail[src].append(g["slug"])
    print("---- HERO AUDIT (programs)")
    print("Programs total:                %d" % len(progs))
    print("Own hero:                      %d" % cnt["own"])
    print("Inherited from property:       %d" % cnt["property"])
    print("Inherited from destination:    %d  %s" % (cnt["destination"], ", ".join(detail["destination"])))
    print("Global fallback:               %d  %s" % (cnt["global"], ", ".join(detail["global"])))
    print("No image / emoji:              %d" % sum(1 for g in progs if not resolve_prog_image(g)[0]))
    # cross-property: a program showing a photo of a property it is not linked to (must be 0)
    def _folder(u):
        m = re.search(r"/public/properties/([^/]+)/", u or ""); return m.group(1) if m else None
    cross = []
    for g in progs:
        u, src = resolve_prog_image(g)
        f = _folder(u)
        if src in ("destination", "global") and f: cross.append(g["slug"])
    print("Cross-property hero:           %d  %s" % (len(cross), ", ".join(cross)))
    print("SUMMARY  Own %d | Property %d | Destination(neutral) %d | Global %d | Cross-property %d" % (cnt["own"], cnt["property"], cnt["destination"], cnt["global"], len(cross)))
    pc = {"own": 0, "destination": 0, "global": 0}
    for p in props:
        if p["entity_type"] == "wellness_property": pc[resolve_prop_image(p)[1]] += 1
    print("Wellness properties: own photo %d, from destination %d, global %d" % (pc["own"], pc["destination"], pc["global"]))
    # resolved hero map for client-side pages (program-detail.js, programs.js): slug -> url
    hm = {g["slug"]: resolve_prog_image(g)[0] for g in progs}
    hp = ROOT + "/data/program-heroes.json"
    put(hp, json.dumps(hm, ensure_ascii=False, indent=0, sort_keys=True))
    print("%s %s (%d programs)" % ("WOULD WRITE" if DRY else "wrote", hp, len(hm)))

# ============ 5. sitemap
# Full sync from the DB: every published program / wellness property / country hub that has a page on disk is listed;
# pages rebuilt in this run get lastmod=today; existing entries (guides, clinics, ...) are kept untouched; noindex pages are skipped.
if "sitemap" in ONLY or ONLY >= {"hubs"}:
    sm_path = ROOT + "/sitemap.xml"
    sm = open(sm_path, encoding="utf-8").read()
    entry_re = re.compile(r"\s*<url>\s*<loc>(.*?)</loc>(.*?)</url>", re.S)
    entries = {}                                   # path -> [lastmod, changefreq, priority]
    for m in entry_re.finditer(sm):
        loc_ = m.group(1).strip(); body_ = m.group(2)
        g_ = lambda tag: (re.search(r"<%s>(.*?)</%s>" % (tag, tag), body_) or [None, None])[1]
        entries[loc_.replace(SITE_RU, "")] = [g_("lastmod") or TODAY, g_("changefreq") or "monthly", g_("priority") or "0.7"]
    def page_ok(path):
        f = ROOT + path + "index.html"
        if os.path.exists(f):
            try: return "noindex" not in open(f, encoding="utf-8").read(6000).lower()
            except Exception: return True
        return DRY and (path in created_dests or path.startswith("/programs/") and path.strip("/").split("/")[-1] in created_progs)
    want = [("/destinations/", "weekly", "0.9"), ("/programs/", "weekly", "0.9")]
    want += [("/destinations/%s/" % d, "weekly", "0.9") for (_, _, d) in COUNTRIES.values()]
    want += [("/programs/%s/" % g["slug"], "monthly", "0.7") for g in progs]
    want += [("/destinations/%s/" % p["slug"], "monthly", "0.7") for p in props if p["entity_type"] == "wellness_property"]
    added = refreshed = 0
    for path, cf, pr in want:
        if not page_ok(path): continue
        if path not in entries:
            f_ = ROOT + path + "index.html"
            lm_ = datetime.date.fromtimestamp(os.path.getmtime(f_)).isoformat() if os.path.exists(f_) else TODAY   # real file date, not "today"
            entries[path] = [lm_, cf, pr]; added += 1
        elif path in touched or path in created_dests or path.strip("/").split("/")[-1] in created_progs:
            if entries[path][0] != TODAY: entries[path][0] = TODAY; refreshed += 1
    for path in touched:                           # rebuilt pages that are not DB-driven entries (safety)
        if path in entries and entries[path][0] != TODAY: entries[path][0] = TODAY; refreshed += 1
    slugs_live = {g["slug"] for g in progs}
    for path in entries:                           # report only, never delete automatically
        parts = path.strip("/").split("/")
        if len(parts) == 2 and parts[0] == "programs" and parts[1] not in slugs_live:
            print("SITEMAP STALE? (program not published in DB): %s" % path)
    out = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path, (lm, cf, pr) in entries.items():
        out.append("  <url><loc>%s%s</loc><lastmod>%s</lastmod><changefreq>%s</changefreq><priority>%s</priority></url>" % (SITE_RU, path, lm, cf, pr))
    out.append("</urlset>\n")
    print("%s sitemap.xml: +%d new URLs, %d lastmod refreshed, %d total" % ("WOULD UPDATE" if DRY else "updated", added, refreshed, len(entries)))
    if not DRY and (added or refreshed):
        backup(sm_path, "sitemap"); open(sm_path, "w", encoding="utf-8").write("\n".join(out))
print("DONE" + (" (dry run, nothing written)" if DRY else ""))
