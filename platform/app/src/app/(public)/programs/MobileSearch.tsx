"use client"
// Mobile search (Figma 110:5430): back, search pill, filters button, track chips; the filters open in the
// DS Bottom sheet (Figma 231:6999) with Goal (two rows scrolling together), Price range, Duration and
// Country, and a live "Show N programs".
import { startNavigation } from "@/lib/nav-pending"
import Link from "@/lib/i18n-link"
import { useRouter } from "@/lib/i18n-nav"
import { useMemo, useState } from "react"
import { BottomSheet } from "../ds/overlay"
import PriceRange from "../ds/PriceRange"
import { Button, Chip, Icon, IconButton } from "../ds/ui"
import { useSafeBack } from "../ds/navHistory"
import { searchHref, type LiteProgram, type SearchState } from "./searchHref"
import { parseIntent } from "../ds/intent"
import CityInput from "../ds/CityInput"
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
  const go = (href: string, opts: { scroll: boolean }) => { startNavigation(href); router.replace(href, opts) }
  const back = useSafeBack("/")
  const [q, setQ] = useState(state.q ?? "")
  const [open, setOpen] = useState(false)
  const [goals, setGoals] = useState<string[]>(state.goal ? state.goal.split(",") : [])
  const [date, setDate] = useState(state.date ?? "")
  const [flex, setFlex] = useState(state.flex ?? "exact")
  const [from, setFrom] = useState(state.from ?? "")
  const [length, setLength] = useState(state.length)
  const [country, setCountry] = useState(state.country)
  const [price, setPrice] = useState<[number, number]>([state.pmin ?? bounds[0], state.pmax ?? bounds[1]])
  const active = !!(state.goal || state.length || state.country || state.pmin || state.pmax)

  const count = useMemo(() => {
    const len = LENGTHS.find((l) => l.key === length)
    return programs.filter((p) =>
      (trackCohort === undefined || p.cohort === trackCohort) &&
      (!goals.length || goals.some((g) => p.outcomes.includes(g))) &&
      (!len || (p.minDays >= len.min && p.minDays <= len.max)) &&
      (!country || p.country === country) &&
      p.minPrice >= price[0] && (price[1] >= bounds[1] || p.minPrice <= price[1]),
    ).length
  }, [programs, trackCohort, goals, length, country, price, bounds])

  const apply = () => {
    setOpen(false)
    go(searchHref({
      ...state, goal: goals.length ? goals.join(",") : undefined, length, country,
      date: date || undefined, flex: date && flex !== "exact" ? flex : undefined, from: from.trim() || undefined,
      pmin: price[0] > bounds[0] ? price[0] : undefined,
      pmax: price[1] < bounds[1] ? price[1] : undefined,
    }), { scroll: false })
  }
  const clear = () => { setGoals([]); setDate(""); setFlex("exact"); setFrom(""); setLength(undefined); setCountry(undefined); setPrice(bounds) }
  const half = Math.ceil(outcomes.length / 2)

  return (
    <>
      <div className={m.top} data-search-top>
      <div className={m.bar}>
        <IconButton icon="arrow_back" label="Back" className={m.round} onClick={back} />
        <form className={m.pill} role="search" onSubmit={(e) => {
          e.preventDefault()
          const it = q.trim() ? parseIntent(q, countries) : null
          go(searchHref({
            ...state,
            q: it?.recognized ? undefined : (q.trim() || undefined),
            track: it?.track ?? state.track,
            country: it?.country ?? state.country,
            length: it?.length ?? state.length,
            from: it?.from ?? state.from,
            when: it?.when ?? state.when,
          }), { scroll: false })
        }}>
          <Icon name="search" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="What do you want to improve?" aria-label="Find your programme" enterKeyHint="search" />
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
                  {row.map((o) => <Chip key={o.slug} size="s" icon={o.icon} selected={goals.includes(o.slug)} onClick={() => setGoals((g) => (g.includes(o.slug) ? g.filter((x) => x !== o.slug) : [...g, o.slug]))}>{o.label}</Chip>)}
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
          <section className={m.group}>
            <h3 className="ds-headline-s">Start date</h3>
            <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} suppressHydrationWarning
              style={{ display: "block", width: "100%", minWidth: 0, maxWidth: "100%", height: "3rem", padding: "0 0.875rem", borderRadius: "0.75rem", border: "1px solid var(--ds-outline-variant)", background: "var(--ds-surface)", color: "var(--ds-on-surface)" }} />
            {date && (
              <div className={m.wrap} style={{ marginTop: "0.75rem" }}>
                {[["exact", "Exact date"], ["3", "± 3 days"], ["month", "Anytime that month"]].map(([k, l]) => (
                  <Chip key={k} size="s" selected={flex === k} onClick={() => setFlex(k)}>{l}</Chip>
                ))}
              </div>
            )}
          </section>
          <section className={m.group}>
            <h3 className="ds-headline-s">Departing from</h3>
            <CityInput style={{ width: "100%", height: "3rem", padding: "0 0.875rem", borderRadius: "0.75rem", border: "1px solid var(--ds-outline-variant)", background: "var(--ds-surface)", color: "var(--ds-on-surface)" }} value={from} onChange={setFrom} />
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
