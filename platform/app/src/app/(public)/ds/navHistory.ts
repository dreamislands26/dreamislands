"use client"
// In-site history for the on-page back arrows. window.history.length also counts pages from other
// sites (Telegram, search, an old tab), so router.back() could leave the site. We keep a per-tab
// stack of paths visited here and only step back when the previous entry is ours.
//
// Also restores the scroll position when going back, which the browser loses because the page it
// returns to is drawn after its own restore attempt (home came back at the top, 06.11.2026).
import { usePathname, useRouter } from "@/lib/i18n-nav"
import { useEffect } from "react"

const KEY = "di_nav_stack"
const SCROLL_KEY = "di_nav_scroll"

function load<T>(key: string, empty: T): T {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? "null") ?? empty
  } catch {
    return empty
  }
}
function save(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {}
}
const read = () => load<string[]>(KEY, [])
const write = (stack: string[]) => save(KEY, stack.slice(-50))

/** Scroll positions by stack depth and path: the same page deeper in the stack is another visit. */
const scrollKey = (stack: string[]) => `${stack.length}:${stack[stack.length - 1]}`

// A back/forward step (popstate) as opposed to a new visit, so A → B → A forward is not read as back
let traversed = false

if (typeof window !== "undefined") {
  // Opened from another site or typed in: the stack from an earlier visit in this tab is not behind us
  // any more (the arrow would step back out of the site). A reload or a return by Back keeps it.
  const nav = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined
  let fromHere = false
  try {
    fromHere = new URL(document.referrer).origin === window.location.origin
  } catch {}
  if (nav?.type === "navigate" && !fromHere) {
    write([])
    save(SCROLL_KEY, {})
  }
  window.addEventListener("popstate", () => {
    traversed = true
  })
  // Leaving by a tap: remember where this page was scrolled to (before the next page resets it)
  window.addEventListener(
    "click",
    () => {
      traversed = false
      const stack = read()
      if (!stack.length) return
      const map = load<Record<string, number>>(SCROLL_KEY, {})
      map[scrollKey(stack)] = Math.round(window.scrollY)
      save(SCROLL_KEY, map)
    },
    true,
  )
}

/** Scrolls to `y` once the page is tall enough to have it (it may still be drawing), for up to ~1.5 s. */
function restoreScroll(y: number) {
  let frames = 0
  const tick = () => {
    const room = document.documentElement.scrollHeight - window.innerHeight
    if (room >= y || frames++ > 90) window.scrollTo(0, Math.min(y, room))
    else requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

/** Mounted once in the public layout: records every in-site page change. */
export function useTrackNav() {
  const pathname = usePathname()
  useEffect(() => {
    const stack = read()
    const back = traversed && stack[stack.length - 2] === pathname
    traversed = false
    if (stack[stack.length - 1] === pathname) return
    if (back) {
      stack.pop()
      const y = load<Record<string, number>>(SCROLL_KEY, {})[scrollKey(stack)]
      if (y) restoreScroll(y)
    } else stack.push(pathname)
    write(stack)
  }, [pathname])
}

/** Back inside the site, or to `fallback` when this page was the entry point. */
export function useSafeBack(fallback: string) {
  const router = useRouter()
  return () => (read().length > 1 ? router.back() : router.push(fallback))
}
