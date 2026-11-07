"use client"
// Gallery page dots (Oleg 07.11.2026): the current photo's dot sits in the middle, stretched into a pill;
// its neighbours are stretched a little, the rest are round and shrink towards the edges. The dots follow
// the swipe itself: while you swipe the next dot slides into the middle and grows as the current one
// shrinks away.
// Smoothness: the dots listen to the scroller themselves and are written straight to the DOM once per
// frame (requestAnimationFrame), so a swipe never re-renders the gallery and nothing lags behind the finger.
import { useEffect, useRef, type RefObject } from "react"
import s from "./pageDots.module.css"

const GAP = 4 // px between dots
const H = 6 // dot height, px
const WIDTH = 140 // the strip; dots further out fade away

/** Size and tone of a dot `a` photos away from the current position (fractional while swiping). Every dot
 *  is opaque: white in the middle, light grey further out; the far ones shrink away instead of fading. */
function look(a: number) {
  const w = a < 1 ? 18 - 8 * a : a < 2 ? 10 - 4 * (a - 1) : H // 18 → 10 → 6
  const scale = a <= 1.5 ? 1 : Math.max(0, 1 - (a - 1.5) * 0.33) // the round ones shrink outwards, gone by 4.5
  const tone = Math.round(255 - 45 * Math.min(1, a)) // 255 → 210
  return { w: w * scale, h: H * scale, tone }
}

function paint(dots: HTMLElement[], progress: number) {
  const count = dots.length
  const p = Math.min(count - 1, Math.max(0, progress))
  const looks = dots.map((_, k) => look(Math.abs(k - p)))
  const centres: number[] = []
  let x = 0
  for (const d of looks) { centres.push(x + d.w / 2); x += d.w + GAP }
  const lo = Math.floor(p), hi = Math.min(count - 1, lo + 1)
  const shift = WIDTH / 2 - (centres[lo] + (centres[hi] - centres[lo]) * (p - lo))
  looks.forEach((d, k) => {
    const st = dots[k].style
    st.transform = `translate3d(${(shift + centres[k] - d.w / 2).toFixed(2)}px, ${(-d.h / 2).toFixed(2)}px, 0)`
    st.width = `${d.w.toFixed(2)}px`
    st.height = `${d.h.toFixed(2)}px`
    // Opaque: a see-through dot lets the strip's shadow show through, and its tone jumps while it moves
    st.backgroundColor = `rgb(${d.tone}, ${d.tone}, ${d.tone})`
  })
}

/** `scroller`: the horizontal photo track; one photo per its width. */
export default function PageDots({ count, scroller, className }: { count: number; scroller: RefObject<HTMLElement | null>; className?: string }) {
  const strip = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = scroller.current, box = strip.current
    if (!el || !box || count < 2) return
    const dots = Array.from(box.children) as HTMLElement[]
    let raf = 0
    const frame = () => {
      raf = 0
      const p = el.clientWidth ? el.scrollLeft / el.clientWidth : 0
      paint(dots, p)
      box.setAttribute("aria-label", `Photo ${Math.round(p) + 1} of ${count}`)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(frame) }
    frame()
    el.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => { el.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf) }
  }, [scroller, count])
  if (count < 2) return null
  return (
    <span ref={strip} className={`${s.dots}${className ? ` ${className}` : ""}`} style={{ width: WIDTH }} role="img" aria-label={`Photo 1 of ${count}`}>
      {Array.from({ length: count }, (_, k) => <i key={k} className={s.dot} />)}
    </span>
  )
}
