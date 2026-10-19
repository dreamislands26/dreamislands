"use client"
// Results sheet over the catalogue map (mobile). Three resting points: collapsed (only the count at the
// tab bar), half (default, Figma 110:5430) and full (the list scrolls). Dragging snaps to the nearest
// point, a flick moves one point; moving the map drops the sheet to collapsed; while a map pin is
// selected the sheet steps aside for the place card.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import m from "./resultsSheet.module.css"

type Snap = "collapsed" | "half" | "full"
const ORDER: Snap[] = ["full", "half", "collapsed"]
export const MAP_DRAG = "catalog-map-drag"
export const MAP_SELECT = "catalog-map-select"

export default function ResultsSheet({ head, children }: { head: ReactNode; children: ReactNode }) {
  const sheet = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const [snap, setSnap] = useState<Snap>("half")
  const [pos, setPos] = useState<Record<Snap, number> | null>(null)
  const [away, setAway] = useState(false)

  // Resting points in px from the top of the viewport
  const measure = useCallback(() => {
    const vh = window.innerHeight
    const bar = document.querySelector("[data-search-top]")?.getBoundingClientRect().bottom ?? 120
    // No tab bar on the search screen: keep the collapsed count clear of the home indicator instead
    const tabs = document.querySelector("[data-tabbar]")?.getBoundingClientRect().height ?? 28
    const peek = (sheet.current?.querySelector("[data-sheet-head]") as HTMLElement | null)?.offsetHeight ?? 76
    setPos({ full: Math.round(bar), half: Math.round(vh * 0.46), collapsed: Math.round(vh - tabs - peek) })
  }, [])

  useEffect(() => {
    if (!window.matchMedia("(max-width: 767px)").matches) return
    const html = document.documentElement
    const prev = html.style.overflow
    // The screen is fixed (map + sheet): start from the very top, or a scroll carried over from the
    // previous page (the home pre-scroll) would stay locked in and push the search bar under the
    // status bar.
    window.scrollTo(0, 0)
    html.style.overflow = "hidden"
    measure()
    window.addEventListener("resize", measure)
    const onDrag = () => setSnap("collapsed")
    // A selected map pin shows its own card: the sheet and the tab bar step aside until it closes
    const onSelect = (e: Event) => {
      const on = !!(e as CustomEvent<string | null>).detail
      setAway(on)
      if (on) html.dataset.mapCard = "1"
      else delete html.dataset.mapCard
    }
    window.addEventListener(MAP_DRAG, onDrag)
    window.addEventListener(MAP_SELECT, onSelect)
    return () => {
      html.style.overflow = prev
      window.removeEventListener("resize", measure)
      window.removeEventListener(MAP_DRAG, onDrag)
      window.removeEventListener(MAP_SELECT, onSelect)
      delete html.dataset.mapCard
    }
  }, [measure])

  // Touch dragging (non-passive so the page never scrolls instead)
  useEffect(() => {
    const el = sheet.current, ls = list.current
    if (!el || !ls || !pos) return
    let y0 = 0, base = 0, dy = 0, dragging = false, decided = false, fromList = false
    const set = (y: number) => { el.style.transform = `translateY(${y}px)` }
    const start = (e: TouchEvent) => {
      y0 = e.touches[0].clientY; base = pos[snap]; dy = 0; dragging = false; decided = false
      fromList = ls.contains(e.target as Node)
    }
    const move = (e: TouchEvent) => {
      dy = e.touches[0].clientY - y0
      if (!decided) {
        if (Math.abs(dy) < 4) return
        decided = true
        // In the full state the list scrolls; the sheet only follows a pull-down from the very top
        dragging = snap !== "full" || !fromList || (ls.scrollTop <= 0 && dy > 0)
        if (dragging) el.style.transition = "none"
      }
      if (!dragging) return
      e.preventDefault()
      set(Math.min(pos.collapsed + 24, Math.max(pos.full, base + dy)))
    }
    const end = () => {
      if (!dragging) return
      dragging = false
      el.style.transition = ""
      const y = base + dy
      const i = ORDER.indexOf(snap)
      let next: Snap
      if (dy > 60) next = ORDER[Math.min(ORDER.length - 1, i + 1)]
      else if (dy < -60) next = ORDER[Math.max(0, i - 1)]
      else next = ORDER.reduce((a, b) => (Math.abs(pos[b] - y) < Math.abs(pos[a] - y) ? b : a))
      // A long pull can pass the middle point
      if (Math.abs(dy) > 260) next = dy > 0 ? "collapsed" : "full"
      set(pos[next])
      setSnap(next)
    }
    el.addEventListener("touchstart", start, { passive: true })
    el.addEventListener("touchmove", move, { passive: false })
    el.addEventListener("touchend", end)
    el.addEventListener("touchcancel", end)
    return () => {
      el.removeEventListener("touchstart", start)
      el.removeEventListener("touchmove", move)
      el.removeEventListener("touchend", end)
      el.removeEventListener("touchcancel", end)
    }
  }, [pos, snap])

  useEffect(() => {
    if (snap !== "full") list.current?.scrollTo({ top: 0 })
  }, [snap])

  const y = pos?.[snap]
  return (
    <div
      ref={sheet}
      className={m.sheet}
      data-snap={snap}
      data-away={away ? "1" : undefined}
      style={y === undefined ? undefined : { transform: `translateY(${y}px)`, ["--full" as string]: `${pos!.full}px` }}
    >
      <div data-sheet-head className={m.head} onClick={() => snap === "collapsed" && setSnap("half")}>
        <span className={m.handle} aria-hidden />
        {head}
      </div>
      <div ref={list} className={m.list}>{children}</div>
    </div>
  )
}
