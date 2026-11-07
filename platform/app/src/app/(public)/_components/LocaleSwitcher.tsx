"use client"
import { usePathname } from "@/lib/i18n-nav"
import { LOCALES, LOCALE_NAMES, HTML_LANG, localePath, stripLocale, type Locale } from "@/lib/i18n"
import { useLocale, useT } from "@/lib/i18n-client"
import s from "./localeSwitcher.module.css"

/** Flag per language (circle-flags, public/flags). English: the UK flag (Oleg 07.11.2026). */
export const LOCALE_FLAG: Record<Locale, string> = { en: "gb", zh: "cn", id: "id" }
/** Short names for the pill row, so the three fit one line on a phone */
const SHORT: Record<Locale, string> = { en: "English", zh: "中文", id: "Indonesia" }

/** Language switcher: plain links with a flag, no automatic redirect by IP or browser language (bad for SEO
 *  and users). `variant="pills"` is the row at the bottom of the mobile menu. */
export default function LocaleSwitcher({ variant = "links", onPick }: { variant?: "links" | "pills"; onPick?: () => void }) {
  const locale = useLocale()
  const t = useT()
  const { path } = stripLocale(usePathname() || "/")
  return (
    <nav aria-label={t("lang.switch")} className={variant === "pills" ? s.pills : s.links}>
      {LOCALES.map((l) => (
        <a key={l} href={localePath(path, l)} hrefLang={HTML_LANG[l]} lang={HTML_LANG[l]} aria-current={l === locale ? "true" : undefined} className={s.item} onClick={onPick}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/flags/${LOCALE_FLAG[l]}.svg`} alt="" aria-hidden width={20} height={20} className={s.flag} />
          {variant === "pills" ? SHORT[l] : LOCALE_NAMES[l]}
        </a>
      ))}
    </nav>
  )
}
