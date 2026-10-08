"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

// Reusable scroll-activation primitive for the route/journey motion system.
// Adds `iv-active` to its wrapper once the element enters the viewport, then
// disconnects (motion plays once, not on every scroll pass). Degrades safely:
// if IntersectionObserver is unavailable, content is marked active immediately
// rather than staying hidden. All CSS gated behind `.iv-active` must treat the
// unactivated state as fully legible — this only adds decorative motion on
// top, never controls whether information is visible.
//
// Deliberately homepage-agnostic so it can be reused for Wellness Baseline,
// assessment results, program matching and other route/progress surfaces.
export default function InViewMotion({
  children,
  className = "",
  threshold = 0.3,
}: {
  children: ReactNode
  className?: string
  threshold?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      setActive(true)
      return
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(true)
            obs.disconnect()
          }
        }
      },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return (
    <div ref={ref} className={"iv" + (active ? " iv-active" : "") + (className ? " " + className : "")}>
      {children}
    </div>
  )
}
