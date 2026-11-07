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
import { getPending, getServerPending, subscribe } from "@/lib/nav-pending"
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import "leaflet/dist/leaflet.css"
import { Photo, SUPABASE_HOST } from "../ds/cards"
import { isSaved, toggleSaved, useSaved, type SavedItem } from "../ds/saved"
import { ButtonLink, Facts, Icon } from "../ds/ui"
import { MAP_DRAG, MAP_SELECT, MAP_SHEET, type MapSheetDetail } from "./ResultsSheet"
import m from "./catalogMap.module.css"
import Flag from "../ds/Flag"

export type MapProgram = { id: string; minPrice: number; name: string; href: string; image: string | null; flag: string | null; place: string[]; rating: number | null; price: string; duration: string | null }
export type MapPoint = { key: string; at: [number, number]; label: string; country: string; min: number; programs: MapProgram[] }

const usd = (n: number) => "$" + n.toLocaleString("en-US")
const DETAIL_ZOOM = 4.5 // below it, one pin per country (the Asia overview sits around 3.5)
const PLACE_ZOOM = 8 // a tapped pin zooms in at least this far
const REFINE_TIMEOUT_MS = 2500
// Two price pins closer than this on screen (px) would overlap, so they merge
const MERGE_X = 64
const MERGE_Y = 32
const APART_MAX = 16 // a picked place zooms in at most this far to stand apart from its neighbours
// A picked place clears its neighbours with its photo too: the pill (28px) and the 48px photo on it
const APART_X = 64
const APART_Y = 84
const GROUP_KM = 60 // places chained closer than this form one group (an island, a stretch of coast)

/** Pin thumbnail source: our photos go through the image optimiser at 256px (a 48px thumb at 3x is 144px; 256 is the next size the optimiser makes). */
function thumbSrc(src: string) {
  try {
    if (new URL(src).hostname === SUPABASE_HOST) return `/_next/image?url=${encodeURIComponent(src)}&w=256&q=75`
  } catch {}
  return src
}

/** Photos over a pin: one per property (its cheapest programme with a photo), cheapest first, at most
 *  three. One property shows one photo; several fan out. */
function pinPhotos(programs: MapProgram[]): string[] {
  const byPlace = new Map<string, string>()
  for (const p of [...programs].sort((a, b) => a.minPrice - b.minPrice)) {
    const place = p.place[0] ?? p.id
    if (p.image && !byPlace.has(place)) byPlace.set(place, p.image)
  }
  return [...byPlace.values()].slice(0, 3)
}

const attr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")

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
  const next = useSyncExternalStore(subscribe, getPending, getServerPending)
  const leaving = !!next && next.kind !== "results"
  const selectRef = useRef<(key: string | null, fromCarousel?: boolean) => void>(() => {})
  // All cards, place by place outward from the picked place (route), cheapest program first within a place
  const cards = useMemo(() => (origin ? route(points, origin) : points).flatMap((p) => [...p.programs].sort((a, b) => a.minPrice - b.minPrice).map((prog) => ({ ...prog, place: prog.place, key: p.key }))), [points, origin])

  useEffect(() => {
    let map: import("leaflet").Map | undefined
    let cancelled = false
    let ro: ResizeObserver | undefined
    let onSheet: ((e: Event) => void) | undefined
    Promise.all([import("leaflet"), refine(initial, token)]).then(([L, points]) => {
      if (cancelled || !el.current) return
      setPoints(points)
      map = L.map(el.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false, zoomSnap: 0.25 })
      map.attributionControl.setPrefix(false)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap" }).addTo(map)
      // A pin is two markers on the same point: the price chip, and the property photos standing on it
      // (one, or a fan of up to three). The photos live in their own pane under the chips, so no photo,
      // not even a neighbour's, ever covers a price.
      const photoPane = map.createPane("pinPhotos")
      photoPane.style.zIndex = "590" // markers are 600
      const pin = (label: string) => L.divIcon({ className: m.pinWrap, html: `<span class="${m.marker}"><span class="${m.pin}">${label}</span></span>`, iconSize: undefined })
      const photoIcon = (photos: string[]) => {
        const imgs = photos.map((src, i) => `<img class="${m.thumb}" style="--i:${i}" src="${attr(thumbSrc(src))}" alt="" loading="lazy" decoding="async" draggable="false">`).join("")
        return L.divIcon({ className: m.pinWrap, html: `<span class="${m.photoAt}"><span class="${m.thumbs}" data-n="${photos.length}">${imgs}</span></span>`, iconSize: undefined })
      }
      type Mk = import("leaflet").Marker
      type Shown = { mk: Mk; ph?: Mk; min: number; key?: string }
      const markers = new Map<string, Shown>()
      let placeList: Shown[] = []
      const countryList: Shown[] = []
      let current: string | null = null
      // The selected pin is marked by a class, not a new icon, so its photos animate instead of reloading
      const mark = (key: string, on: boolean) => {
        const x = markers.get(key)
        for (const mk of [x?.mk, x?.ph]) {
          mk?.getElement()?.classList.toggle(m.on, on)
          mk?.setZIndexOffset(on ? 1000 : 0)
        }
      }
      // Photos only where they fit: a pin whose photos would cover another pin's price shows just its
      // price. The selected pin keeps its photos, then the cheapest pins go first.
      const declutter = () => {
        if (!map) return
        type Box = { l: number; r: number; t: number; b: number }
        const shown = (map.getZoom() >= DETAIL_ZOOM ? placeList : countryList).flatMap((x) => {
          const el = x.mk.getElement()
          const chip = el?.querySelector(`.${m.pin}`)?.getBoundingClientRect()
          const ph = x.ph?.getElement()
          return el && chip ? [{ ...x, el: ph, chip: { l: chip.left, r: chip.right, t: chip.top, b: chip.bottom }, thumbs: ph?.querySelector<HTMLElement>(`.${m.thumbs}`) }] : []
        })
        const taken: Box[] = shown.map((x) => x.chip)
        const hits = (a: Box, own: Box) => taken.some((t) => t !== own && a.l < t.r && a.r > t.l && a.t < t.b && a.b > t.t)
        const order = [...shown].sort((a, b) => Number(b.key === current) - Number(a.key === current) || a.min - b.min)
        for (const x of order) {
          if (!x.thumbs || !x.el) continue
          // Where the photos stand: centred over the chip, wider for a fan. A fan with no room folds into
          // its front photo; with no room for that either, the photos hide.
          const n = Number(x.thumbs.dataset.n)
          const cx = (x.chip.l + x.chip.r) / 2
          const at = (half: number) => ({ l: cx - half, r: cx + half, t: x.chip.t - 42, b: x.chip.t + 6 })
          const fan = at(26 + (n === 3 ? 22 : n === 2 ? 11 : 0))
          const one = at(26)
          const keep = x.key === current
          const box = keep || !hits(fan, x.chip) ? fan : !hits(one, x.chip) ? one : null
          x.el.classList.toggle(m.folded, box === one && n > 1)
          x.el.classList.toggle(m.crowded, !box)
          if (box) taken.push(box)
        }
      }
      // The zoom (from z0 up) at which a place stands apart from the places it would cover at z0, up to
      // APART_MAX; places at the same spot never part and stay under it
      const apart = (p: MapPoint, z0: number) => {
        if (!map) return z0
        let need = z0
        for (const b of points) {
          if (b === p) continue
          const d = map.project(p.at, z0).subtract(map.project(b.at, z0))
          const ratio = Math.max(Math.abs(d.x) / APART_X, Math.abs(d.y) / APART_Y)
          if (ratio >= 1 || ratio === 0) continue
          const z = Math.ceil((z0 - Math.log2(ratio)) * 4 + 1) / 4
          if (z <= APART_MAX) need = Math.max(need, z)
        }
        return need
      }
      const select = (key: string | null, fromCarousel = false) => {
        if (key === current) return
        if (current) mark(current, false)
        current = key
        if (!map) return
        const p = key ? points.find((x) => x.key === key) : undefined
        // A pin tapped from far away zooms in to the place; the carousel keeps the zoom. Either way the
        // map comes closer if the place would cover its neighbours, so what the carousel shows next is
        // on the map too.
        const z = p ? apart(p, fromCarousel ? map.getZoom() : Math.max(map.getZoom(), PLACE_ZOOM)) : map.getZoom()
        // The selected place stands alone, so the merged pins around it are worked out again: now if
        // the zoom stays, else when the map gets there (zoomend)
        if (z === map.getZoom() && z >= DETAIL_ZOOM) recluster()
        declutter()
        if (p) {
          mark(p.key, true)
          // The pin stays in view above the cards. Near and at the same zoom the map just slides there;
          // flyTo would arc out and back in
          const target = map.unproject(map.project(p.at, z).add([0, Math.round(window.innerHeight * 0.18)]), z)
          if (z === map.getZoom() && map.getBounds().contains(target)) map.panTo(target, { animate: true, duration: 0.45 })
          else map.flyTo(target, z, { duration: z !== map.getZoom() ? 0.7 : 0.45 })
        }
        setSelected(key)
        if (!fromCarousel) {
          if (key) setOrigin(key)
          setJump((n) => n + 1)
        }
        window.dispatchEvent(new CustomEvent(MAP_SELECT, { detail: key }))
      }
      selectRef.current = select
      // The chip and, when there are photos, the photos; a tap on either picks the pin
      const pair = (at: [number, number], label: string, photos: string[], onTap: () => void, onAdd?: () => void) => {
        const tap = (e: import("leaflet").LeafletMouseEvent) => { L.DomEvent.stopPropagation(e); onTap() }
        const mk = L.marker(at, { icon: pin(label), keyboard: false }).on("click", tap)
        const ph = photos.length ? L.marker(at, { icon: photoIcon(photos), keyboard: false, pane: "pinPhotos" }).on("click", tap) : undefined
        // Leaflet rebuilds the elements whenever the layer comes back (zooming past DETAIL_ZOOM)
        if (onAdd) for (const x of [mk, ph]) x?.on("add", onAdd)
        return { mk, ph }
      }
      for (const p of points) {
        const { mk, ph } = pair(p.at, p.label, pinPhotos(p.programs), () => select(p.key), () => { if (current === p.key) mark(p.key, true) })
        markers.set(p.key, { mk, ph, min: p.min, key: p.key })
      }
      // Places whose prices would overlap at this zoom merge into one pin: the cheapest price, the
      // photos of all of them. The selected place goes first and keeps its own pin; the places it would
      // cover step under it (they are next in the carousel anyway). Worked out on every zoom and pick.
      // Only what changed comes off or onto the map: a pin that stays keeps its element, so its photos do
      // not pop in again. A merge of the same places is the same pin.
      const places = L.layerGroup()
      const merged = new Map<string, Shown>()
      let clusteredAt = NaN
      const recluster = () => {
        if (!map) return
        const z = map.getZoom()
        clusteredAt = z
        const groups: { pts: MapPoint[]; at: import("leaflet").Point }[] = []
        for (const p of [...points].sort((a, b) => Number(b.key === current) - Number(a.key === current) || a.min - b.min)) {
          const q = map.project(p.at, z)
          const g = groups.find((g) => Math.abs(g.at.x - q.x) < MERGE_X && Math.abs(g.at.y - q.y) < MERGE_Y)
          if (g) g.pts.push(p)
          else groups.push({ pts: [p], at: q })
        }
        const next = groups.map(({ pts }) => {
          const best = pts[0]
          if (pts.length === 1 || best.key === current) return markers.get(best.key)!
          const id = pts.map((p) => p.key).join("|")
          let x = merged.get(id)
          if (!x) {
            x = { ...pair(best.at, best.label, pinPhotos(pts.flatMap((p) => p.programs)), () => openGroup(pts)), min: best.min }
            merged.set(id, x)
          }
          return x
        })
        const keep = new Set<import("leaflet").Layer>(next.flatMap((x) => (x.ph ? [x.mk, x.ph] : [x.mk])))
        for (const l of places.getLayers()) if (!keep.has(l)) places.removeLayer(l)
        for (const l of keep) if (!places.hasLayer(l)) places.addLayer(l)
        placeList = next
      }
      // A merged pin zooms in until its places part; places that never part (same spot) open the cheapest
      const openGroup = (pts: MapPoint[]) => {
        if (!map) return
        const MAX = 18
        let need = 0
        for (const a of pts) for (const b of pts) {
          if (a === b) continue
          const d = map.project(a.at, MAX).subtract(map.project(b.at, MAX))
          const ratio = Math.max(Math.abs(d.x) / MERGE_X, Math.abs(d.y) / MERGE_Y)
          if (ratio >= 1) need = Math.max(need, MAX - Math.log2(ratio) + 0.25)
        }
        if (!need) return select(pts[0].key)
        const z = Math.min(MAX, Math.max(need, map.getZoom() + 1))
        // Into the middle of the map that shows: between the search bar and the half-open results sheet
        // (the same room frame() leaves), not the middle of the screen under the sheet
        const h = window.innerHeight
        const shift = h / 2 - (118 + h * 0.46 - 16) / 2
        const target = map.project(L.latLngBounds(pts.map((p) => p.at)).getCenter(), z).add([0, Math.round(shift)])
        map.flyTo(map.unproject(target, z), z, { duration: 0.6 })
      }
      const byCountry = new Map<string, MapPoint[]>()
      for (const p of points) byCountry.set(p.country, [...(byCountry.get(p.country) ?? []), p])
      const countries = L.layerGroup([...byCountry.values()].flatMap((ps) => {
        const at: [number, number] = [ps.reduce((a, p) => a + p.at[0], 0) / ps.length, ps.reduce((a, p) => a + p.at[1], 0) / ps.length]
        // The country pin shows its cheapest place: tapping it zooms in and opens that place's card
        const best = ps.reduce((a, b) => (b.min < a.min ? b : a))
        const { mk, ph } = pair(at, usd(best.min), pinPhotos(ps.flatMap((p) => p.programs)), () => select(best.key))
        countryList.push({ mk, ph, min: best.min })
        return ph ? [ph, mk] : [mk]
      }))
      const sync = () => {
        if (!map) return
        if (map.getZoom() >= DETAIL_ZOOM) {
          countries.remove()
          // Leaflet ends every flyTo with zoomend, also at the same zoom
          if (map.getZoom() !== clusteredAt || !map.hasLayer(places)) recluster()
          places.addTo(map)
        }
        else { places.remove(); countries.addTo(map); if (current) select(null) }
        declutter()
      }
      map.on("zoomend", sync)
      // fitBounds without a zoom change (resize) moves the pins too
      map.on("moveend", declutter)
      map.on("click", () => { if (current) select(null) })
      // Moving the map by hand lowers the results sheet
      map.on("dragstart", () => window.dispatchEvent(new Event(MAP_DRAG)))
      // The top of the results sheet when it last rested over the map (half or collapsed): the map shows
      // above it. When the user lowers or raises the sheet, the map slides by half the step, so what was
      // in the middle of the part that shows stays in the middle (the zoom stays). Not when the sheet
      // drops because the map is being dragged, and not while a place card is open.
      let sheetTop = Math.round(window.innerHeight * 0.46)
      onSheet = (e: Event) => {
        const { top, byUser } = (e as CustomEvent<MapSheetDetail>).detail
        if (top === null || top === sheetTop) return
        if (byUser && map && !current) map.panBy([0, -(top - sheetTop) / 2], { duration: 0.35 })
        sheetTop = top
      }
      window.addEventListener(MAP_SHEET, onSheet)
      const frame = () => {
        if (!map || current) return
        map.invalidateSize()
        if (points.length === 1) map.setView(points[0].at, 9)
        else if (points.length) map.fitBounds(L.latLngBounds(points.map((p) => p.at)), { paddingTopLeft: [16, 118], paddingBottomRight: [16, Math.max(16, window.innerHeight - sheetTop + 16)], maxZoom: 9 })
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
      if (onSheet) window.removeEventListener(MAP_SHEET, onSheet)
      map?.remove()
      setSelected(null)
      window.dispatchEvent(new CustomEvent(MAP_SELECT, { detail: null }))
    }
  }, [initial, token])

  return (
    <>
      <div ref={el} className={m.map} />
      {/* The carousel lives on <body>, over every page: it steps aside while another page loads, or it
          would sit on top of that page's loading screen */}
      {selected && !leaving && createPortal(<PlaceCards cards={cards} selected={selected} jump={jump} onPlace={(k) => selectRef.current(k, true)} onClose={() => selectRef.current(null)} />, document.body)}
    </>
  )
}

type Card = MapProgram & { key: string }

/** Card carousel (Figma 214:30519): centred 348px cards, neighbours peeking, snapped one by one. A place
 *  with several programmes shows them as one long card (the programmes side by side, a counter on each
 *  photo); swiping still stops on every programme. Opens at the selected place; settling on another
 *  place's card tells the map to switch the pin. */
function PlaceCards({ cards, selected, jump, onPlace, onClose }: { cards: Card[]; selected: string; jump: number; onPlace: (key: string) => void; onClose: () => void }) {
  const wrap = useRef<HTMLDivElement>(null)
  // Programmes of one place in a row (cards come place by place)
  const groups = useMemo(() => cards.reduce<Card[][]>((gs, c) => {
    const last = gs[gs.length - 1]
    if (last && last[0].key === c.key) last.push(c)
    else gs.push([c])
    return gs
  }, []), [cards])
  // Every programme card in carousel order, with its centre in scroll coordinates
  const centres = (w: HTMLElement) => {
    const left = w.getBoundingClientRect().left - w.scrollLeft
    return Array.from(w.querySelectorAll<HTMLElement>(`.${m.card}`)).map((e) => {
      const r = e.getBoundingClientRect()
      return r.left - left + r.width / 2
    })
  }
  // A place picked on the map heads a newly ordered carousel: go to it at once (a smooth scroll would
  // run past the reordered cards)
  useEffect(() => {
    const w = wrap.current
    if (!w) return
    const at = centres(w)[cards.findIndex((c) => c.key === selected)]
    if (at !== undefined) w.scrollTo({ left: at - w.clientWidth / 2, behavior: "auto" })
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
        centres(w).forEach((c, i) => { const d = Math.abs(c - mid); if (d < dist) { dist = d; best = i } })
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
      {groups.map((g) => (
        <div key={g[0].key} className={m.group}>
        {g.map((p, i) => (
        <article key={p.id} className={m.card} data-card data-preview-title={p.name} data-preview-place={p.place.join(", ")} data-preview-price={p.price}>
          <Photo src={p.image} alt={p.name} className={m.photo} sizes="100vw">
            <div className={m.grab} data-card-skip onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
              <span className={m.handle} aria-hidden />
            </div>
            {g.length > 1 ? <span className={m.count}>{i + 1} of {g.length}</span> : null}
            <div className={m.actions}>
              <MiniSave item={{ kind: "program", id: p.id, title: p.name, href: p.href, image: p.image, meta: [p.flag, p.place[0]].filter(Boolean).join(" "), price: p.price }} />
              <button type="button" className={m.mini} aria-label="Close" onClick={onClose}><Icon name="close" /></button>
            </div>
          </Photo>
          {/* The text opens the programme too; the button says so (Oleg 07.11.2026) */}
          <div className={m.body}>
            <Link href={p.href} className={m.text}>
              <span className={m.titleRow}>
                <span className={m.title}>{p.name}</span>
                {p.rating ? <span className={m.rating}><span className={m.star} aria-hidden>★</span>{p.rating.toFixed(1)}</span> : null}
              </span>
              <span className={m.line}>{p.flag ? <Flag of={p.flag} /> : null}<Facts items={p.place} /></span>
              <span className={m.line}>{p.price}{p.duration ? <><i className={m.dot} aria-hidden />{p.duration}</> : null}</span>
            </Link>
            <ButtonLink href={p.href} size="l" className={m.open} tabIndex={-1}>Open</ButtonLink>
          </div>
        </article>
        ))}
        </div>
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
