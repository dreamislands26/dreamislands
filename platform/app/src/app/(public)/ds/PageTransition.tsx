"use client"

import { useEffect, useSyncExternalStore, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { endNavigation, getPending, getServerPending, subscribe } from "@/lib/nav-pending"
import { DetailSkeleton, ListSkeleton } from "./skeletons"

/** Shows a loading skeleton in place of the page while a client navigation loads (see lib/nav-pending). */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pending = useSyncExternalStore(subscribe, getPending, getServerPending)
  const pathname = usePathname()

  useEffect(() => endNavigation(), [pathname])

  useEffect(() => {
    if (!pending) return
    window.scrollTo(0, 0)
    window.addEventListener("popstate", endNavigation)
    return () => window.removeEventListener("popstate", endNavigation)
  }, [pending])

  return (
    <>
      {pending === "detail" && <DetailSkeleton />}
      {pending === "list" && <ListSkeleton />}
      {/* The page stays mounted (state, scroll handlers) and only hides while the next one loads */}
      <div style={{ display: pending ? "none" : "contents" }}>{children}</div>
    </>
  )
}
