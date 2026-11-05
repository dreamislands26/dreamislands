"use client"

import { useEffect, useSyncExternalStore, type ReactNode } from "react"
import { useSearchParams } from "next/navigation"
import { endNavigation, getPending, getServerPending, subscribe } from "@/lib/nav-pending"
import { CardsSkeleton } from "./skeletons"

/**
 * Results that reload when the query changes (filters, search). While the new results load,
 * shows skeleton cards in their place; the header and filters around stay as they are.
 * `className` is the real grid's class, so the skeleton takes the same layout.
 */
export default function Results({ className, count = 6, wide, children }: { className: string; count?: number; wide?: boolean; children: ReactNode }) {
  const pending = useSyncExternalStore(subscribe, getPending, getServerPending)
  const query = useSearchParams().toString()

  useEffect(() => endNavigation(), [query])

  if (pending === "results") return <CardsSkeleton className={className} count={count} wide={wide} />
  return <>{children}</>
}
