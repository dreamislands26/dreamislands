"use client"
// S1 mobile header: fixed, transparent over the hero; once the hero is scrolled past it takes
// the background colour and the "Find program" button turns green (Figma 97:2767, Oleg 17.10.2026).
import Link from "next/link"
import { Children, useEffect, useRef, useState, type ReactNode } from "react"
import { Account, MobileMenu } from "../ds/chrome"
import m from "./homeMobile.module.css"

export const HERO_ID = "home-hero"

export default function HomeMobileHeader() {
  const [past, setPast] = useState(false)
  const bar = useRef<HTMLElement>(null)
  useEffect(() => {
    const hero = document.getElementById(HERO_ID)
    if (!hero) return
    // The header scales with rem, so take its real height.
    const io = new IntersectionObserver(([e]) => setPast(!e.isIntersecting), { rootMargin: `-${bar.current?.offsetHeight ?? 48}px 0px 0px 0px` })
    io.observe(hero)
    // Wolt-style: the hero's rounded bottom corners slide out past the screen edges as it scrolls up
    // under the header, so the edge seems to unfold into a straight line.
    const flatten = () => {
      const range = hero.offsetHeight - (bar.current?.offsetHeight ?? 48)
      const p = Math.min(1, Math.max(0, window.scrollY / range))
      hero.style.setProperty("--hero-p", String(p))
    }
    flatten()
    window.addEventListener("scroll", flatten, { passive: true })
    return () => { io.disconnect(); window.removeEventListener("scroll", flatten) }
  }, [])
  return (
    <header ref={bar} className={`${m.bar} ${past ? m.barSolid : ""}`}>
      <Link href="/" className={m.barMark} aria-label="Dream Islands, home" />
      <div className={m.barActions}>
        <Account variant="photo" loginLabel="Sign Up" />
        <Link href="/start" className={`${m.barBtn} ${past ? m.barBtnGreen : ""}`}>Find programme</Link>
        <MobileMenu variant="photo" />
      </div>
    </header>
  )
}

/** "See all programs": first `step` cards, then "Load more" reveals the next batch.
 *  After the 2nd "Load more" the full prompt banner appears where the new batch starts; after that,
 *  every 3rd press (5th, 8th, ...) adds a one-line nudge button, rotating through `nudges`. */
export function LoadMore({ children, banner, nudges = [], step = 6 }: { children: ReactNode; banner?: ReactNode; nudges?: { label: string; href: string; external?: boolean }[]; step?: number }) {
  const items = Children.toArray(children)
  const [shown, setShown] = useState(step)
  const more = shown < items.length
  const presses = shown / step - 1
  const inserts = new Map<number, ReactNode>()
  if (banner && presses >= 2) inserts.set(step * 2, <div key="decide" className={m.gridBanner}>{banner}</div>)
  for (let n = 5, k = 0; n <= presses && nudges.length; n += 3, k++) {
    const nudge = nudges[k % nudges.length]
    inserts.set(step * n, (
      <a key={`nudge-${n}`} href={nudge.href} className={`${m.gridBanner} ${m.nudge}`} {...(nudge.external ? { target: "_blank", rel: "noreferrer" } : {})}>
        <span>{nudge.label}</span>
        <svg style={{ width: "0.6875rem", height: "0.75rem" }} viewBox="0 0 11 12" fill="none" aria-hidden>
          <path d="M0 6.89189V5.12432H8.34429L4.22714 1.23243L5.40571 0L11 5.43243V6.56757L5.40571 12L4.21143 10.7514L8.31286 6.89189H0Z" fill="currentColor" />
        </svg>
      </a>
    ))
  }
  const visible: ReactNode[] = []
  items.slice(0, shown).forEach((it, i) => {
    if (inserts.has(i)) visible.push(inserts.get(i))
    visible.push(it)
  })
  return (
    <>
      <div className={m.gridWrap}>
        <div className={m.grid}>{visible}</div>
        {more && <div className={m.gridFade} aria-hidden />}
      </div>
      {more && (
        <div className={m.loadMore}>
          <button type="button" className={m.loadBtn} onClick={() => setShown((n) => n + step)}>Load more</button>
          <p className="ds-body-m ds-muted">{shown} of {items.length}</p>
        </div>
      )}
    </>
  )
}
