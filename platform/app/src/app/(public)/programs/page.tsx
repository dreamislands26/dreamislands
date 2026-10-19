import Link from "next/link"
import type { Metadata } from "next"
import { COUNTRIES } from "../_lib/countries"
import { GOALS, loadOutcomes, loadPrograms, outcomeLabel } from "../_lib/catalog"
import { dataLayerScript } from "../_lib/track"
import { ButtonLink, Chip, Facts, Icon } from "../ds/ui"
import { JourneyPrompt, ProgramCard, cardStyles as cs } from "../ds/cards"
import SearchBar, { SearchBarMobile } from "../ds/SearchBar"
import FilterMenus, { type FilterMenu } from "./FilterMenus"
import MobileSearch, { ResultsHead } from "./MobileSearch"
import { searchHref } from "./searchHref"
import { TRACK_ICONS, goalIcon, homeRoutes, searchRoutes } from "../_lib/routes"
import CatalogMap, { type MapPoint } from "./CatalogMap"
import ResultsSheet from "./ResultsSheet"
import { coordsFor } from "../_lib/places"
import x from "../ds/sections.module.css"
import c from "./catalog.module.css"

export const metadata: Metadata = {
  title: "Wellness programmes in Asia",
  description: "Wellness programmes across Asia, matched to your goal: recovery, calm, performance, longer stays and active holidays. Planned with a real person.",
  alternates: { canonical: "/programs" },
}

export const dynamic = "force-dynamic"

const LENGTHS = [
  { key: "short", label: "Up to 5 days", test: (d: number) => d <= 5 },
  { key: "week", label: "6 to 9 days", test: (d: number) => d >= 6 && d <= 9 },
  { key: "long", label: "10 days or more", test: (d: number) => d >= 10 },
]
const PRICES = [
  { key: "under1000", label: "Under $1,000", test: (n: number) => n < 1000 },
  { key: "1000-2000", label: "$1,000 to $2,000", test: (n: number) => n >= 1000 && n <= 2000 },
  { key: "over2000", label: "Over $2,000", test: (n: number) => n > 2000 },
]
/** Track chip order per S5. */
const TRACK_ORDER = [1, 2, 3, 4, 7]
const isMedical = (slug: string | null, name: string) => /medical|surgery|outpatient|bm-package/i.test(slug ?? "") || /medical/i.test(name)

type SP = { track?: string; country?: string; length?: string; price?: string; goal?: string; q?: string; pmin?: string; pmax?: string }

function href(sp: SP, patch: Partial<SP>) {
  const next = { ...sp, ...patch }
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(next)) if (v && k !== "search") q.set(k, v)
  const s = q.toString()
  return `/programs${s ? `?${s}` : ""}`
}

export default async function ProgramsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const [all, outcomes] = await Promise.all([loadPrograms(), loadOutcomes()])
  const wellness = all.filter((p) => !isMedical(p.slug, p.name))
  const track = GOALS.find((g) => g.track === sp.track)
  const country = COUNTRIES.find((k) => k === sp.country)
  const length = LENGTHS.find((l) => l.key === sp.length)
  const price = PRICES.find((l) => l.key === sp.price)
  const goal = outcomes.find((o) => o.slug === sp.goal)
  const q = (sp.q ?? "").trim().toLowerCase()
  // Price range bounds for the mobile filters: cheapest program, and a cap that keeps the histogram readable
  const prices = all.filter((p) => !isMedical(p.slug, p.name) && p.minPrice > 0).map((p) => p.minPrice).sort((a, b) => a - b)
  const bounds: [number, number] = prices.length ? [Math.floor(prices[0] / 100) * 100, Math.ceil(prices[Math.floor(prices.length * 0.92)] / 500) * 500] : [0, 5000]
  const pmin = Number(sp.pmin) || undefined
  const pmax = Number(sp.pmax) || undefined

  const list = wellness.filter(
    (p) =>
      (!track || p.cohort === track.cohort) &&
      (!country || p.country === country) &&
      (!length || length.test(p.minDays)) &&
      (!price || price.test(p.minPrice)) &&
      (!pmin || p.minPrice >= pmin) &&
      (!pmax || p.minPrice <= pmax) &&
      (!goal || p.outcomes.includes(goal.slug)) &&
      (!q || `${p.name} ${p.location} ${p.trackFull} ${p.tags.join(" ")}`.toLowerCase().includes(q)),
  )
  const countries = new Set(wellness.map((p) => p.country).filter(Boolean)).size
  const filtered = !!(track || country || length || price || goal || q || pmin || pmax)
  const shown = COUNTRIES.filter((k) => wellness.some((p) => p.country === k))
  const menus: FilterMenu[] = [
    { key: "goal", label: "Goal", value: goal ? outcomeLabel(goal) : undefined, options: outcomes.filter((o) => wellness.some((p) => p.outcomes.includes(o.slug))).map((o) => ({ label: outcomeLabel(o), on: goal?.slug === o.slug, href: href(sp, { goal: goal?.slug === o.slug ? undefined : o.slug }) })) },
    { key: "length", label: "Duration", value: length?.label, options: LENGTHS.map((o) => ({ label: o.label, on: length?.key === o.key, href: href(sp, { length: length?.key === o.key ? undefined : o.key }) })) },
    { key: "price", label: "Price", value: price?.label, options: PRICES.map((o) => ({ label: o.label, on: price?.key === o.key, href: href(sp, { price: price?.key === o.key ? undefined : o.key }) })) },
    { key: "country", label: "Country", value: country, options: shown.map((k) => ({ label: k, on: country === k, href: href(sp, { country: country === k ? undefined : k }) })) },
  ]

  // One pin per place, labelled with its cheapest program
  const pins = new Map<string, MapPoint>()
  for (const p of list) {
    const c = coordsFor(p.location)
    if (!c || !(p.minPrice > 0)) continue
    const prev = pins.get(c.key)
    const card = { id: p.id, minPrice: p.minPrice, name: p.name, href: p.slug ? `/programs/${p.slug}` : "/programs", image: p.hero_image_url, flag: p.flag ?? null, place: p.place?.length ? p.place : p.country ? [p.country] : [], rating: p.rating ?? null, price: p.price, duration: p.duration ?? null }
    if (!prev) pins.set(c.key, { key: c.key, at: c.at, min: p.minPrice, country: p.country ?? "", label: "$" + p.minPrice.toLocaleString("en-US"), programs: [card] })
    else {
      prev.programs.push(card)
      if (p.minPrice < prev.min) Object.assign(prev, { min: p.minPrice, label: "$" + p.minPrice.toLocaleString("en-US") })
    }
  }
  const points: MapPoint[] = [...pins.values()]
  const mState = { q: sp.q, track: sp.track, goal: goal?.slug, length: length?.key, country, pmin, pmax }
  // Same categories as the home chips (shared routes), with the broader tracks mixed in mid-row
  const routes = searchRoutes(homeRoutes(outcomes, wellness), TRACK_ORDER.map((n) => GOALS.find((g) => g.cohort === n)!).map((g) => ({
    label: wellness.find((p) => p.cohort === g.cohort)?.trackFull ?? g.chip, track: g.track, cohort: g.cohort,
  })))
  const mChips = [
    { key: "all", label: "All", href: searchHref({ ...mState, track: undefined, goal: undefined }), selected: !track && !goal, icon: "" },
    ...routes.map((r) => {
      const on = r.goal ? goal?.slug === r.goal : track?.track === r.track
      return { key: r.key, label: r.label, selected: on, icon: r.icon, href: searchHref({ ...mState, goal: on ? undefined : r.goal, track: on ? undefined : r.track }) }
    }),
  ]

  return (
    <>
    {/* Mobile: search with map and a results sheet (Figma 110:5430) */}
    <div className={c.mobile}>
      <MobileSearch
        programs={wellness.map((p) => ({ cohort: p.cohort, country: p.country, minDays: p.minDays, minPrice: p.minPrice, outcomes: p.outcomes }))}
        outcomes={outcomes.filter((o) => wellness.some((p) => p.outcomes.includes(o.slug))).map((o) => ({ slug: o.slug, label: o.name, icon: goalIcon(o.slug) }))}
        countries={shown}
        bounds={bounds}
        state={mState}
        chips={mChips}
        trackCohort={track?.cohort}
      />
      <div className={c.map}><CatalogMap points={points} /></div>
      <ResultsSheet head={<ResultsHead count={list.length} q={sp.q} clearHref={filtered ? "/programs" : undefined} />}>
        {list.length > 0 ? (
          <div className={c.list}>
            {list.map((p, i) => (
              <div key={p.id} data-loc={coordsFor(p.location)?.key}>
                <ProgramCard program={p} showTrack={false} priority={i < 2} wide />
              </div>
            ))}
          </div>
        ) : (
          <div className={x.empty}>
            <h2 className="ds-headline-m">Nothing matches these filters</h2>
            <p className="ds-body-m ds-muted">Try another length or country, or let the Wellness Journey pick for you.</p>
            <div className={x.emptyActions}>
              <ButtonLink href="/programs" variant="tonal" replace scroll={false}>Clear filters</ButtonLink>
              <ButtonLink href="/start" variant="filled">Start your Wellness Journey</ButtonLink>
            </div>
          </div>
        )}
        <div className={c.prompt}>
          <JourneyPrompt title="Not sure which one fits?" sub="Take your Wellness Journey and the list sorts itself by match." cta="Take the Wellness Journey" />
        </div>
      </ResultsSheet>
    </div>

    <div className={`ds-container ${c.desktop}`}>
      <script dangerouslySetInnerHTML={{ __html: dataLayerScript("view_programs", { track: sp.track ?? "all", country: sp.country ?? "all" }) }} />
      <header className={x.pageHead} style={{ maxWidth: "none" }}>
        <p className={`${x.overline} ${c.desktopOnly}`} style={{ margin: 0 }}><Facts items={[`${wellness.length} programmes`, `${countries} countries`]} /></p>
        <h1 className="ds-display-s">Find your programme</h1>
        <div className={c.searchDesktop}><SearchBar countries={COUNTRIES} /></div>
        <div className={c.searchMobile}>
          <SearchBarMobile countries={shown} track={sp.track} country={country} length={length?.key} q={sp.q} />
        </div>
      </header>

      <div className={c.filters}>
        <div className={c.row}>
          <Chip selected={!track} href={href(sp, { track: undefined })}>All tracks</Chip>
          {TRACK_ORDER.map((n) => GOALS.find((g) => g.cohort === n)!).map((g) => (
            <Chip key={g.key} icon={TRACK_ICONS[g.track] ?? true} selected={track?.key === g.key} href={href(sp, { track: track?.key === g.key ? undefined : g.track })}>
              {wellness.find((p) => p.cohort === g.cohort)?.trackFull ?? g.chip}
            </Chip>
          ))}
        </div>
        <FilterMenus menus={menus} />
      </div>

      <p className={`ds-body-m ds-muted ${c.count}`}>
        {list.length} {list.length === 1 ? "programme" : "programmes"}
        {q ? ` for “${sp.q}”` : ""}
        {filtered ? (
          <>
            {" "}
            <Link href="/programs" style={{ color: "var(--ds-primary)", fontWeight: 500 }}>Clear filters</Link>
          </>
        ) : (
          <span className={c.desktopOnly}>, sorted by match when you have a Wellness Score</span>
        )}
      </p>

      {list.length > 0 ? (
        <div className={cs.gridCards}>
          {list.map((p, i) => <ProgramCard key={p.id} program={p} showTrack={false} priority={i < 4} />)}
        </div>
      ) : (
        <div className={x.empty}>
          <h2 className="ds-headline-m">Nothing matches these filters</h2>
          <p className="ds-body-m ds-muted">Try another length or country, or let the Wellness Journey pick for you.</p>
          <div className={x.emptyActions}>
            <ButtonLink href="/programs" variant="tonal">Clear filters</ButtonLink>
            <ButtonLink href="/start" variant="filled">Start your Wellness Journey</ButtonLink>
          </div>
        </div>
      )}

      <section className={`${x.sectionLoose} ${c.desktopOnly}`}>
        <div className={x.block}>
          <div className={x.blockRow}>
            <Icon name="medical_services" />
            <div className={x.blockText}>
              <h2 className="ds-title-l">Medical programmes are kept apart</h2>
              <p className="ds-body-m ds-muted">Outpatient fast-track and surgery services live in Medical China, not in the wellness tracks.</p>
            </div>
            <ButtonLink href="/medical/china" variant="tonal" trailingIcon="arrow_forward">Medical China</ButtonLink>
          </div>
        </div>
      </section>

      <section className={`${x.section} ${x.last}`}>
        <JourneyPrompt title="Not sure which one fits?" sub="Take your Wellness Journey and the list sorts itself by match." cta="Take the Wellness Journey" />
      </section>
    </div>
    </>
  )
}
