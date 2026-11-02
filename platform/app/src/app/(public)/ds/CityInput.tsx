"use client"
import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import t from "./tripsearch.module.css"

type Rect = { left: number; width: number; top?: number; bottom?: number }

/** Open city autocomplete: type any city, get matches (Open-Meteo geocoding, no key). Free text stays valid.
 *  The list is portalled into .ds-root and positioned with fixed coordinates, so hero/sheet overflow never clips it. */
export default function CityInput({ value, onChange, className, style, placeholder = "City" }: {
  value: string
  onChange: (v: string) => void
  className?: string
  style?: React.CSSProperties
  placeholder?: string
}) {
  const [hits, setHits] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [rect, setRect] = useState<Rect | null>(null)
  const ref = useRef<HTMLInputElement>(null)
  const skip = useRef(false) // set after picking a suggestion so it does not reopen the list
  const listId = useId()

  const place = () => {
    const el = ref.current
    if (!el) return
    const b = el.getBoundingClientRect()
    const below = window.innerHeight - b.bottom
    const up = below < 280 && b.top > below
    setRect({ left: b.left, width: Math.max(b.width, 240), ...(up ? { bottom: window.innerHeight - b.top + 6 } : { top: b.bottom + 6 }) })
  }

  useEffect(() => {
    if (skip.current) { skip.current = false; return }
    const q = value.trim()
    if (q.length < 2) { setHits([]); setOpen(false); return }
    const ctrl = new AbortController()
    const id = window.setTimeout(async () => {
      try {
        const r = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`,
          { signal: ctrl.signal },
        )
        if (!r.ok) return
        const j = await r.json()
        const seen = new Set<string>()
        const out: string[] = []
        for (const x of (j.results ?? []) as Array<{ name?: string; country?: string }>) {
          const label = [x.name, x.country].filter(Boolean).join(", ")
          if (label && !seen.has(label)) { seen.add(label); out.push(label) }
        }
        setHits(out)
        setActive(-1)
        if (out.length && document.activeElement === ref.current) { place(); setOpen(true) } else setOpen(false)
      } catch {
        /* offline or aborted: free text still works */
      }
    }, 250)
    return () => { window.clearTimeout(id); ctrl.abort() }
  }, [value])

  useEffect(() => {
    if (!open) return
    const h = () => place()
    window.addEventListener("scroll", h, true)
    window.addEventListener("resize", h)
    return () => { window.removeEventListener("scroll", h, true); window.removeEventListener("resize", h) }
  }, [open])

  const pick = (label: string) => { skip.current = true; onChange(label); setOpen(false); setActive(-1) }

  return (
    <>
      <input
        ref={ref}
        className={className}
        style={style}
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { if (hits.length) { place(); setOpen(true) } }}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && hits.length) { e.preventDefault(); if (!open) { place(); setOpen(true) } setActive((a) => (a + 1) % hits.length) }
          else if (e.key === "ArrowUp" && open) { e.preventDefault(); setActive((a) => (a <= 0 ? hits.length - 1 : a - 1)) }
          else if (e.key === "Enter" && open && active >= 0) { e.preventDefault(); pick(hits[active]) }
          else if (e.key === "Escape") setOpen(false)
        }}
      />
      {open && rect && typeof document !== "undefined" &&
        createPortal(
          <ul id={listId} role="listbox" className={t.cityList} style={{ position: "fixed", left: rect.left, width: rect.width, top: rect.top, bottom: rect.bottom }}>
            {hits.map((h, i) => (
              <li key={h} role="option" aria-selected={i === active} className={i === active ? `${t.cityItem} ${t.cityItemOn}` : t.cityItem}
                onMouseDown={(e) => { e.preventDefault(); pick(h) }} onMouseEnter={() => setActive(i)}>
                {h}
              </li>
            ))}
          </ul>,
          document.querySelector(".ds-root") ?? document.body,
        )}
    </>
  )
}
