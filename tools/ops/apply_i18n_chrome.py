#!/usr/bin/env python3
"""Translate the site chrome (top bar, mobile menu, tab bar, account menu, footer) and add the language switcher
to the footer. Strings are wrapped as t("English text"): English text is the key, so English output is unchanged
and zh/id dictionaries hold the translations. Needs apply_i18n_core.py (and apply_i18n_nav.py) first.
Idempotent, anchor-checked, with backup. Usage: python3 apply_i18n_chrome.py /opt/dit-platform/src"""
import json, pathlib, shutil, sys, time

src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/opt/dit-platform/src")
chrome = src / "app/(public)/ds/chrome.tsx"
msgs = {k: src / f"messages/{k}.json" for k in ("zh", "id")}
if not (src / "lib/i18n-client.tsx").exists() or not (src / "lib/i18n-nav.ts").exists():
    sys.exit("Apply apply_i18n_core.py and apply_i18n_nav.py first")

t = chrome.read_text(encoding="utf-8")
if 'import { useT } from "@/lib/i18n-client"' in t:
    print("skip (already patched)")
    sys.exit(0)

# (old, new, expected count)
R = [
    ('import Flag from "./Flag"\n', 'import Flag from "./Flag"\nimport { useT } from "@/lib/i18n-client"\nimport LocaleSwitcher from "../_components/LocaleSwitcher"\n', 1),
    # Account
    ("  const { session, openAuth, signOut } = useAccount()\n", "  const { session, openAuth, signOut } = useAccount()\n  const t = useT()\n", 1),
    ("        {loginLabel}\n", "        {t(loginLabel)}\n", 1),
    ('aria-label="Account menu"', 'aria-label={t("Account menu")}', 1),
    ('{session.name ?? "Your profile"}', '{session.name ?? t("Your profile")}', 1),
    ('<Icon name="dashboard" />Open the panel</Link>', '<Icon name="dashboard" />{t("Open the panel")}</Link>', 1),
    ('<Icon name="monitoring" />My Wellness Journey</Link>', '<Icon name="monitoring" />{t("My Wellness Journey")}</Link>', 1),
    ('<Icon name="spa" />My programmes</Link>', '<Icon name="spa" />{t("My programmes")}</Link>', 1),
    ('<Icon name="person" />Profile details</Link>', '<Icon name="person" />{t("Profile details")}</Link>', 1),
    ('<Icon name="logout" />Sign out\n', '<Icon name="logout" />{t("Sign out")}\n', 1),
    # MobileMenu
    ("  const close = () => { setOpen(false); setDest(false) }\n", "  const close = () => { setOpen(false); setDest(false) }\n  const t = useT()\n", 1),
    ('aria-label="Menu" aria-expanded={open}', 'aria-label={t("Menu")} aria-expanded={open}', 1),
    ('<nav className={s.sheet} aria-label="Menu"', '<nav className={s.sheet} aria-label={t("Menu")}', 1),
    ("{NAV_BEFORE.map((l) => <Link key={l.label} href={l.href} className={s.sheetLink} onClick={close}>{l.label}</Link>)}",
     "{NAV_BEFORE.map((l) => <Link key={l.label} href={l.href} className={s.sheetLink} onClick={close}>{t(l.label)}</Link>)}", 1),
    ("{NAV_AFTER.map((l) => <Link key={l.label} href={l.href} className={s.sheetLink} onClick={close}>{l.label}</Link>)}",
     "{NAV_AFTER.map((l) => <Link key={l.label} href={l.href} className={s.sheetLink} onClick={close}>{t(l.label)}</Link>)}", 1),
    ('              Destinations<Icon name={dest ? "remove" : "add"} />', '              {t("Destinations")}<Icon name={dest ? "remove" : "add"} />', 1),
    ('<Link href="/destinations" onClick={close}>All destinations</Link>', '<Link href="/destinations" onClick={close}>{t("All destinations")}</Link>', 1),
    ('<Link href="/properties" onClick={close}>All properties</Link>', '<Link href="/properties" onClick={close}>{t("All properties")}</Link>', 1),
    # TopAppBar
    ("  const pathname = usePathname()\n  const is = (p: string) =>", "  const pathname = usePathname()\n  const t = useT()\n  const is = (p: string) =>", 1),
    ('className={cx(s.link, !l.href.startsWith("/#") && is(l.href) && s.linkActive)}>{l.label}</Link>',
     'className={cx(s.link, !l.href.startsWith("/#") && is(l.href) && s.linkActive)}>{t(l.label)}</Link>', 2),
    ('<NavMenu label="Destinations" active=', '<NavMenu label={t("Destinations")} active=', 1),
    ('<Icon name="public" />All destinations</Link>', '<Icon name="public" />{t("All destinations")}</Link>', 1),
    ('<Icon name="apartment" />All properties</Link>', '<Icon name="apartment" />{t("All properties")}</Link>', 1),
    ('<IconLink icon="favorite" label="Saved" href="/saved" />', '<IconLink icon="favorite" label={t("Saved")} href="/saved" />', 1),
    ('<ButtonLink href="/start" variant="filled" size="m">Take Assessment</ButtonLink>', '<ButtonLink href="/start" variant="filled" size="m">{t("Take Assessment")}</ButtonLink>', 1),
    # MobileTopBar
    ("  const pathname = usePathname()\n  // Home draws", "  const pathname = usePathname()\n  const t = useT()\n  // Home draws", 1),
    ("className={s.mtopCta}>Take Assessment</ButtonLink>", 'className={s.mtopCta}>{t("Take Assessment")}</ButtonLink>', 1),
    # MobileBackBar
    ("  const back = useSafeBack(fallback)\n", "  const back = useSafeBack(fallback)\n  const t = useT()\n", 1),
    ('aria-label="Back"', 'aria-label={t("Back")}', 1),
    # NavigationBar (the tab map variable is already called t, so this component uses tr)
    ("  const collapsed = useCollapsedOnScroll()\n", "  const collapsed = useCollapsedOnScroll()\n  const tr = useT()\n", 1),
    ('aria-label="Tabs"', 'aria-label={tr("Tabs")}', 1),
    ("aria-label={t.label} aria-current", "aria-label={tr(t.label)} aria-current", 1),
    ("<span className={s.tabLabel} aria-hidden>{t.label}</span>", "<span className={s.tabLabel} aria-hidden>{tr(t.label)}</span>", 1),
    ('aria-label="Search"', 'aria-label={tr("Search")}', 1),
    # Footer
    ("  const pathname = usePathname()\n  if (FOCUS.test(pathname)) return null\n  return (\n    <footer className={s.footer}>",
     "  const pathname = usePathname()\n  const t = useT()\n  if (FOCUS.test(pathname)) return null\n  return (\n    <footer className={s.footer}>", 1),
    ("              The wellness intelligence and travel platform for Asia. Baseline first. Match intelligently. Measure what changed.\n",
     '              {t("The wellness intelligence and travel platform for Asia. Baseline first. Match intelligently. Measure what changed.")}\n', 1),
    ("<h3>Explore</h3>", '<h3>{t("Explore")}</h3>', 1),
    ("<h3>Tracks</h3>", '<h3>{t("Tracks")}</h3>', 1),
    ("<h3>Company</h3>", '<h3>{t("Company")}</h3>', 1),
    ("className={s.footerLink}>Programmes</Link>", 'className={s.footerLink}>{t("Programmes")}</Link>', 1),
    ("className={s.footerLink}>Destinations</Link>", 'className={s.footerLink}>{t("Destinations")}</Link>', 1),
    ("className={s.footerLink}>Wellness Journey</Link>", 'className={s.footerLink}>{t("Wellness Journey")}</Link>', 1),
    ("className={s.footerLink}>Guides</Link>", 'className={s.footerLink}>{t("Guides")}</Link>', 1),
    ("className={s.footerLink}>About</Link>", 'className={s.footerLink}>{t("About")}</Link>', 1),
    ("className={s.footerLink}>How it works</Link>", 'className={s.footerLink}>{t("How it works")}</Link>', 1),
    ("className={s.footerLink}>Reviews</Link>", 'className={s.footerLink}>{t("Reviews")}</Link>', 1),
    ("className={s.footerLink}>For properties</Link>", 'className={s.footerLink}>{t("For properties")}</Link>', 1),
    ("{TRACK_LINKS.slice(0, 4).map((t) => (\n              <Link key={t.href} href={t.href} className={s.footerLink}>{t.label}</Link>",
     "{TRACK_LINKS.slice(0, 4).map((trk) => (\n              <Link key={trk.href} href={trk.href} className={s.footerLink}>{t(trk.label)}</Link>", 1),
    ('rel="noreferrer">Partner login</a>', 'rel="noreferrer">{t("Partner login")}</a>', 1),
    ("&nbsp;We host in {COUNTRIES.length} countries</span>", '&nbsp;{t("We host in {n} countries", { n: COUNTRIES.length })}</span>', 1),
    ('<a href="mailto:hello@dreamislands.org">Contact</a>', '<a href="mailto:hello@dreamislands.org">{t("Contact")}</a>', 1),
    ("        <div className={s.footerBottom}>\n", '        <div style={{ padding: "0 0 1rem" }}><LocaleSwitcher /></div>\n        <div className={s.footerBottom}>\n', 1),
]
for old, new, n in R:
    if t.count(old) != n:
        sys.exit(f"ANCHOR COUNT {t.count(old)} != {n}: {old[:70]!r}")
for old, new, n in R:
    t = t.replace(old, new)

ZH = {
    "Account menu": "账户菜单", "Log in": "登录", "Your profile": "你的个人资料", "Open the panel": "打开管理面板",
    "My Wellness Journey": "我的健康之旅", "My programmes": "我的项目", "Profile details": "个人资料详情", "Sign out": "退出登录",
    "Menu": "菜单", "Outcomes": "健康目标", "Programmes": "康养项目", "How it works": "如何运作", "About": "关于我们",
    "Destinations": "目的地", "All destinations": "全部目的地", "All properties": "全部康养住宿", "Saved": "已收藏",
    "Take Assessment": "开始评估", "Back": "返回", "Explore": "探索", "My Journey": "我的旅程", "Tabs": "标签栏", "Search": "搜索",
    "Reset & Recovery": "重置与恢复", "Performance": "高效表现", "Mind Balance": "身心平衡", "Island Immersion": "海岛沉浸",
    "Sport & Chill": "运动与放松", "Tracks": "主题线路", "Company": "公司", "Wellness Journey": "健康之旅", "Guides": "指南",
    "Reviews": "用户评价", "For properties": "合作酒店入口", "Partner login": "合作伙伴登录",
    "We host in {n} countries": "我们在 {n} 个国家提供接待服务", "Contact": "联系我们",
    "The wellness intelligence and travel platform for Asia. Baseline first. Match intelligently. Measure what changed.":
        "面向亚洲的康养智能与旅行平台。先评估基线，再智能匹配，最后衡量变化。",
}
ID = {
    "Account menu": "Menu akun", "Log in": "Masuk", "Your profile": "Profil Anda", "Open the panel": "Buka panel",
    "My Wellness Journey": "Wellness Journey saya", "My programmes": "Program saya", "Profile details": "Detail profil", "Sign out": "Keluar",
    "Menu": "Menu", "Outcomes": "Tujuan kesehatan", "Programmes": "Program", "How it works": "Cara kerjanya", "About": "Tentang kami",
    "Destinations": "Destinasi", "All destinations": "Semua destinasi", "All properties": "Semua properti", "Saved": "Tersimpan",
    "Take Assessment": "Mulai asesmen", "Back": "Kembali", "Explore": "Jelajahi", "My Journey": "Perjalanan saya", "Tabs": "Tab", "Search": "Cari",
    "Reset & Recovery": "Reset & Pemulihan", "Performance": "Performa", "Mind Balance": "Keseimbangan Pikiran", "Island Immersion": "Imersi Pulau",
    "Sport & Chill": "Olahraga & Santai", "Tracks": "Jalur", "Company": "Perusahaan", "Wellness Journey": "Wellness Journey", "Guides": "Panduan",
    "Reviews": "Ulasan", "For properties": "Untuk properti mitra", "Partner login": "Masuk mitra",
    "We host in {n} countries": "Kami melayani di {n} negara", "Contact": "Kontak",
    "The wellness intelligence and travel platform for Asia. Baseline first. Match intelligently. Measure what changed.":
        "Platform kecerdasan wellness dan perjalanan untuk Asia. Ukur kondisi awal, cocokkan dengan cerdas, lalu ukur perubahannya.",
}

bak = pathlib.Path(f"/root/i18n_chrome_bak_{time.strftime('%Y%m%d_%H%M%S')}")
bak.mkdir(parents=True, exist_ok=True)
for f in (chrome, *msgs.values()):
    shutil.copy2(f, bak / f.name)
chrome.write_text(t, encoding="utf-8")
for k, tr in (("zh", ZH), ("id", ID)):
    d = json.loads(msgs[k].read_text(encoding="utf-8"))
    d.update(tr)
    msgs[k].write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("patched: chrome.tsx, messages/zh.json, messages/id.json | backup:", bak)
