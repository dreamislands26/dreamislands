"use client"
// Catalogue map (OpenStreetMap tiles via Leaflet). Zoomed out: one price pin per country (tap zooms in).
// Closer: one pin per place; tapping it selects the place (Figma 214:30302, 214:30519): the pin turns
// dark, the results sheet and tab bar step aside and a carousel of program cards opens at that place.
// Swiping to a card of another place switches the dark pin and pans the map to it. Close, a tap on the
// empty map or a swipe down on a card deselects. Dragging the map lowers the results sheet. Leaflet
// loads on the client only.
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import "leaflet/dist/leaflet.css"
import { Photo } from "../ds/cards"
import { isSaved, toggleSaved, useSaved, type SavedItem } from "../ds/saved"
import { Facts, Icon } from "../ds/ui"
import { MAP_DRAG, MAP_SELECT } from "./ResultsSheet"
import m from "./catalogMap.module.css"
import Flag from "../ds/Flag"

export type MapProgram = { id: string; minPrice: number; name: string; href: string; image: string | null; flag: string | null; place: string[]; rating: number | null; price: string; duration: string | null }
export type MapPoint = { key: string; at: [number, number]; label: string; country: string; min: number; programs: MapProgram[] }

const usd = (n: number) => "$" + n.toLocaleString("en-US")
const DETAIL_ZOOM = 4.5 // below it, one pin per country (the Asia overview sits around 3.5)
const PLACE_ZOOM = 8 // a tapped pin zooms in at least this far

export default function CatalogMap({ points }: { points: MapPoint[] }) {
  const el = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<string | null>(null)
  // Bumped when a pin (not the carousel) picks the place, so the carousel jumps to it
  const [jump, setJump] = useState(0)
  const selectRef = useRef<(key: string | null, fromCarousel?: boolean) => void>(() => {})
  // All cards, place by place (cheapest place first), cheapest program first within a place
  const cards = useMemo(() => [...points].sort((a, b) => a.min - b.min).flatMap((p) => [...p.programs].sort((a, b) => a.minPrice - b.minPrice).map((prog) => ({ ...prog, place: prog.place, key: p.key }))), [points])

  useEffect(() => {
    let map: import("leaflet").Map | undefined
    let cancelled = false
    let ro: ResizeObserver | undefined
    import("leaflet").then((L) => {
      if (cancelled || !el.current) return
      map = L.map(el.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false, zoomSnap: 0.25 })
      map.attributionControl.setPrefix(false)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap" }).addTo(map)
      const pin = (label: string, on = false) => L.divIcon({ className: m.pinWrap, html: `<span class="${m.pin}${on ? " " + m.pinOn : ""}">${label}</span>`, iconSize: undefined })
      const markers = new Map<string, import("leaflet").Marker>()
      let current: string | null = null
      const select = (key: string | null, fromCarousel = false) => {
        if (key === current) return
        const prev = current ? points.find((x) => x.key === current) : undefined
        if (prev) markers.get(prev.key)?.setIcon(pin(prev.label)).setZIndexOffset(0)
        current = key
        const p = key ? points.find((x) => x.key === key) : undefined
        if (p && map) {
          markers.get(p.key)?.setIcon(pin(p.label, true)).setZIndexOffset(1000)
          // A pin tapped from far away zooms in to the place; the carousel keeps the zoom. The pin
          // stays in view above the cards.
          const z = fromCarousel ? map.getZoom() : Math.max(map.getZoom(), PLACE_ZOOM)
          const target = map.project(p.at, z).add([0, Math.round(window.innerHeight * 0.18)])
          map.flyTo(map.unproject(target, z), z, { duration: z !== map.getZoom() ? 0.7 : 0.45 })
        }
        setSelected(key)
        if (!fromCarousel) setJump((n) => n + 1)
        window.dispatchEvent(new CustomEvent(MAP_SELECT, { detail: key }))
      }
      selectRef.current = select
      const places = L.layerGroup(points.map((p) => {
        const mk = L.marker(p.at, { icon: pin(p.label), keyboard: false }).on("click", (e) => { L.DomEvent.stopPropagation(e); select(p.key) })
        markers.set(p.key, mk)
        return mk
      }))
      const byCountry = new Map<string, MapPoint[]>()
      for (const p of points) byCountry.set(p.country, [...(byCountry.get(p.country) ?? []), p])
      const countries = L.layerGroup([...byCountry.values()].map((ps) => {
        const at: [number, number] = [ps.reduce((a, p) => a + p.at[0], 0) / ps.length, ps.reduce((a, p) => a + p.at[1], 0) / ps.length]
        // The country pin shows its cheapest place: tapping it zooms in and opens that place's card
        const best = ps.reduce((a, b) => (b.min < a.min ? b : a))
        return L.marker(at, { icon: pin(usd(best.min)), keyboard: false })
          .on("click", (e) => { L.DomEvent.stopPropagation(e); select(best.key) })
      }))
      const sync = () => {
        if (!map) return
        if (map.getZoom() >= DETAIL_ZOOM) { countries.remove(); places.addTo(map) }
        else { places.remove(); countries.addTo(map); if (current) select(null) }
      }
      map.on("zoomend", sync)
      map.on("click", () => { if (current) select(null) })
      // Moving the map by hand lowers the results sheet
      map.on("dragstart", () => window.dispatchEvent(new Event(MAP_DRAG)))
      const frame = () => {
        if (!map || current) return
        map.invalidateSize()
        if (points.length === 1) map.setView(points[0].at, 9)
        else if (points.length) map.fitBounds(L.latLngBounds(points.map((p) => p.at)), { paddingTopLeft: [16, 118], paddingBottomRight: [16, Math.round(window.innerHeight * 0.54) + 16], maxZoom: 9 })
        else map.setView([10, 110], 4)
      }
      frame()
      sync()
      ro = new ResizeObserver(() => frame())
      ro.observe(el.current)
    })
    return () => {
      cancelled = true
      ro?.disconnect()
      map?.remove()
      setSelected(null)
      window.dispatchEvent(new CustomEvent(MAP_SELECT, { detail: null }))
    }
  }, [points])

  return (
    <>
      <div ref={el} className={m.map} />
      {selected && createPortal(<PlaceCards cards={cards} selected={selected} jump={jump} onPlace={(k) => selectRef.current(k, true)} onClose={() => selectRef.current(null)} />, document.body)}
    </>
  )
}

type Card = MapProgram & { key: string }

/** Card carousel (Figma 214:30519): centred 348px cards, neighbours peeking, snapped one by one. Opens at
 *  the selected place; settling on another place's card tells the map to switch the pin. */
function PlaceCards({ cards, selected, jump, onPlace, onClose }: { cards: Card[]; selected: string; jump: number; onPlace: (key: string) => void; onClose: () => void }) {
  const wrap = useRef<HTMLDivElement>(null)
  const opened = useRef(false)
  // Jump to the place picked on the map (instant on open, smooth afterwards)
  useEffect(() => {
    const w = wrap.current
    if (!w) return
    const i = cards.findIndex((c) => c.key === selected)
    const card = w.children[i] as HTMLElement | undefined
    if (card) w.scrollTo({ left: card.offsetLeft - (w.clientWidth - card.offsetWidth) / 2, behavior: opened.current ? "smooth" : "auto" })
    opened.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jump])
  // When a swipe settles, follow the centred card's place
  useEffect(() => {
    const w = wrap.current
    if (!w) return
    let t = 0
    const onScroll = () => {
      window.clearTimeout(t)
      t = window.setTimeout(() => {
        const mid = w.scrollLeft + w.clientWidth / 2
        let best = 0, dist = Infinity
        Array.from(w.children).forEach((el, i) => { const e = el as HTMLElement; const d = Math.abs(e.offsetLeft + e.offsetWidth / 2 - mid); if (d < dist) { dist = d; best = i } })
        const key = cards[best]?.key
        if (key && key !== selected) onPlace(key)
      }, 120)
    }
    w.addEventListener("scroll", onScroll, { passive: true })
    return () => { w.removeEventListener("scroll", onScroll); window.clearTimeout(t) }
  }, [cards, selected, onPlace])

  const drag = useRef<{ y: number; dy: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => { drag.current = { y: e.touches[0].clientY, dy: 0 } }
  const onTouchMove = (e: React.TouchEvent) => {
    if (!drag.current || !wrap.current) return
    drag.current.dy = Math.max(0, e.touches[0].clientY - drag.current.y)
    wrap.current.style.transition = "none"
    wrap.current.style.transform = `translateY(${drag.current.dy}px)`
  }
  const onTouchEnd = () => {
    const d = drag.current
    drag.current = null
    if (!wrap.current) return
    wrap.current.style.transition = ""
    wrap.current.style.transform = ""
    if (d && d.dy > 70) onClose()
  }
  return (
    <div ref={wrap} className={m.cards}>
      {cards.map((p) => (
        <article key={p.id} className={m.card}>
          <Photo src={p.image} alt={p.name} className={m.photo} sizes="100vw">
            <div className={m.grab} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
              <span className={m.handle} aria-hidden />
            </div>
            <div className={m.actions}>
              <MiniSave item={{ kind: "program", id: p.id, title: p.name, href: p.href, image: p.image, meta: [p.flag, p.place[0]].filter(Boolean).join(" "), price: p.price }} />
              <button type="button" className={m.mini} aria-label="Close" onClick={onClose}><Icon name="close" /></button>
            </div>
          </Photo>
          <Link href={p.href} className={m.text}>
            <span className={m.titleRow}>
              <span className={m.title}>{p.name}</span>
              {p.rating ? <span className={m.rating}><span className={m.star} aria-hidden>★</span>{p.rating.toFixed(1)}</span> : null}
            </span>
            <span className={m.line}>{p.flag ? <Flag of={p.flag} /> : null}<Facts items={p.place} /></span>
            <span className={m.line}>{p.price}{p.duration ? <><i className={m.dot} aria-hidden />{p.duration}</> : null}</span>
          </Link>
        </article>
      ))}
    </div>
  )
}

/** Card heart (Figma 214:30302): white 28px plate, dark outline, red when saved. */
function MiniSave({ item }: { item: SavedItem }) {
  const list = useSaved()
  const on = isSaved(list, item.kind, item.id)
  return (
    <button type="button" className={m.mini} aria-pressed={on} aria-label={on ? "Remove from saved" : "Save"} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSaved(item) }}>
      <Icon name="favorite" fill={on} className={on ? m.heartOn : m.heart} />
    </button>
  )
}
