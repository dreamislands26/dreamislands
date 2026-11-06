// Back on iPhone (Safari, and Chrome on iOS, which runs on WebKit; confirmed by Oleg 06.11.2026).
// WebKit marks a history entry added more than about a second after the tap as "added by the page
// without the user", and Back / the swipe skips it together with the entry before it. The App Router
// adds the entry only once the next page's data has arrived, which on a phone is often later than that,
// so a swipe back from the catalogue skipped the home page and left the site
// (vercel/next.js#100931, #101060).
//
// So the entry is added here, during the tap. When the page commits, the router finds the address
// already in place and replaces that entry instead of pushing another one.

/** The entry pushed ahead of the router, until the router commits or the user goes back/forward. */
let early: string | null = null

export function onRouterTransitionStart(url: string, type: "push" | "replace" | "traverse") {
  if (type !== "push") return
  let next: URL
  try {
    next = new URL(url, window.location.href)
  } catch {
    return
  }
  const here = window.location
  if (next.origin !== here.origin || next.href === here.href) return
  // A hash on the same page loads nothing, the router writes it at once
  if (next.pathname === here.pathname && next.search === here.search) return
  // __NA marks the state as the router's own, so its history patch does not start a second navigation
  window.history.pushState({ ...window.history.state, __NA: true }, "", next.href)
  early = next.href
}

// A redirect lands on another address (/properties/tanya-core → /tanya-samui): the router would push
// that after our entry, leaving one that redirects forward again on Back. Replace ours instead. The same
// covers a second tap before the first page arrived.
if (typeof window !== "undefined") {
  const isRouters = (data: unknown) => Boolean((data as { __NA?: boolean } | null)?.__NA)
  const push = window.history.pushState.bind(window.history)
  const replace = window.history.replaceState.bind(window.history)
  window.history.pushState = function (data: unknown, unused: string, url?: string | URL | null) {
    const ours = early !== null && window.location.href === early && isRouters(data)
    early = null
    return ours ? replace(data, unused, url) : push(data, unused, url)
  }
  // The router's own replace is its commit (or a filter change): our entry is settled
  window.history.replaceState = function (data: unknown, unused: string, url?: string | URL | null) {
    if (isRouters(data)) early = null
    return replace(data, unused, url)
  }
  window.addEventListener("popstate", () => {
    early = null
  })
}
