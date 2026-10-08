#!/usr/bin/env python3
# Run ON the RU VPS:  python3 /root/build_ru_china.py   (needs /root/build_ru_medical.py)
# Rebuilds /destinations/china/ as a China hub (7 wellness places, featured programs, separate medical block, clinics),
# and updates the China card on /destinations/. Cards for places without an RU destination page link to the most relevant
# published program (RU page if it exists, otherwise the EN program page); swap hrefs in DEST when destination pages appear.
import os, re, shutil, html

src = open("/root/build_ru_medical.py", encoding="utf-8").read()
exec(compile(src.split("pages = [build_pillar()")[0], "head", "exec"), globals())

CH = ROOT + "/destinations/china/index.html"
IDX = ROOT + "/destinations/index.html"
S = "https://xbzrtofanbrahasxbisf.supabase.co/storage/v1/object/public/properties/"
G = "/lechenie-v-kitae/gidy/"
EN_SITE = "https://dreamislands.org"

# --- counts: edit here when the catalog changes (DB on 2026-10-06: 7 wellness properties, 21 wellness programs, 2 medical packages)
N_WELLNESS_PROGRAMS = 21

def prog_href(slug):
    return "/programs/%s/" % slug if os.path.isdir(ROOT + "/programs/" + slug) else "%s/programs/%s" % (EN_SITE, slug)

def ext(href): return ' target="_blank" rel="noopener"' if href.startswith("http") else ""

# --- 7 wellness places: (href, image, badge, location, name, description). href: RU destination page or most relevant program.
DEST = [
 ("/destinations/mile-wellness-resort/", S + "mile/mile-property-hero.jpg", "Юньнань", "🇨🇳 Миле, Юньнань", "Курорт Mile Wellness",
  "Лесные термальные источники, движение, питание, SPA и управление здоровьем. Пребывание не заменяет медицинскую диагностику и лечение."),
 ("/destinations/wudang-mountain-wellness-center/", S + "wudang/wudang-property-hero.webp", "Уданг", "🇨🇳 Хубэй, гора Уданг", "Центр велнеса горы Уданг",
  "Даосский велнес-центр на священной горе: тайцзи, цигун, медитация и традиционная китайская медицина."),
 (prog_href("xian-wudang-wellness-journey-11d"), S + "xian-wudang/gallery-v2/xian-bell-tower-night.webp", "Сиань", "🇨🇳 Сиань, Шэньси", "Four Points by Sheraton Сиань, Колокольная башня",
  "Отель в центре Сианя. Программа: Сиань и Уданшань, велнес-путешествие на 11 дней."),
 (prog_href("puer-forest-tea-wellness"), S + "yunnan/puer/yunnan-puer-forest-base-aerial-lake-01.png", "Юньнань", "🇨🇳 Пуэр, Юньнань", "Лесная wellness-база в Пуэре",
  "Велнес в лесах Пуэра и чайной культуре, 5 дней."),
 (prog_href("xishuangbanna-hotsprings-dai-wellness"), S + "yunnan/wyndham-jinghong/wyndham-jinghong-resort-pool-and-main-building-xishuangbanna-yunnan-01.png", "Юньнань", "🇨🇳 Сишуанбаньна, Юньнань", "Курортный отель Wyndham Jinghong",
  "Горячие источники Сишуанбаньна и культура народа Дай, 5 дней."),
 (prog_href("sanya-island-tcm-wellness"), None, "Хайнань", "🇨🇳 Санья, Хайнань", "Прибрежный велнес-курорт в Санье",
  "Остров Санья и велнес ТКМ, 10 дней. Фото курорта готовятся."),
 (prog_href("huizhou-lingnan-lakeside-wellness"), S + "huizhou/wellness-tour/01-huizhou-guangdong-china-morning-wellness-exercise-group.jpg", "Гуандун", "🇨🇳 Хуэйчжоу, Гуандун", "Отель у озера Линнань, Хуэйчжоу",
  "Велнес у озера в стиле Линнань, 6 дней."),
]

FEATURED = [  # slug, ru name, days, image, place
 ("mile-3d2n-detox-anti-aging", "Детокс и антивозрастной", 3, S + "mile/mile-detox-antiaging.jpg", "Mile Wellness"),
 ("mile-5d4n-wellness-escape", "Велнес-побег, 5 дней 4 ночи", 5, S + "mile/mile-wellness-escape.jpg", "Mile Wellness"),
 ("mile-7d6n-deep-recovery", "Глубокое восстановление", 7, S + "mile/mile-deep-recovery.jpg", "Mile Wellness"),
 ("mile-medical-wellness-journey", "Медицинское велнес-путешествие", 14, S + "mile/mile-medical-journey.jpg", "Mile Wellness"),
 ("wudang-3-day-mind-reset", "Сброс разума на Уданге", 3, S + "xian-wudang/gallery-v2/wudang-taoist-temple-courtyard.webp", "Уданг"),
 ("wudang-5-day-dao-wellness", "Даосский велнес", 5, S + "xian-wudang/gallery-v2/wudang-taoist-cultural-performance.webp", "Уданг"),
 ("wudang-7-day-tai-chi-longevity", "Тайцзи и долголетие", 7, S + "xian-wudang/gallery-v2/wudang-mountain-panorama.webp", "Уданг"),
 ("xian-wudang-wellness-journey-11d", "Сиань и Уданшань: велнес-путешествие", 11, S + "xian-wudang/gallery-v2/wudang-mountain-landscape.webp", "Сиань + Уданг"),
]

def days(d): return "%d %s" % (d, "день" if d % 10 == 1 and d != 11 else ("дня" if d % 10 in (2, 3, 4) and d not in (12, 13, 14) else "дней"))

def card(href, img, badge, country, name, desc, emoji=""):
    if img:
        im = '<div class="dest-card__img"><img src="%s" alt="%s" loading="lazy"><div class="dest-card__badge">%s</div></div>' % (esc(img), esc(name), esc(badge))
    else:
        im = '<div class="dest-card__img" style="display:flex;align-items:center;justify-content:center;font-size:5rem">%s<div class="dest-card__badge">%s</div></div>' % (emoji, esc(badge))
    return ('<a href="%s" class="dest-card"%s>%s<div class="dest-card__body"><div class="dest-card__country">%s</div>'
            '<div class="dest-card__name">%s</div><div class="dest-card__desc">%s</div></div></a>') % (href, ext(href), im, esc(country), esc(name), esc(desc))

H = lambda t, sub="": ('<h2 style="font-family:Optima,Georgia,serif;color:#fff;font-size:1.6rem;margin:3rem 0 .4rem">%s</h2>' % t) + \
                      (('<p style="color:var(--text-dim);margin-bottom:.5rem">%s</p>' % sub) if sub else "")

n_dest, n_hosp = len(DEST), len(HOSP)
n_city = len(set(h[4] for h in HOSP))
n_pack = len([s for s in ("bm-package-a-outpatient-fast-track", "bm-package-b-surgery-full-process") if os.path.isdir(ROOT + "/programs/" + s)]) or 2

stats = ('<div style="display:flex;flex-wrap:wrap;gap:1rem 2.5rem;justify-content:center;margin:0 0 1rem">' +
         "".join('<div style="text-align:center"><div style="font-size:1.8rem;font-family:Optima,Georgia,serif;color:var(--mint)">%s</div><div style="font-size:.82rem;color:var(--text-dim)">%s</div></div>' % (n, l)
                 for n, l in [(n_dest, "велнес-направлений"), (N_WELLNESS_PROGRAMS, "велнес-программ"), (n_hosp, "клиник-партнёров"), (n_pack, "медицинских пакета")]) + '</div>')

dest_cards = "".join(card(h, i, b, c, n, d, "🏝️") for h, i, b, c, n, d in DEST)
prog_cards = "".join(card(prog_href(s), img, place, days(d), name, "") for s, name, d, img, place in FEATURED)

medical_block = (
  '<div style="margin:3rem 0 0;padding:2rem;border:1px solid rgba(174,225,192,.3);border-radius:14px;background:var(--panel)">'
  '<div class="dest-eyebrow" style="margin-bottom:.6rem">Медицина</div>'
  '<h2 style="font-family:Optima,Georgia,serif;color:#fff;font-size:1.8rem;margin:0 0 .8rem">Лечение в Китае</h2>'
  '<p style="color:var(--text-dim);max-width:760px;line-height:1.7">%d клиник-партнёров в Пекине, Шанхае, Чэнду, Гуанчжоу и Сиане. Подбор клиники и специалиста, дистанционное второе мнение, сопровождение медицинского кейса и организация лечения. '
  'Сервис: амбулаторный визит 3 500 RMB (≈ $521), сопровождение операции от 18 000 RMB (от ≈ $2 679); расходы клиники оплачиваются отдельно. Лечение осуществляют лицензированные клиники и врачи, результат не гарантируется.</p>'
  '<p style="margin-top:1.2rem"><a href="/lechenie-v-kitae/" class="btn btn-mint">Лечение в Китае →</a> &nbsp; <a href="%svtoroe-mnenie/" class="btn">Дистанционное второе мнение</a></p>'
  '<ul style="list-style:none;display:flex;flex-wrap:wrap;gap:.6rem 1.5rem;padding:0;margin:1.2rem 0 0">%s</ul></div>') % (
  n_hosp, G, "".join('<li><a href="%s" style="color:var(--mint)">%s</a></li>' % (p, esc(n)) for n, p in [
    ("Стоимость лечения в Китае", G + "stoimost-lecheniya-v-kitae/"), ("Как организовать лечение", G + "kak-organizovat-lechenie-v-kitae/"),
    ("Как выбрать клинику", G + "kak-vybrat-kliniku-v-kitae/"), ("Клиники для иностранных пациентов", G + "kliniki-kitaya-dlya-inostrantsev/")]))

hosp_cards = "".join(card(hosp_url(h), hosp_img(h), "Клиника", "🇨🇳 %s" % h[4], h[2], "") for h in HOSP)

body = (
  '  <div class="dest-header" data-china-v2="1">\n'
  '  <a href="/destinations/" style="display:inline-block;margin-bottom:1.5rem;color:var(--mint);text-decoration:none;font-size:.85rem">← Все направления</a>\n'
  '    <div class="dest-eyebrow">Dream Islands · Азия</div>\n'
  '    <h1 class="dest-title">🇨🇳 Китай — велнес, ретриты и лечение</h1>\n'
  '    <p class="dest-sub">Велнес-программы, традиционные практики, медицинские услуги и проверенные партнёры Dream Islands в Китае — от Юньнани и Хайнаня до Сианя, Пекина и Шанхая.</p>\n'
  '  </div>\n' + stats +
  H("Велнес в Китае", "%d направлений: от лесных термальных источников Юньнани до даосских практик горы Уданг." % n_dest) + '<div class="dest-grid">' + dest_cards + '</div>' +
  H("Популярные программы", "Избранные программы из %d велнес-программ Китая." % N_WELLNESS_PROGRAMS) + '<div class="dest-grid">' + prog_cards + '</div>' +
  '<p style="text-align:center;margin:1.5rem 0 0"><a href="/programs/" class="btn">Все программы Китая →</a></p>' +
  medical_block +
  H("Клиники-партнёры", "%d клиник в %d городах. Конкретная клиника подбирается после разбора случая." % (n_hosp, n_city)) +
  '<div class="dest-grid">' + hosp_cards + '</div>' +
  '<p style="text-align:center;margin:2.5rem 0 0"><a href="/lechenie-v-kitae/#case" class="btn btn-mint">Отправить медицинский запрос →</a></p>\n')

s = open(CH, encoding="utf-8").read()
start = s.find('  <div class="dest-header">')
end = s.find('</div><div style="max-width:1000px;margin:1rem auto 3rem;padding:0 2rem" data-medlink="1">')
if start < 0 or end < 0 or end < start:
    print("ANCHOR FAIL", start, end); raise SystemExit(1)
shutil.copy(CH, BACKUP + "/destinations__china.index.html.bak2")
s = s[:start] + body + s[end:]
s = re.sub(r'<meta name="description" content="[^"]*">',
           '<meta name="description" content="Китай: велнес-программы в Юньнани, на Хайнане, в Хуэйчжоу и на горе Уданг, организация лечения в 9 клиниках Пекина, Шанхая, Чэнду, Гуанчжоу и Сианя. Dream Islands и Better Migrate.">', s, count=1)
s = s.replace("<title>Китай — велнес и медицина | Dream Islands</title>", "<title>Китай: велнес, ретриты и лечение для иностранцев | Dream Islands</title>", 1)
open(CH, "w", encoding="utf-8").write(s)
print("china hub rebuilt: wellness places=%d, programs shown=%d (total %d), clinics=%d, cities=%d" % (n_dest, len(FEATURED), N_WELLNESS_PROGRAMS, n_hosp, n_city))

# /destinations/ China card
t = open(IDX, encoding="utf-8").read()
m = re.search(r'(<a href="/destinations/china/" class="dest-card">.*?Смотреть Китай)', t, re.S)
if not m:
    print("destinations index: China card not found"); raise SystemExit(1)
blk = m.group(1)
nb = re.sub(r'<div class="dest-card__reason">.*?</div>',
            '<div class="dest-card__reason">Самое широкое направление Dream Islands: велнес-программы в Юньнани, на Хайнане, в Хуэйчжоу и на горе Уданг, традиционные китайские практики и организация лечения в 9 клиниках Пекина, Шанхая, Чэнду, Гуанчжоу и Сианя.</div>', blk, count=1, flags=re.S)
nb = re.sub(r'(<div class="dest-card__areas"><b>Основные места:</b>).*?(</div>)',
            r'\1Юньнань · Сиань · Уданг · Хайнань · Хуэйчжоу · медицинская сеть по Китаю\2', nb, count=1, flags=re.S)
if nb != blk:
    shutil.copy(IDX, BACKUP + "/destinations__index.html.bak2")
    open(IDX, "w", encoding="utf-8").write(t.replace(blk, nb, 1))
    print("destinations index: China card updated")
else:
    print("destinations index: no change")
print("DONE")
