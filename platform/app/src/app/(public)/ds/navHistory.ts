"use client"
// In-site history for the on-page back arrows. window.history.length also counts pages from other
// sites (Telegram, search, an old tab), so router.back() could leave the site. We keep a per-tab
// stack of paths visited here and only step back when the previous entry is ours.
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

const KEY = "di_nav_stack"

function read(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "[]") as string[]
  } catch {
    return []
  }
}
function write(stack: string[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(stack.slice(-50)))
  } catch {}
}

/** Mounted once in the public layout: records every in-site page change. */
export function useTrackNav() {
  const pathname = usePathname()
  useEffect(() => {
    const stack = read()
    if (stack[stack.length - 1] === pathname) return
    if (stack[stack.length - 2] === pathname) stack.pop() // went back
    else stack.push(pathname)
    write(stack)
  }, [pathname])
}

/** Back inside the site, or to `fallback` when this page was the entry point. */
export function useSafeBack(fallback: string) {
  const router = useRouter()
  return () => (read().length > 1 ? router.back() : router.push(fallback))
}
