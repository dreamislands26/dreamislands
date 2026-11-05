"use client"
import NextLink from "next/link"
import type { ComponentProps, MouseEvent } from "react"
import { useLocale } from "./i18n-client"
import { localizeHref } from "./i18n"
import { startNavigation, type Preview } from "./nav-pending"

/** A card marks itself with data-preview-* (title, place, price). */
function previewFrom(e: MouseEvent<HTMLAnchorElement>): Preview | undefined {
  const card = e.currentTarget.closest<HTMLElement>("[data-preview-title]")
  if (!card) return undefined
  return {
    title: card.dataset.previewTitle,
    place: card.dataset.previewPlace || undefined,
    price: card.dataset.previewPrice || undefined,
  }
}

// Preview of the card behind the last click; onClick runs just before onNavigate
let clicked: Preview | undefined

/** Drop-in for next/link: keeps the visitor inside /zh or /id and reports navigations for the loading skeleton. */
export default function Link({ href, onClick, onNavigate, ...rest }: ComponentProps<typeof NextLink>) {
  const locale = useLocale()
  const to = typeof href === "string" ? localizeHref(href, locale) : href
  return (
    <NextLink
      href={to}
      onClick={(e) => {
        // Runs before onNavigate; a modified click (new tab) never reaches it
        clicked = previewFrom(e)
        onClick?.(e)
      }}
      onNavigate={(e) => {
        onNavigate?.(e)
        const path = typeof to === "string" ? to : to.pathname
        if (path) startNavigation(path, clicked)
        clicked = undefined
      }}
      {...rest}
    />
  )
}
