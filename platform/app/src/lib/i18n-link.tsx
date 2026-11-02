"use client"
import NextLink from "next/link"
import type { ComponentProps } from "react"
import { useLocale } from "./i18n-client"
import { localizeHref } from "./i18n"

/** Drop-in for next/link: keeps the visitor inside /zh or /id. */
export default function Link({ href, ...rest }: ComponentProps<typeof NextLink>) {
  const locale = useLocale()
  return <NextLink href={typeof href === "string" ? localizeHref(href, locale) : href} {...rest} />
}
