"use client"
// Catalogue map (OpenStreetMap tiles via Leaflet). Zoomed out: one price pin per country (tap zooms in).
// Closer: one pin per place; tapping it selects the place (Figma 214:30302, 214:30519): the pin turns
// dark, the results sheet and tab bar step aside and a carousel of program cards opens at that place.
// Swiping to a card of another place switches the dark pin and pans the map to it. Close, a tap on the
// empty map or a swipe down on a card deselects. Dragging the map lowers the results sheet. Leaflet
// loads on the client only.
// The page renders city-level pins. Before drawing, the map asks /api/map/points (with the page's
// token) for property-level points and splits each city into its properties; if that fails or is slow,
// the city pins stay.
import Link from "@/lib/i18n-link"
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
const REFINE_TIMEOUT_MS = 2500
const GROUP_KM = 60 // places chained closer than this form one group (an island, a stretch of coast)

/** Rough distance in km; good enough to order places a few hundred km apart. */
function km(a: [number, number], b: [number, number]) {
  const x = (b[1] - a[1]) * Math.cos(((a[0] + b[0]) / 2) * (Math.PI / 180))
  return Math.hypot(x, b[0] - a[0]) * 111.32
}

/** Carousel order from the place tapped on the map, nearest first, in two levels of clusters:
 *  - a group: places chained less than GROUP_KM apart (an island, a city); the carousel finishes the
 *    current group before leaving it, swiping each time to the nearest place not shown yet;
 *  - a country (the cluster the zoomed-out map shows as one pin): the rest of the country comes next,
 *    again nearest to the last card, so the map pans a little at a time.
 *  When the country is done, the carousel moves to the country nearest to the tapped place. */
function route(points: MapPoint[], start: string): MapPoint[] {
  const origin = points.find((p) => p.key === start)
  if (!origin) return points
  let cur: MapPoint = origin
  let country = origin.country
  const group = new Map<string, number>()
  points.forEach((p, i) => {
    if (group.has(p.key)) return
    group.set(p.key, i)
    const queue = [p]
    while (queue.length) {
      const q = queue.pop()!
      for (const o of points) if (!group.has(o.key) && km(q.at, o.at) < GROUP_KM) { group.set(o.key, i); queue.push(o) }
    }
  })
  const out = [cur]
  const left = points.filter((p) => p !== cur)
  while (left.length) {
    const inGroup = left.filter((p) => group.get(p.key) === group.get(cur.key))
    const inCountry = left.filter((p) => p.country === country)
    const pool = inGroup.length ? inGroup : inCountry.length ? inCountry : left
    const from = pool === left ? origin : cur
    const next = pool.reduce((a, b) => (km(from.at, b.at) < km(from.at, a.at) ? b : a))
    // A group can cross a border (Singapore and Bintan); the country only changes when a new one starts
    if (pool === left) country = next.country
    out.push(next)
    left.splice(left.indexOf(next), 1)
    cur = next
  }
  return out
}

/** City pins -> property pins where /api/map/points knows the property; the rest keep their city pin. */
async function refine(points: MapPoint[], token: string | undefined): Promise<MapPoint[]> {
  const ids = points.flatMap((p) => p.programs.map((x) => x.id))
  if (!token || !ids.length) return points
  const ctrl = new AbortController()
  const timer = window.setTimeout(() => ctrl.abort(), REFINE_TIMEOUT_MS)
  try {
    const r = await fetch("/api/map/points", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-map-token": token },
      body: JSON.stringify({ ids }),
      signal: ctrl.signal,
    })
    if (!r.ok) return points
    const { p } = (await r.json()) as { p: Record<string, [string, number, number]> }
    const out = new Map<string, MapPoint>()
    for (const pt of points) {
      for (const prog of pt.programs) {
        const hit = p[prog.id]
        const key = hit ? hit[0] : pt.key
        const prev = out.get(key)
        if (!prev) out.set(key, { ...pt, key, at: hit ? [hit[1], hit[2]] : pt.at, min: prog.minPrice, label: usd(prog.minPrice), programs: [prog] })
        else {
          prev.programs.push(prog)
          if (prog.minPrice < prev.min) Object.assign(prev, { min: prog.minPrice, label: usd(prog.minPrice) })
        }
      }
    }
    return [...out.values()]
  } catch {
    return points
  } finally {
    window.clearTimeout(timer)
  }
}

export default function CatalogMap({ points: initial, token }: { points: MapPoint[]; token?: string }) {
  const el = useRef<HTMLDivElement>(null)
  const [points, setPoints] = useState(initial)
  const [selected, setSelected] = useState<string | null>(null)
  // The place last picked by a pin (not the carousel): the carousel starts there. Bumping jump scrolls
  // the carousel back to it.
  const [origin, setOrigin] = useState<string | null>(null)
  const [jump, setJump] = useState(0)
  const selectRef = useRef<(key: string | null, fromCarousel?: boolean) => void>(() => {})
  // All cards, place by place outward from the picked place (route), cheapest program first within a place
  const cards = useMemo(() => (origin ? route(points, origin) : points).flatMap((p) => [...p.programs].sort((a, b) => a.minPrice - b.minPrice).map((prog) => ({ ...prog, place: prog.place, key: p.key }))), [points, origin])

  useEffect(() => {
    let map: import("leaflet").Map | undefined
    let cancelled = false
    let ro: ResizeObserver | undefined
    Promise.all([import("leaflet"), refine(initial, token)]).then(([L, points]) => {
      if (cancelled || !el.current) return
      setPoints(points)
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
        if (!fromCarousel) {
          if (key) setOrigin(key)
          setJump((n) => n + 1)
        }
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
  }, [initial, token])

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
  // A place picked on the map heads a newly ordered carousel: go to it at once (a smooth scroll would
  // run past the reordered cards)
  useEffect(() => {
    const w = wrap.current
    if (!w) return
    const i = cards.findIndex((c) => c.key === selected)
    const card = w.children[i] as HTMLElement | undefined
    if (card) w.scrollTo({ left: card.offsetLeft - (w.clientWidth - card.offsetWidth) / 2, behavior: "auto" })
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
