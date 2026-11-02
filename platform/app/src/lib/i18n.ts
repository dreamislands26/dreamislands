export const LOCALES = ["en", "zh", "id"] as const
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
