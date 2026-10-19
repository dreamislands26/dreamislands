"use client"
// Mobile search (Figma 110:5430): back, search pill, filters button, track chips; the filters open in the
// DS Bottom sheet (Figma 231:6999) with Goal (two rows scrolling together), Price range, Duration and
// Country, and a live "Show N programs".
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { BottomSheet } from "../ds/overlay"
import PriceRange from "../ds/PriceRange"
import { Button, Chip, Icon, IconButton } from "../ds/ui"
import { useSafeBack } from "../ds/navHistory"
import { searchHref, type LiteProgram, type SearchState } from "./searchHref"
import m from "./mobileSearch.module.css"
import Flag from "../ds/Flag"

type Length = { key: string; label: string; min: number; max: number }

const LENGTHS: Length[] = [
  { key: "short", label: "Up to 5 days", min: 0, max: 5 },
  { key: "week", label: "6 to 9 days", min: 6, max: 9 },
  { key: "long", label: "10 days or more", min: 10, max: Infinity },
]

export default function MobileSearch({ programs, outcomes, countries, bounds, state, chips, trackCohort }: {
  programs: LiteProgram[]
  outcomes: { slug: string; label: string; icon: string }[]
  countries: string[]
  bounds: [number, number]
  state: SearchState
  chips: { key: string; label: string; href: string; selected: boolean; icon: string }[]
  trackCohort?: number
}) {
  const router = useRouter()
  const back = useSafeBack("/")
  const [q, setQ] = useState(state.q ?? "")
  const [open, setOpen] = useState(false)
  const [goal, setGoal] = useState(state.goal)
  const [length, setLength] = useState(state.length)
  const [country, setCountry] = useState(state.country)
  const [price, setPrice] = useState<[number, number]>([state.pmin ?? bounds[0], state.pmax ?? bounds[1]])
  const active = !!(state.goal || state.length || state.country || state.pmin || state.pmax)

  const count = useMemo(() => {
    const len = LENGTHS.find((l) => l.key === length)
    return programs.filter((p) =>
      (trackCohort === undefined || p.cohort === trackCohort) &&
      (!goal || p.outcomes.includes(goal)) &&
      (!len || (p.minDays >= len.min && p.minDays <= len.max)) &&
      (!country || p.country === country) &&
      p.minPrice >= price[0] && (price[1] >= bounds[1] || p.minPrice <= price[1]),
    ).length
  }, [programs, trackCohort, goal, length, country, price, bounds])

  const apply = () => {
    setOpen(false)
    router.replace(searchHref({
      ...state, goal, length, country,
      pmin: price[0] > bounds[0] ? price[0] : undefined,
      pmax: price[1] < bounds[1] ? price[1] : undefined,
    }), { scroll: false })
  }
  const clear = () => { setGoal(undefined); setLength(undefined); setCountry(undefined); setPrice(bounds) }
  const half = Math.ceil(outcomes.length / 2)

  return (
    <>
      <div className={m.top} data-search-top>
      <div className={m.bar}>
        <IconButton icon="arrow_back" label="Back" className={m.round} onClick={back} />
        <form className={m.pill} role="search" onSubmit={(e) => { e.preventDefault(); router.replace(searchHref({ ...state, q: q.trim() || undefined }), { scroll: false }) }}>
          <Icon name="search" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find your programme" aria-label="Find your programme" enterKeyHint="search" />
        </form>
        <span className={m.tuneWrap}>
          <IconButton icon="tune" label="Filters" className={m.round} onClick={() => setOpen(true)} />
          {active && <span className={m.tuneDot} aria-hidden />}
        </span>
      </div>
      <div className={m.chips}>
        {chips.map((c) => <Chip key={c.key} icon={c.icon || undefined} selected={c.selected} href={c.href} replace>{c.label}</Chip>)}
      </div>
      </div>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Filters"
        footer={
          <>
            <Button variant="text" size="l" onClick={clear}>Clear All</Button>
            <Button variant="filled" size="l" className={m.show} onClick={apply}>Show {count} {count === 1 ? "programme" : "programmes"}</Button>
          </>
        }
      >
        <div className={m.groups}>
          <section className={m.group}>
            <h3 className="ds-headline-s">Goal</h3>
            <div className={m.twoRows}>
              {[outcomes.slice(0, half), outcomes.slice(half)].map((row, r) => (
                <div key={r} className={m.row}>
                  {row.map((o) => <Chip key={o.slug} size="s" icon={o.icon} selected={goal === o.slug} onClick={() => setGoal(goal === o.slug ? undefined : o.slug)}>{o.label}</Chip>)}
                </div>
              ))}
            </div>
          </section>
          <section className={m.group}>
            <h3 className="ds-headline-s">Price</h3>
            <PriceRange prices={programs.map((p) => p.minPrice)} min={bounds[0]} max={bounds[1]} value={price} onChange={setPrice} />
          </section>
          <section className={m.group}>
            <h3 className="ds-headline-s">Duration</h3>
            <div className={m.wrap}>
              {LENGTHS.map((l) => <Chip key={l.key} size="s" selected={length === l.key} onClick={() => setLength(length === l.key ? undefined : l.key)}>{l.label}</Chip>)}
            </div>
          </section>
          <section className={m.group}>
            <h3 className="ds-headline-s">Country</h3>
            <div className={`${m.wrap} ${m.wrapWide}`}>
              {countries.map((k) => <Chip key={k} size="s" selected={country === k} onClick={() => setCountry(country === k ? undefined : k)}><Flag of={k} /> {k}</Chip>)}
            </div>
          </section>
        </div>
      </BottomSheet>
    </>
  )
}

/** Count line of the results sheet: centred title and, when filtered, a reset link. */
export function ResultsHead({ count, q, clearHref }: { count: number; q?: string; clearHref?: string }) {
  return (
    <div className={m.resultsHead}>
      <h2 className="ds-headline-s">{count} {count === 1 ? "programme" : "programmes"}{q ? ` for “${q}”` : ""}</h2>
      {clearHref && <Link href={clearHref} replace scroll={false} className={m.clear}>Clear filters</Link>}
    </div>
  )
}
