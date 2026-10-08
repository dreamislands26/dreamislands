"use client"

import Link from "next/link"
import { useEffect, useRef, type ReactNode } from "react"
import { track } from "../../_lib/track"

export function PageViewTracker({ event, params }: { event: string; params?: Record<string, unknown> }) {
  useEffect(() => {
    track(event, params)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

export function ViewTracker({
  event,
  params,
  children,
}: {
  event: string
  params?: Record<string, unknown>
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const fired = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !fired.current) {
          fired.current = true
          track(event, params)
          obs.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    obs.observe(el)
    return () => obs.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event])

  return <div ref={ref}>{children}</div>
}

export function TrackedAnchor({
  href,
  event,
  params,
  className,
  children,
}: {
  href: string
  event: string
  params?: Record<string, unknown>
  className?: string
  children: ReactNode
}) {
  return (
    <a href={href} className={className} onClick={() => track(event, params)}>
      {children}
    </a>
  )
}

export function TrackedLink({
  href,
  event,
  params,
  className,
  children,
}: {
  href: string
  event: string
  params?: Record<string, unknown>
  className?: string
  children: ReactNode
}) {
  return (
    <Link href={href} className={className} onClick={() => track(event, params)}>
      {children}
    </Link>
  )
}
