"use client"
import NextLink from "next/link"
import type { ComponentProps } from "react"
import { useLocale } from "./i18n-client"
import { localizeHref } from "./i18n"
import { startNavigation } from "./nav-pending"

/** Drop-in for next/link: keeps the visitor inside /zh or /id and reports navigations for the loading skeleton. */
export default function Link({ href, onNavigate, ...rest }: ComponentProps<typeof NextLink>) {
  const locale = useLocale()
  const to = typeof href === "string" ? localizeHref(href, locale) : href
  return (
    <NextLink
      href={to}
      onNavigate={(e) => {
        onNavigate?.(e)
        if (typeof to === "string") startNavigation(to)
        else if (to.pathname) startNavigation(to.pathname)
      }}
      {...rest}
    />
  )
}
