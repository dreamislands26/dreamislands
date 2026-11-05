"use client"

import { useEffect, useSyncExternalStore, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { endNavigation, getPending, getServerPending, subscribe, type Pending } from "@/lib/nav-pending"
import { countryFromSlug } from "../_lib/countries"
import { TANYA_SLUGS } from "../_lib/tanya"
import { DetailSkeleton, ListSkeleton } from "./skeletons"
import { CatalogShell, CountryShell, PlaceShell, ProgramShell } from "./shells"

/** The next page's own layout when it is known, otherwise a general template. */
function Loading({ next }: { next: Pending }) {
  const [, section, slug] = next.path.split("/")
  if (next.kind === "detail") {
    if (section === "programs") return <ProgramShell preview={next.preview} />
    // The Tanya places redirect to their landing; the CLP page has a layout of its own
    if (section === "properties" && TANYA_SLUGS.has(slug)) return <ListSkeleton />
    if (section === "properties" && slug !== "clinique-la-prairie-phuket") return <PlaceShell preview={next.preview} />
    return <DetailSkeleton />
  }
  if (next.path === "/programs") return <CatalogShell search={next.search} />
  const country = section === "destinations" && slug ? countryFromSlug(slug) : null
  if (country && next.path.split("/").length === 3) return <CountryShell country={country} />
  return <ListSkeleton />
}

/** Shows a loading skeleton in place of the page while another page loads (see lib/nav-pending). */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pending = useSyncExternalStore(subscribe, getPending, getServerPending)
  const pathname = usePathname()

  useEffect(() => endNavigation(), [pathname])

  const page = pending?.kind === "list" || pending?.kind === "detail"
  useEffect(() => {
    if (!page) return
    window.scrollTo(0, 0)
    window.addEventListener("popstate", endNavigation)
    return () => window.removeEventListener("popstate", endNavigation)
  }, [page])

  return (
    <>
      {page && <Loading next={pending} />}
      {/* The page stays mounted (state, scroll handlers) and only hides while the next one loads */}
      <div style={{ display: page ? "none" : "contents" }}>{children}</div>
    </>
  )
}
