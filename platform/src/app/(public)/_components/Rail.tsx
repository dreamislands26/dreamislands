"use client"
import { useEffect, useRef, useState } from "react"

// Horizontal rail with prev/next arrows and an edge fade, so it's obvious the
// row scrolls (the plain .rail was cut off on the right with no cue).
export default function Rail({
  children,
  label,
  style,
}: {
  children: React.ReactNode
  label: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      setCanPrev(el.scrollLeft > 4)
      setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    }
    update()
    el.addEventListener("scroll", update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", update)
      ro.disconnect()
    }
  }, [])

  const scroll = (dir: 1 | -1) => {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" })
  }

  return (
    <div className={"rail-wrap" + (canNext ? " rail-more" : "") + (canPrev ? " rail-back" : "")}>
      <div ref={ref} className="rail" style={style} role="region" aria-label={label} tabIndex={0}>
        {children}
      </div>
      <button type="button" className="rail-arrow rail-arrow-prev" onClick={() => scroll(-1)} aria-label="Scroll back" hidden={!canPrev}>
        ‹
      </button>
      <button type="button" className="rail-arrow rail-arrow-next" onClick={() => scroll(1)} aria-label="Scroll forward" hidden={!canNext}>
        ›
      </button>
    </div>
  )
}
