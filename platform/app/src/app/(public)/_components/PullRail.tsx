"use client"
// Horizontal rail with a Wolt-style "see all" tab (Figma 150:24472). Nothing shows at rest: once the
// rail hits its end, pulling further drags the tab in with the finger, then stretches it, and past
// the threshold it morphs into a circle. Letting go on the circle opens the full list; otherwise the
// tab slides back out. Native scrolling is never blocked, so the rail always scrolls back.
import { useRouter } from "next/navigation"
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react"
import p from "./pullRail.module.css"

const ARM = 110 // pull distance (after resistance) that turns the tab into a circle

export default function PullRail({ href, children, photo = 164, gap = 12, label = "see all" }: { href: string; children: ReactNode; photo?: number; gap?: number; label?: string }) {
  const router = useRouter()
  const wrap = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const w = wrap.current, sc = scroller.current
    if (!w || !sc) return
    const set = (k: string, v: number) => w.style.setProperty(k, String(v))
    const max = () => sc.scrollWidth - sc.clientWidth

    let x0 = 0, y0 = 0, last = 0, dir: "x" | "y" | null = null, from: number | null = null, armed = false
    const reset = () => { from = null; armed = false; delete w.dataset.drag; delete w.dataset.armed; set("--pull", 0) }
    const start = (e: TouchEvent) => { x0 = last = e.touches[0].clientX; y0 = e.touches[0].clientY; dir = null; from = null; armed = false }
    const move = (e: TouchEvent) => {
      const x = e.touches[0].clientX, y = e.touches[0].clientY
      const prev = last
      last = x
      if (!dir) {
        if (Math.abs(x - x0) < 6 && Math.abs(y - y0) < 6) return
        dir = Math.abs(x - x0) > Math.abs(y - y0) ? "x" : "y"
      }
      if (dir !== "x") return
      if (from === null) {
        // Start pulling only when the rail is already at its end and the finger keeps going left.
        if (x >= prev || sc.scrollLeft < max() - 1) return
        from = prev
        w.dataset.drag = ""
      }
      const raw = from - x
      if (raw <= 0) { reset(); return } // finger went back: hand over to normal scrolling
      const pull = raw * 0.6 // rubber-band resistance
      set("--pull", pull)
      const nowArmed = pull > ARM
      if (nowArmed !== armed) {
        armed = nowArmed
        if (armed) { w.dataset.armed = ""; navigator.vibrate?.(8) } else delete w.dataset.armed
      }
    }
    const end = () => {
      if (from === null) return
      delete w.dataset.drag
      if (armed) { router.push(href); return }
      reset()
    }
    sc.addEventListener("touchstart", start, { passive: true })
    sc.addEventListener("touchmove", move, { passive: true })
    sc.addEventListener("touchend", end)
    sc.addEventListener("touchcancel", end)
    return () => {
      sc.removeEventListener("touchstart", start)
      sc.removeEventListener("touchmove", move)
      sc.removeEventListener("touchend", end)
      sc.removeEventListener("touchcancel", end)
    }
  }, [href, router])

  return (
    <div ref={wrap} className={p.wrap} style={{ "--photo": `${photo / 16}rem`, "--gap": `${gap / 16}rem` } as CSSProperties}>
      <div ref={scroller} className={p.scroller}>
        {children}
      </div>
      <a href={href} className={p.tab} tabIndex={-1} aria-hidden onClick={(e) => { e.preventDefault(); router.push(href) }}>
        <span className={p.label}>{label}</span>
        <svg className={p.arrow} style={{ width: "1rem", height: "1.125rem" }} viewBox="0 0 11 12" fill="none" aria-hidden>
          <path d="M0 6.89189V5.12432H8.34429L4.22714 1.23243L5.40571 0L11 5.43243V6.56757L5.40571 12L4.21143 10.7514L8.31286 6.89189H0Z" fill="currentColor" />
        </svg>
      </a>
    </div>
  )
}
