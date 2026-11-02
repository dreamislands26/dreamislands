#!/usr/bin/env python3
"""Translate the desktop home page (HomeV2) and the hero search (HeroSearch) for /zh and /id.
Strings are wrapped as t("English text") (English text is the key). HomeV2 is a server component (getT),
HeroSearch is a client component (useT, named `tr` because `t` is already the tripsearch css module there).
Needs apply_i18n_core.py, apply_i18n_nav.py, apply_i18n_chrome.py first. Idempotent, anchor-checked, with backup.
Usage: python3 apply_i18n_home.py /opt/dit-platform/src"""
import json, pathlib, shutil, sys, time

src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/opt/dit-platform/src")
pub = src / "app/(public)"
home = pub / "_components/HomeV2.tsx"
hero = pub / "ds/HeroSearch.tsx"
msgs = {k: src / f"messages/{k}.json" for k in ("zh", "id")}
for f in (home, hero, *msgs.values(), src / "lib/i18n-server.ts"):
    if not f.exists():
        sys.exit(f"MISSING FILE: {f} (apply the earlier i18n patches first)")

th, tr_ = home.read_text(encoding="utf-8"), hero.read_text(encoding="utf-8")
if 'import { getT } from "@/lib/i18n-server"' in th:
    print("skip (already patched)")
    sys.exit(0)

HOME = [
    ('import HomeMobile from "./HomeMobile"\n', 'import HomeMobile from "./HomeMobile"\nimport { getT } from "@/lib/i18n-server"\n', 1),
    ("export default function HomeV2(", "export default async function HomeV2(", 1),
    ("  const byCountry = COUNTRIES.map((c) => {\n", "  const t = await getT()\n  const byCountry = COUNTRIES.map((c) => {\n", 1),
    # hero
    ('<span className={h.heroKicker}>Outcome-driven wellness travel in Asia</span>', '<span className={h.heroKicker}>{t("Outcome-driven wellness travel in Asia")}</span>', 1),
    ('<h1 className="ds-display-l">Feel different when you come back.</h1>', '<h1 className="ds-display-l">{t("Feel different when you come back.")}</h1>', 1),
    ('<p className={h.heroLead}>Take a 2-minute Wellness Journey, get matched with a programme, and see your Wellness Score change after the trip.</p>',
     '<p className={h.heroLead}>{t("Take a 2-minute Wellness Journey, get matched with a programme, and see your Wellness Score change after the trip.")}</p>', 1),
    ('<JourneyPrompt title="Not sure where to start?" sub="Your Wellness Journey: 23 short questions, about 2 minutes. We match programmes to your result." cta="Start your Wellness Journey" />',
     '<JourneyPrompt title={t("Not sure where to start?")} sub={t("Your Wellness Journey: 23 short questions, about 2 minutes. We match programmes to your result.")} cta={t("Start your Wellness Journey")} />', 1),
    # tracks
    ('<p className={h.overline}>Five tracks</p>', '<p className={h.overline}>{t("Five tracks")}</p>', 1),
    ('<h2 className="ds-headline-l">What do you want to change?</h2>', '<h2 className="ds-headline-l">{t("What do you want to change?")}</h2>', 1),
    ('title={g.chip} hook={GOAL_COPY[k].hook} count={`${n} ${n === 1 ? "programme" : "programmes"}`}',
     'title={t(g.chip)} hook={t(GOAL_COPY[k].hook)} count={t(n === 1 ? "{n} programme" : "{n} programmes", { n })}', 1),
    # how it works
    ('<p className={h.overline}>How Dream Islands works</p>', '<p className={h.overline}>{t("How Dream Islands works")}</p>', 1),
    ('<h2 className="ds-headline-l">Before. During. After.</h2>', '<h2 className="ds-headline-l">{t("Before. During. After.")}</h2>', 1),
    ('<h3 className="ds-title-l">{st.h}</h3>', '<h3 className="ds-title-l">{t(st.h)}</h3>', 1),
    ('<p className="ds-body-l">{st.t}</p>', '<p className="ds-body-l">{t(st.t)}</p>', 1),
    # programs
    ('<Facts items={["Real programmes", String(programs.length)]} />', '<Facts items={[t("Real programmes"), String(programs.length)]} />', 1),
    ('<h2 className="ds-headline-l">Programmes built around real outcomes</h2>', '<h2 className="ds-headline-l">{t("Programmes built around real outcomes")}</h2>', 1),
    # destinations
    ('<p className={h.overline}>{COUNTRIES.length} countries</p>', '<p className={h.overline}>{t("{n} countries", { n: COUNTRIES.length })}</p>', 1),
    ("<h2 className=\"ds-headline-l\">Where you&apos;ll go</h2>", "<h2 className=\"ds-headline-l\">{t(\"Where you'll go\")}</h2>", 1),
    ("                name={r.c}\n", "                name={t(r.c)}\n", 1),
    ('r.c === "Thailand" ? "Tanya Samui, our flagship since 2009" : "Daoist mountains and hot springs"',
     't(r.c === "Thailand" ? "Tanya Samui, our flagship since 2009" : "Daoist mountains and hot springs")', 1),
    ('from={r.min ? `from ${money(r.min)}` : null}', 'from={r.min ? t("from {price}", { price: money(r.min) }) : null}', 1),
    ("count={`${r.list.length} programmes`}", 'count={t("{n} programmes", { n: r.list.length })}', 1),
    ('<p className={h.overline}>Five more countries</p>', '<p className={h.overline}>{t("Five more countries")}</p>', 1),
    ('<h2 className="ds-headline-l">Beyond Thailand and China</h2>', '<h2 className="ds-headline-l">{t("Beyond Thailand and China")}</h2>', 1),
    ('<span className="ds-title-l">{r.c}</span>', '<span className="ds-title-l">{t(r.c)}</span>', 1),
    ('r.list.length ? `${r.list.length} ${r.list.length === 1 ? "programme" : "programmes"}` : null',
     'r.list.length ? t(r.list.length === 1 ? "{n} programme" : "{n} programmes", { n: r.list.length }) : null', 1),
    ('<span className={h.soon}>Coming soon</span>', '<span className={h.soon}>{t("Coming soon")}</span>', 1),
    # flagship
    ('<Facts items={["Our flagship", "Koh Samui, Thailand"]} />', '<Facts items={[t("Our flagship"), t("Koh Samui, Thailand")]} />', 1),
    ('<p className="ds-body-l">An oasis of health and longevity on Koh Samui since 2009. Three spaces, one protocol: the holistic retreat, a wellness center and a preventive medicine clinic.</p>',
     '<p className="ds-body-l">{t("An oasis of health and longevity on Koh Samui since 2009. Three spaces, one protocol: the holistic retreat, a wellness center and a preventive medicine clinic.")}</p>', 1),
    ("<span>programmes</span>", '<span>{t("programmes")}</span>', 1),
    ("<span>opened</span>", '<span>{t("opened")}</span>', 1),
    ("<span>from, per person</span>", '<span>{t("from, per person")}</span>', 1),
    ('trailingIcon="arrow_forward">Explore Tanya Samui</ButtonLink>', 'trailingIcon="arrow_forward">{t("Explore Tanya Samui")}</ButtonLink>', 1),
    # promise
    ('<h2 className="ds-headline-l">No guesswork. A clear baseline, a matched stay, a measurable shift.</h2>',
     '<h2 className="ds-headline-l">{t("No guesswork. A clear baseline, a matched stay, a measurable shift.")}</h2>', 1),
    ('<ButtonLink href="/start" variant="filled" size="l">Start your Wellness Journey</ButtonLink>',
     '<ButtonLink href="/start" variant="filled" size="l">{t("Start your Wellness Journey")}</ButtonLink>', 1),
    ('target="_blank" rel="noreferrer">Message us</ButtonLink>', 'target="_blank" rel="noreferrer">{t("Message us")}</ButtonLink>', 1),
    ('<Facts items={["Your Wellness Journey", "about 2 minutes", "free"]} />', '<Facts items={[t("Your Wellness Journey"), t("about 2 minutes"), t("free")]} />', 1),
]

HERO = [
    ('import { Icon } from "./ui"\n', 'import { Icon } from "./ui"\nimport { useT } from "@/lib/i18n-client"\n', 1),
    ("  const [goals, setGoals] = useState<string[]>([])\n", "  const tr = useT()\n  const [goals, setGoals] = useState<string[]>([])\n", 1),
    (': "Sleep, stress, energy…"', ': tr("Sleep, stress, energy…")', 1),
    ('aria-label="Choose one or more goals"', 'aria-label={tr("Choose one or more goals")}', 1),
    ("<span className={s.label}>Goals</span>", '<span className={s.label}>{tr("Goals")}</span>', 1),
    ("<span className={s.label}>Where</span>", '<span className={s.label}>{tr("Where")}</span>', 1),
    ('<option value="">Any destination</option>', '<option value="">{tr("Any destination")}</option>', 1),
    ("<option key={c} value={c}>{c}</option>", "<option key={c} value={c}>{tr(c)}</option>", 1),
    ("<span className={s.label}>Start date</span>", '<span className={s.label}>{tr("Start date")}</span>', 1),
    ("<span className={s.label}>Departing from</span>", '<span className={s.label}>{tr("Departing from")}</span>', 1),
    ("<CityInput className={s.select} value={from} onChange={setFrom} />", '<CityInput className={s.select} value={from} onChange={setFrom} placeholder={tr("City")} />', 1),
    ("<span className={s.label}>How long</span>", '<span className={s.label}>{tr("How long")}</span>', 1),
    ("<option key={g.v} value={g.v}>{g.l}</option>", "<option key={g.v} value={g.v}>{tr(g.l)}</option>", 1),
    ("          Find my programme\n", '          {tr("Find my programme")}\n', 1),
]

for name, text, rules in (("HomeV2", th, HOME), ("HeroSearch", tr_, HERO)):
    for old, new, n in rules:
        if text.count(old) != n:
            sys.exit(f"ANCHOR COUNT {text.count(old)} != {n} in {name}: {old[:80]!r}")
for old, new, n in HOME:
    th = th.replace(old, new)
for old, new, n in HERO:
    tr_ = tr_.replace(old, new)

ZH = {
    "Reset & Recovery: rest, detox, sleep again.": "重置与恢复：休息、排毒、重获好睡眠。",
    "Performance: train smarter, rebuild capacity.": "高效表现：更聪明地训练，重建体能。",
    "Mind Balance: calm the nervous system.": "身心平衡：安抚神经系统。",
    "Island Immersion: longer stays that change routine.": "海岛沉浸：更长的停留，改变日常节奏。",
    "Sport & Chill: sport, recovery and leisure.": "运动与放松：运动、恢复与休闲。",
    "Take your Wellness Journey": "开启你的健康之旅",
    "23 short questions in about 2 minutes. You get a Wellness Score and matched programmes.": "约 2 分钟，23 个简短问题。你将获得健康评分和匹配的项目。",
    "Travel the programme": "体验项目",
    "A real programme in a real place, planned with a person on WhatsApp.": "真实的项目，真实的地点，由真人通过 WhatsApp 为你安排。",
    "See what changed": "看看发生了什么变化",
    "Take the Wellness Journey again after the trip and compare your Wellness Score.": "旅行结束后再次完成健康之旅，对比你的健康评分。",
    "Outcome-driven wellness travel in Asia": "亚洲以成果为导向的康养旅行",
    "Feel different when you come back.": "归来时，焕然一新。",
    "Take a 2-minute Wellness Journey, get matched with a programme, and see your Wellness Score change after the trip.": "用 2 分钟完成健康之旅，获得匹配项目，并在旅行后看到你的健康评分发生变化。",
    "Not sure where to start?": "不确定从哪里开始？",
    "Your Wellness Journey: 23 short questions, about 2 minutes. We match programmes to your result.": "你的健康之旅：23 个简短问题，约 2 分钟。我们会根据结果为你匹配项目。",
    "Start your Wellness Journey": "开启你的健康之旅",
    "Five tracks": "五大主题线路",
    "What do you want to change?": "你想改变什么？",
    "{n} programme": "{n} 个项目", "{n} programmes": "{n} 个项目",
    "How Dream Islands works": "Dream Islands 如何运作",
    "Before. During. After.": "出发前，旅途中，归来后。",
    "Real programmes": "真实项目",
    "Programmes built around real outcomes": "围绕真实成果打造的项目",
    "{n} countries": "{n} 个国家",
    "Where you'll go": "你将前往的地方",
    "Thailand": "泰国", "China": "中国", "Indonesia": "印度尼西亚", "Malaysia": "马来西亚", "Philippines": "菲律宾", "Singapore": "新加坡", "Vietnam": "越南",
    "Tanya Samui, our flagship since 2009": "自 2009 年起的旗舰：Tanya Samui",
    "Daoist mountains and hot springs": "道教名山与温泉",
    "from {price}": "{price} 起",
    "Five more countries": "另外五个国家",
    "Beyond Thailand and China": "泰国与中国之外",
    "Coming soon": "即将上线",
    "Our flagship": "我们的旗舰", "Koh Samui, Thailand": "泰国苏梅岛",
    "An oasis of health and longevity on Koh Samui since 2009. Three spaces, one protocol: the holistic retreat, a wellness center and a preventive medicine clinic.":
        "自 2009 年起，苏梅岛上的健康与长寿绿洲。三个空间，一套方案：整体疗愈度假村、健康中心和预防医学诊所。",
    "programmes": "个项目", "opened": "开业", "from, per person": "起，每人",
    "Explore Tanya Samui": "探索 Tanya Samui",
    "No guesswork. A clear baseline, a matched stay, a measurable shift.": "不必猜测。清晰的基线，匹配的住宿，可衡量的改变。",
    "Message us": "给我们留言", "Your Wellness Journey": "你的健康之旅", "about 2 minutes": "约 2 分钟", "free": "免费",
    "Choose one or more goals": "选择一个或多个目标", "Sleep, stress, energy…": "睡眠、压力、精力…", "Goals": "目标", "Where": "目的地",
    "Any destination": "任意目的地", "Start date": "出发日期", "Departing from": "出发城市", "City": "城市", "How long": "时长",
    "Any length": "不限时长", "Up to 5 days": "最多 5 天", "6 to 9 days": "6 至 9 天", "10 days or more": "10 天及以上",
    "Find my programme": "查找我的项目",
}
ID = {
    "Reset & Recovery: rest, detox, sleep again.": "Reset & Pemulihan: istirahat, detoks, tidur nyenyak lagi.",
    "Performance: train smarter, rebuild capacity.": "Performa: berlatih lebih cerdas, bangun kembali kapasitas.",
    "Mind Balance: calm the nervous system.": "Keseimbangan Pikiran: menenangkan sistem saraf.",
    "Island Immersion: longer stays that change routine.": "Imersi Pulau: tinggal lebih lama yang mengubah rutinitas.",
    "Sport & Chill: sport, recovery and leisure.": "Olahraga & Santai: olahraga, pemulihan, dan waktu santai.",
    "Take your Wellness Journey": "Mulai Wellness Journey Anda",
    "23 short questions in about 2 minutes. You get a Wellness Score and matched programmes.": "23 pertanyaan singkat dalam sekitar 2 menit. Anda mendapat Wellness Score dan program yang cocok.",
    "Travel the programme": "Jalani programnya",
    "A real programme in a real place, planned with a person on WhatsApp.": "Program nyata di tempat nyata, direncanakan bersama orang sungguhan lewat WhatsApp.",
    "See what changed": "Lihat apa yang berubah",
    "Take the Wellness Journey again after the trip and compare your Wellness Score.": "Ulangi Wellness Journey setelah perjalanan dan bandingkan Wellness Score Anda.",
    "Outcome-driven wellness travel in Asia": "Perjalanan wellness berbasis hasil di Asia",
    "Feel different when you come back.": "Pulang dengan rasa yang berbeda.",
    "Take a 2-minute Wellness Journey, get matched with a programme, and see your Wellness Score change after the trip.": "Ikuti Wellness Journey 2 menit, dapatkan program yang cocok, dan lihat Wellness Score Anda berubah setelah perjalanan.",
    "Not sure where to start?": "Bingung mulai dari mana?",
    "Your Wellness Journey: 23 short questions, about 2 minutes. We match programmes to your result.": "Wellness Journey Anda: 23 pertanyaan singkat, sekitar 2 menit. Kami mencocokkan program dengan hasil Anda.",
    "Start your Wellness Journey": "Mulai Wellness Journey Anda",
    "Five tracks": "Lima jalur",
    "What do you want to change?": "Apa yang ingin Anda ubah?",
    "{n} programme": "{n} program", "{n} programmes": "{n} program",
    "How Dream Islands works": "Cara kerja Dream Islands",
    "Before. During. After.": "Sebelum. Selama. Sesudah.",
    "Real programmes": "Program nyata",
    "Programmes built around real outcomes": "Program yang dirancang untuk hasil nyata",
    "{n} countries": "{n} negara",
    "Where you'll go": "Ke mana Anda akan pergi",
    "Thailand": "Thailand", "China": "Tiongkok", "Indonesia": "Indonesia", "Malaysia": "Malaysia", "Philippines": "Filipina", "Singapore": "Singapura", "Vietnam": "Vietnam",
    "Tanya Samui, our flagship since 2009": "Tanya Samui, andalan kami sejak 2009",
    "Daoist mountains and hot springs": "Gunung Tao dan sumber air panas",
    "from {price}": "mulai {price}",
    "Five more countries": "Lima negara lainnya",
    "Beyond Thailand and China": "Selain Thailand dan Tiongkok",
    "Coming soon": "Segera hadir",
    "Our flagship": "Andalan kami", "Koh Samui, Thailand": "Koh Samui, Thailand",
    "An oasis of health and longevity on Koh Samui since 2009. Three spaces, one protocol: the holistic retreat, a wellness center and a preventive medicine clinic.":
        "Oase kesehatan dan umur panjang di Koh Samui sejak 2009. Tiga ruang, satu protokol: retret holistik, pusat wellness, dan klinik kedokteran preventif.",
    "programmes": "program", "opened": "dibuka", "from, per person": "mulai, per orang",
    "Explore Tanya Samui": "Jelajahi Tanya Samui",
    "No guesswork. A clear baseline, a matched stay, a measurable shift.": "Tanpa menebak-nebak. Kondisi awal yang jelas, penginapan yang cocok, perubahan yang terukur.",
    "Message us": "Kirim pesan", "Your Wellness Journey": "Wellness Journey Anda", "about 2 minutes": "sekitar 2 menit", "free": "gratis",
    "Choose one or more goals": "Pilih satu atau lebih tujuan", "Sleep, stress, energy…": "Tidur, stres, energi…", "Goals": "Tujuan", "Where": "Ke mana",
    "Any destination": "Semua destinasi", "Start date": "Tanggal mulai", "Departing from": "Berangkat dari", "City": "Kota", "How long": "Berapa lama",
    "Any length": "Berapa pun", "Up to 5 days": "Hingga 5 hari", "6 to 9 days": "6 sampai 9 hari", "10 days or more": "10 hari atau lebih",
    "Find my programme": "Temukan program saya",
}

bak = pathlib.Path(f"/root/i18n_home_bak_{time.strftime('%Y%m%d_%H%M%S')}")
bak.mkdir(parents=True, exist_ok=True)
for f in (home, hero, *msgs.values()):
    shutil.copy2(f, bak / f.name)
home.write_text(th, encoding="utf-8")
hero.write_text(tr_, encoding="utf-8")
for k, tr in (("zh", ZH), ("id", ID)):
    d = json.loads(msgs[k].read_text(encoding="utf-8"))
    d.update(tr)
    msgs[k].write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("patched: HomeV2.tsx, HeroSearch.tsx, messages/zh.json, messages/id.json | backup:", bak)
