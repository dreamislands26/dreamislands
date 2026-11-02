"use client"
import { usePathname } from "@/lib/i18n-nav"
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
