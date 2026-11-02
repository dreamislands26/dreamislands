"use client"
import { useMemo } from "react"
import { usePathname as useNextPathname, useRouter as useNextRouter } from "next/navigation"
import { localizeHref, stripLocale } from "./i18n"
import { useLocale } from "./i18n-client"

/** Current path without the /zh or /id prefix, so route checks (startsWith("/programs") ...) work in every locale. */
export function usePathname(): string {
  return stripLocale(useNextPathname() || "/").path
}

/** next/navigation router that keeps the visitor inside the current locale. */
export function useRouter() {
  const r = useNextRouter()
  const locale = useLocale()
  return useMemo(
    () => ({
      ...r,
      push: (href: string, o?: Parameters<typeof r.push>[1]) => r.push(localizeHref(href, locale), o),
      replace: (href: string, o?: Parameters<typeof r.replace>[1]) => r.replace(localizeHref(href, locale), o),
      prefetch: (href: string, o?: Parameters<typeof r.prefetch>[1]) => r.prefetch(localizeHref(href, locale), o),
    }),
    [r, locale],
  )
}
