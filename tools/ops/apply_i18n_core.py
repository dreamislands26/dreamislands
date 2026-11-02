#!/usr/bin/env python3
"""i18n core for /zh (Simplified Chinese) and /id (Indonesian) without duplicating the route tree.
- proxy.ts: /zh/... and /id/... are rewritten to the same route; locale + clean path travel in x-locale / x-pathname.
  Locale pages get X-Robots-Tag: noindex until the locale is listed in INDEXABLE_LOCALES (env, e.g. "zh,id").
- root layout: <html lang> per locale; canonical is now per request (fixes the old fixed canonical "/"),
  hreflang only for indexable locales.
- (public) layout: LocaleProvider (locale + messages for client components).
- sitemap.ts: hreflang alternates + locale URLs only for indexable locales.
- lib/i18n*.ts, lib/i18n-link.tsx (locale-aware Link), messages/{en,zh,id}.json, LocaleSwitcher component (not mounted yet).
- globals.css: CJK font stack for zh.
Idempotent, anchor-checked, with backup. Usage: python3 apply_i18n_core.py /opt/dit-platform/src"""
import pathlib, shutil, sys, time

src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/opt/dit-platform/src")
app = src / "app"
f_proxy = src / "proxy.ts"
f_root = app / "layout.tsx"
f_pub = app / "(public)/layout.tsx"
f_sitemap = app / "sitemap.ts"
f_css = app / "globals.css"
new_files = {}

if (src / "lib/i18n.ts").exists():
    print("skip (already patched)")
    sys.exit(0)

I18N = r'''export const LOCALES = ["en", "zh", "id"] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = "en"
export const SITE = "https://dreamislands.org"
export const HTML_LANG: Record<Locale, string> = { en: "en", zh: "zh-Hans", id: "id" }
export const LOCALE_NAMES: Record<Locale, string> = { en: "English", zh: "中文", id: "Bahasa Indonesia" }

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v)
}

/** Non-English locales that search engines may index. Env INDEXABLE_LOCALES, e.g. "zh,id". Empty = all locale pages are noindex. */
export function indexableLocales(): Locale[] {
  return (process.env.INDEXABLE_LOCALES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(isLocale)
    .filter((l) => l !== "en")
}
export function isIndexable(l: Locale): boolean {
  return l === "en" || indexableLocales().includes(l)
}

export function stripLocale(pathname: string): { locale: Locale; path: string } {
  const m = pathname.match(/^\/(zh|id)(?=\/|$)/)
  if (!m) return { locale: "en", path: pathname }
  return { locale: m[1] as Locale, path: pathname.slice(m[0].length) || "/" }
}

export function localePath(path: string, locale: Locale): string {
  if (locale === "en") return path
  return path === "/" ? `/${locale}` : `/${locale}${path}`
}

/** Prefix an internal href with the locale. External, /api and already-prefixed links are left alone. */
export function localizeHref(href: string, locale: Locale): string {
  if (locale === "en" || !href.startsWith("/") || href.startsWith("//")) return href
  if (/^\/(api|_next)(\/|$)/.test(href) || /^\/(zh|id)(\/|$|\?|#)/.test(href)) return href
  if (href.startsWith("/?") || href.startsWith("/#")) return `/${locale}${href.slice(1)}`
  return `/${locale}${href}`
}

/** canonical + hreflang for a clean path. Locale pages that are not indexable canonicalise to the English page. */
export function alternatesFor(path: string, locale: Locale): { canonical: string; languages?: Record<string, string> } {
  const live = indexableLocales()
  if (locale !== "en" && !live.includes(locale)) return { canonical: path }
  if (!live.length) return { canonical: path }
  const languages: Record<string, string> = { en: path, "x-default": path }
  for (const l of live) languages[HTML_LANG[l]] = localePath(path, l)
  return { canonical: localePath(path, locale), languages }
}

export function format(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`))
}
'''

SERVER = r'''import { headers } from "next/headers"
import en from "@/messages/en.json"
import zh from "@/messages/zh.json"
import id from "@/messages/id.json"
import { format, isLocale, type Locale } from "./i18n"

const ALL: Record<Locale, Record<string, string>> = { en, zh, id }

export async function getLocale(): Promise<Locale> {
  const v = (await headers()).get("x-locale")
  return isLocale(v) ? v : "en"
}

/** Clean path (no locale prefix) of the current request, set by proxy.ts. */
export async function getPathname(): Promise<string> {
  return (await headers()).get("x-pathname") || "/"
}

/** English fills any key a locale has not translated yet. */
export function getMessages(locale: Locale): Record<string, string> {
  return { ...ALL.en, ...ALL[locale] }
}

export async function getT(locale?: Locale) {
  const m = getMessages(locale ?? (await getLocale()))
  return (key: string, vars?: Record<string, string | number>) => format(m[key] ?? key, vars)
}
'''

CLIENT = r'''"use client"
import { createContext, useContext } from "react"
import { format, type Locale } from "./i18n"

const Ctx = createContext<{ locale: Locale; messages: Record<string, string> }>({ locale: "en", messages: {} })

export function LocaleProvider({ locale, messages, children }: { locale: Locale; messages: Record<string, string>; children: React.ReactNode }) {
  return <Ctx.Provider value={{ locale, messages }}>{children}</Ctx.Provider>
}

export function useLocale(): Locale {
  return useContext(Ctx).locale
}

export function useT() {
  const { messages } = useContext(Ctx)
  return (key: string, vars?: Record<string, string | number>) => format(messages[key] ?? key, vars)
}
'''

LINK = r'''"use client"
import NextLink from "next/link"
import type { ComponentProps } from "react"
import { useLocale } from "./i18n-client"
import { localizeHref } from "./i18n"

/** Drop-in for next/link: keeps the visitor inside /zh or /id. */
export default function Link({ href, ...rest }: ComponentProps<typeof NextLink>) {
  const locale = useLocale()
  return <NextLink href={typeof href === "string" ? localizeHref(href, locale) : href} {...rest} />
}
'''

SWITCHER = r'''"use client"
import { usePathname } from "next/navigation"
import { LOCALES, LOCALE_NAMES, HTML_LANG, localePath, stripLocale } from "@/lib/i18n"
import { useLocale, useT } from "@/lib/i18n-client"

/** Language switcher. Plain links, no automatic redirect by IP or browser language (bad for SEO and users). */
export default function LocaleSwitcher() {
  const locale = useLocale()
  const t = useT()
  const { path } = stripLocale(usePathname() || "/")
  return (
    <nav aria-label={t("lang.switch")} style={{ display: "inline-flex", gap: "0.75rem", flexWrap: "wrap" }}>
      {LOCALES.map((l) => (
        <a key={l} href={localePath(path, l)} hrefLang={HTML_LANG[l]} lang={HTML_LANG[l]} aria-current={l === locale ? "true" : undefined}
          style={{ textDecoration: l === locale ? "underline" : "none", fontWeight: l === locale ? 600 : 400, color: "inherit" }}>
          {LOCALE_NAMES[l]}
        </a>
      ))}
    </nav>
  )
}
'''

MSG = {
    "en": '{\n  "lang.label": "Language",\n  "lang.switch": "Change language"\n}\n',
    "zh": '{\n  "lang.label": "语言",\n  "lang.switch": "切换语言"\n}\n',
    "id": '{\n  "lang.label": "Bahasa",\n  "lang.switch": "Ganti bahasa"\n}\n',
}

CSS_ADD = '''
/* Simplified Chinese: CJK system fonts first so glyphs are not synthesised */
html[lang="zh-Hans"] body,
html[lang="zh-Hans"] .ds-root {
  --ds-font-body: var(--font-dmsans), "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans SC", sans-serif;
  --ds-font-display: var(--font-bricolage), "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans SC", sans-serif;
  font-family: var(--font-dmsans), "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans SC", sans-serif;
}
'''

# ---------- patches (computed in memory, written only if every anchor matched) ----------
def need(text, a, name, n=1):
    if text.count(a) != n:
        sys.exit(f"ANCHOR NOT FOUND (or count != {n}): {name}")

t_proxy, t_root, t_pub, t_map, t_css = (f.read_text(encoding="utf-8") for f in (f_proxy, f_root, f_pub, f_sitemap, f_css))

# proxy.ts
a_imp = 'import { createServerClient } from "@supabase/ssr"\n'
a_path = "  const { pathname } = request.nextUrl\n"
a_let = "  let response = NextResponse.next({ request })\n"
a_set = "          response = NextResponse.next({ request })\n"
for n, a in (("proxy import", a_imp), ("proxy pathname", a_path), ("proxy let response", a_let), ("proxy setAll response", a_set)):
    need(t_proxy, a, n)
t_proxy = t_proxy.replace(a_imp, a_imp + 'import { isIndexable, stripLocale } from "@/lib/i18n"\n', 1)
t_proxy = t_proxy.replace(a_path, '''  // /zh/... and /id/... are served by the same routes: strip the prefix, rewrite, and pass the locale in headers.
  const loc = stripLocale(request.nextUrl.pathname)
  const pathname = loc.path
  const locale = loc.locale
  const rewriteUrl = request.nextUrl.clone()
  rewriteUrl.pathname = pathname
  const mkRes = () => {
    const h = new Headers(request.headers)
    h.set("x-locale", locale)
    h.set("x-pathname", pathname)
    const res = locale === "en" ? NextResponse.next({ request: { headers: h } }) : NextResponse.rewrite(rewriteUrl, { request: { headers: h } })
    if (!isIndexable(locale)) res.headers.set("X-Robots-Tag", "noindex, follow")
    return res
  }
''', 1)
t_proxy = t_proxy.replace(a_let, "  let response = mkRes()\n", 1)
t_proxy = t_proxy.replace(a_set, "          response = mkRes()\n", 1)

# root layout
a_ti = 'import type { Metadata } from "next"\n'
a_meta = "export const metadata: Metadata = {"
a_alt = '  alternates: {\n    canonical: "/",\n  },\n'
a_fn = 'export default function RootLayout({\n  children,\n}: Readonly<{ children: React.ReactNode }>) {\n  return (\n    <html lang="en" className='
for n, a in (("root metadata import", a_ti), ("root metadata", a_meta), ("root alternates", a_alt), ("root layout fn", a_fn)):
    need(t_root, a, n)
t_root = t_root.replace(a_ti, a_ti + 'import { alternatesFor, HTML_LANG } from "@/lib/i18n"\nimport { getLocale, getPathname } from "@/lib/i18n-server"\n', 1)
t_root = t_root.replace(a_meta, "const baseMetadata: Metadata = {", 1)
t_root = t_root.replace(a_alt, "", 1)
t_root = t_root.replace(a_fn, '''// Canonical / hreflang are per request (the old fixed canonical "/" pointed every page at the home page).
export async function generateMetadata(): Promise<Metadata> {
  const [locale, path] = await Promise.all([getLocale(), getPathname()])
  return { ...baseMetadata, alternates: alternatesFor(path, locale) }
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale()
  return (
    <html lang={HTML_LANG[locale]} className=''', 1)

# public layout
a_pi = 'import { Footer, MobileTopBar, NavigationBar, NavTracker, TopAppBar } from "./ds/chrome"\n'
a_pf = "export default function PublicLayout({"
a_pr = '  return (\n    <div className="ds-root">\n'
a_pe = "      </AuthProvider>\n    </div>\n  )\n}"
for n, a in (("public chrome import", a_pi), ("public fn", a_pf), ("public return", a_pr), ("public end", a_pe)):
    need(t_pub, a, n)
t_pub = t_pub.replace(a_pi, a_pi + 'import { LocaleProvider } from "@/lib/i18n-client"\nimport { getLocale, getMessages } from "@/lib/i18n-server"\n', 1)
t_pub = t_pub.replace(a_pf, "export default async function PublicLayout({", 1)
t_pub = t_pub.replace(a_pr, '  const locale = await getLocale()\n  return (\n    <LocaleProvider locale={locale} messages={getMessages(locale)}>\n    <div className="ds-root">\n', 1)
t_pub = t_pub.replace(a_pe, "      </AuthProvider>\n    </div>\n    </LocaleProvider>\n  )\n}", 1)

# sitemap
a_si = 'import { STATIC_ROUTES } from "./sitemap-static"\n'
a_sr = "  return [...seen.values()]\n"
need(t_map, a_si, "sitemap import")
need(t_map, a_sr, "sitemap return")
t_map = t_map.replace(a_si, a_si + 'import { HTML_LANG, indexableLocales, localePath } from "@/lib/i18n"\n', 1)
t_map = t_map.replace(a_sr, '''  const base = [...seen.values()]
  // Locale URLs + hreflang appear only for locales listed in INDEXABLE_LOCALES.
  const live = indexableLocales()
  if (!live.length) return base
  const withLocales: MetadataRoute.Sitemap = []
  for (const e of base) {
    const path = e.url.slice(BASE.length) || "/"
    const languages: Record<string, string> = { en: e.url, "x-default": e.url }
    for (const l of live) languages[HTML_LANG[l]] = BASE + localePath(path, l)
    withLocales.push({ ...e, alternates: { languages } })
    for (const l of live) withLocales.push({ ...e, url: BASE + localePath(path, l), alternates: { languages } })
  }
  return withLocales
''', 1)

# ---------- write ----------
bak = pathlib.Path(f"/root/i18n_core_bak_{time.strftime('%Y%m%d_%H%M%S')}")
bak.mkdir(parents=True, exist_ok=True)
for f in (f_proxy, f_root, f_pub, f_sitemap, f_css):
    shutil.copy2(f, bak / (f.parent.name + "__" + f.name))

def w(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")

w(src / "lib/i18n.ts", I18N)
w(src / "lib/i18n-server.ts", SERVER)
w(src / "lib/i18n-client.tsx", CLIENT)
w(src / "lib/i18n-link.tsx", LINK)
w(app / "(public)/_components/LocaleSwitcher.tsx", SWITCHER)
for k, v in MSG.items():
    w(src / f"messages/{k}.json", v)
w(f_proxy, t_proxy)
w(f_root, t_root)
w(f_pub, t_pub)
w(f_sitemap, t_map)
w(f_css, t_css.rstrip("\n") + "\n" + CSS_ADD)
print("created: lib/i18n.ts, i18n-server.ts, i18n-client.tsx, i18n-link.tsx, messages/*.json, LocaleSwitcher.tsx")
print("patched: proxy.ts, app/layout.tsx, app/(public)/layout.tsx, app/sitemap.ts, app/globals.css")
print("backup in", bak)
