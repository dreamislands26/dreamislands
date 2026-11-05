// Pending page navigation on the public site, for the loading skeletons.
//   - "list" / "detail": another page is loading; ds/PageTransition replaces the page.
//   - "results": same page, new query (catalogue filters, search); ds/Results replaces only the
//     results and keeps the header and filters.
// Where the next page is known (programme, place, country, catalogue), PageTransition draws that
// page's own layout with skeletons in place of its content. A card that was clicked passes what it
// already shows (title, place, price) as a preview, so those appear at once.
//
// The site does not use loading.tsx: a Suspense boundary there makes the server stream before
// a page can call notFound(), so missing pages answer 200 + noindex instead of 404. Instead the
// skeleton is client-side: Link reports a client navigation here, PageTransition shows the
// skeleton until the pathname changes. Server responses and crawlers are unaffected.

import { useSyncExternalStore } from "react"

export type PendingKind = "list" | "detail" | "results"

/** What the clicked card already shows. */
export type Preview = { title?: string; place?: string; price?: string }
export type Pending = { kind: PendingKind; path: string; search: string; preview?: Preview }

const SHOW_AFTER_MS = 150 // fast (prefetched) navigations never show the skeleton
const GIVE_UP_MS = 15000

let pending: Pending | null = null
let showTimer: ReturnType<typeof setTimeout> | undefined
let giveUpTimer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

function set(next: Pending | null) {
  if (pending === next) return
  pending = next
  listeners.forEach((l) => l())
}

const DETAIL = /^(?:\/(?:zh|id))?\/(?:programs|properties)\/[^/]+\/?$/

/** Called by Link on a client-side navigation, and before router.push/replace. Hash-only changes are ignored. */
export function startNavigation(href: string, preview?: Preview) {
  if (typeof window === "undefined") return
  let url: URL
  try {
    url = new URL(href, window.location.href)
  } catch {
    return
  }
  const here = window.location
  if (url.origin !== here.origin) return
  const samePage = url.pathname === here.pathname
  if (samePage && url.search === here.search) return
  const kind: PendingKind = samePage ? "results" : DETAIL.test(url.pathname) ? "detail" : "list"
  const next: Pending = { kind, path: url.pathname.replace(/^\/(?:zh|id)(?=\/|$)/, "") || "/", search: url.search, preview }
  clearTimeout(showTimer)
  clearTimeout(giveUpTimer)
  showTimer = setTimeout(() => {
    set(next)
    // Results under an anchor (e.g. /destinations/x?goal=…#programs): bring them into view now,
    // as the page will after loading, so the skeleton is seen
    if (kind === "results" && url.hash) document.getElementById(url.hash.slice(1))?.scrollIntoView()
  }, SHOW_AFTER_MS)
  giveUpTimer = setTimeout(endNavigation, GIVE_UP_MS)
}

export function endNavigation() {
  clearTimeout(showTimer)
  clearTimeout(giveUpTimer)
  set(null)
}

export const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
export const getPending = () => pending
export const getServerPending = () => null

/** The path of the page on screen: the next page while its loading screen is up, else `pathname`.
 *  The mobile top bar and tab bar follow it, so they match the page that is loading. */
export function useShownPath(pathname: string) {
  const next = useSyncExternalStore(subscribe, getPending, getServerPending)
  return next && next.kind !== "results" ? next.path : pathname
}
