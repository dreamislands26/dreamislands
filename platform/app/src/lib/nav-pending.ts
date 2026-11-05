// Pending page navigation on the public site, for the loading skeletons.
//   - "list" / "detail": another page is loading; ds/PageTransition replaces the page.
//   - "results": same page, new query (catalogue filters, search); ds/Results replaces only the
//     results and keeps the header and filters.
//
// The site does not use loading.tsx: a Suspense boundary there makes the server stream before
// a page can call notFound(), so missing pages answer 200 + noindex instead of 404. Instead the
// skeleton is client-side: Link reports a client navigation here, PageTransition shows the
// skeleton until the pathname changes. Server responses and crawlers are unaffected.

export type PendingKind = "list" | "detail" | "results"

const SHOW_AFTER_MS = 150 // fast (prefetched) navigations never show the skeleton
const GIVE_UP_MS = 15000

let pending: PendingKind | null = null
let showTimer: ReturnType<typeof setTimeout> | undefined
let giveUpTimer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

function set(next: PendingKind | null) {
  if (pending === next) return
  pending = next
  listeners.forEach((l) => l())
}

const DETAIL = /^(?:\/(?:zh|id))?\/(?:programs|properties)\/[^/]+\/?$/

/** Called by Link on a client-side navigation, and before router.push/replace. Hash-only changes are ignored. */
export function startNavigation(href: string) {
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
  clearTimeout(showTimer)
  clearTimeout(giveUpTimer)
  showTimer = setTimeout(() => {
    set(kind)
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
