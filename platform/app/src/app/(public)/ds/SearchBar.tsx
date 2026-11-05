"use client"
import { startNavigation } from "@/lib/nav-pending"
import { useRouter } from "@/lib/i18n-nav"
import { useState } from "react"
import { Icon, Skeleton } from "./ui"
import s from "./search.module.css"
import o from "./overlay.module.css"
import t from "./tripsearch.module.css"
import { parseIntent } from "./intent"
import CityInput from "./CityInput"

const GOALS = [
  { v: "", l: "Sleep, stress, energy…" },
  { v: "Reset", l: "Recover and reset" },
  { v: "Mind", l: "Calm my mind" },
  { v: "Performance", l: "Perform better" },
  { v: "Immersion", l: "Go deep" },
  { v: "SportChill", l: "Active holiday" },
]
const LENGTHS = [
  { v: "", l: "Any length" },
  { v: "short", l: "Up to 5 days" },
  { v: "week", l: "6 to 9 days" },
  { v: "long", l: "10 days or more" },
]
const FLEX = [
  { v: "exact", l: "Exact date" },
  { v: "3", l: "± 3 days" },
  { v: "month", l: "Anytime that month" },
]

export type OutcomeTag = { slug: string; label: string; icon?: string }
export type SearchInitial = { goals?: string[]; country?: string; length?: string; date?: string; flex?: string; from?: string }

/** Desktop search. With `outcomes` (the /programs page) it shows the multi-goal tag cloud plus start date and
 *  departure city; without them (home) it keeps the compact three-segment bar. */
/** `loading`: skeleton tags in place of the goals while the catalogue loads (ds/shells). */
export default function SearchBar({ countries, wide, outcomes, initial, loading }: { countries: string[]; wide?: boolean; outcomes?: OutcomeTag[]; initial?: SearchInitial; loading?: boolean }) {
  const router = useRouter()
  const go = (href: string) => { startNavigation(href); router.push(href) }
  const [goal, setGoal] = useState("")
  const [goals, setGoals] = useState<string[]>(initial?.goals ?? [])
  const [where, setWhere] = useState(initial?.country ?? "")
  const [length, setLength] = useState(initial?.length ?? "")
  const [date, setDate] = useState(initial?.date ?? "")
  const [flex, setFlex] = useState(initial?.flex ?? "exact")
  const [from, setFrom] = useState(initial?.from ?? "")
  const today = new Date().toISOString().slice(0, 10)
  const toggle = (slug: string) => setGoals((g) => (g.includes(slug) ? g.filter((x) => x !== slug) : [...g, slug]))
  function submit(e: React.FormEvent) {
    e.preventDefault()
    const q = new URLSearchParams()
    if (outcomes) {
      if (goals.length) q.set("goal", goals.join(","))
    } else if (goal) q.set("track", goal)
    if (where) q.set("country", where)
    if (length) q.set("length", length)
    if (outcomes) {
      if (date) {
        q.set("date", date)
        if (flex !== "exact") q.set("flex", flex)
      }
      if (from.trim()) q.set("from", from.trim())
    }
    go(`/programs${q.toString() ? `?${q}` : ""}`)
  }

  if (outcomes) {
    return (
      <form className={t.trip} onSubmit={submit} role="search">
        <div>
          <div className={t.cloudHead}>
            <h2 className={t.cloudTitle}>What do you want to improve?</h2>
            <span className={t.cloudHint}>Pick one or more. Programmes that cover more of your goals come first.</span>
          </div>
          <div className={t.cloud} style={{ marginTop: "0.75rem" }}>
            {loading && [7, 8, 6, 7.5, 11, 9, 6.5].map((w, i) => <Skeleton key={i} shape="block" className={t.tagSkeleton} style={{ width: `${w}rem` }} />)}
            {outcomes.map((g) => (
              <button key={g.slug} type="button" className={goals.includes(g.slug) ? `${t.tag} ${t.tagOn}` : t.tag} aria-pressed={goals.includes(g.slug)} onClick={() => toggle(g.slug)}>
                {g.icon && <Icon name={g.icon} size={18} />}{g.label}
              </button>
            ))}
          </div>
        </div>
        <div className={t.row}>
          <label className={t.field}>
            <span className={t.label}>Where</span>
            <select className={t.input} value={where} onChange={(e) => setWhere(e.target.value)}>
              <option value="">Any destination in Asia</option>
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className={t.field}>
            <span className={t.label}>How long</span>
            <select className={t.input} value={length} onChange={(e) => setLength(e.target.value)}>
              {LENGTHS.map((g) => <option key={g.v} value={g.v}>{g.l}</option>)}
            </select>
          </label>
          <label className={t.field}>
            <span className={t.label}>Start date</span>
            <input className={t.input} type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} suppressHydrationWarning />
          </label>
          <label className={t.field}>
            <span className={t.label}>Flexibility</span>
            <select className={t.input} value={flex} onChange={(e) => setFlex(e.target.value)} disabled={!date}>
              {FLEX.map((g) => <option key={g.v} value={g.v}>{g.l}</option>)}
            </select>
          </label>
          <label className={t.field}>
            <span className={t.label}>Departing from</span>
            <CityInput className={t.input} value={from} onChange={setFrom} />
          </label>
          <button type="submit" className={s.go} style={{ justifyContent: "center" }}>
            <Icon name="search" />
            Find my programme
          </button>
        </div>
        <p className={t.note}>Our team confirms availability and flights from your city once you pick a programme.</p>
      </form>
    )
  }

  return (
    <form className={wide ? `${s.bar} ${s.barWide}` : s.bar} onSubmit={submit} role="search">
      <label className={s.segment}>
        <span className={s.label}>Goal</span>
        <select className={s.select} value={goal} onChange={(e) => setGoal(e.target.value)}>
          {GOALS.map((g) => <option key={g.v} value={g.v}>{g.l}</option>)}
        </select>
      </label>
      <label className={s.segment}>
        <span className={s.label}>Where</span>
        <select className={s.select} value={where} onChange={(e) => setWhere(e.target.value)}>
          <option value="">Any destination in Asia</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className={s.segment}>
        <span className={s.label}>How long</span>
        <select className={s.select} value={length} onChange={(e) => setLength(e.target.value)}>
          {LENGTHS.map((g) => <option key={g.v} value={g.v}>{g.l}</option>)}
        </select>
      </label>
      <button type="submit" className={s.go}>
        <Icon name="search" />
        Find my programme
      </button>
    </form>
  )
}

/** Mobile search (DS "Search bar / Mobile"): a pill with the current filters. Tap opens a sheet with the same fields. */
export function SearchBarMobile({ countries, track, country, length, q: q0 }: { countries: string[]; track?: string; country?: string; length?: string; q?: string }) {
  const router = useRouter()
  const go = (href: string) => { startNavigation(href); router.push(href) }
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState(q0 ?? "")
  const [goal, setGoal] = useState(track ?? "")
  const [where, setWhere] = useState(country ?? "")
  const [len, setLen] = useState(length ?? "")
  const goalLabel = GOALS.find((g) => g.v === track && g.v)?.l ?? "Any goal"
  const lenLabel = LENGTHS.find((g) => g.v === length && g.v)?.l ?? "Any length"
  function submit(e: React.FormEvent) {
    e.preventDefault()
    const p = new URLSearchParams()
    const it = q.trim() ? parseIntent(q, countries) : null
    if (q.trim() && !it?.recognized) p.set("q", q.trim())
    const g = goal || it?.track || ""
    const w = where || it?.country || ""
    const l = len || it?.length || ""
    if (g) p.set("track", g)
    if (w) p.set("country", w)
    if (l) p.set("length", l)
    if (it?.from) p.set("from", it.from)
    if (it?.when) p.set("when", it.when)
    setOpen(false)
    go(`/programs${p.toString() ? `?${p}` : ""}`)
  }
  return (
    <>
      <button type="button" className={s.mBar} onClick={() => setOpen(true)} aria-label="Search programmes">
        <Icon name="search" />
        <span className={s.mText}>
          <span className={s.mTitle}>{q0 ? `“${q0}”` : "What do you want to change?"}</span>
          <span className={s.mSub}>{goalLabel}  ·  {country || "Asia"}  ·  {lenLabel}</span>
        </span>
        <span className={s.mTune} aria-hidden><Icon name="tune" /></span>
      </button>
      {open && (
        <div className={o.scrim} onClick={() => setOpen(false)}>
          <form className={o.dialog} onClick={(e) => e.stopPropagation()} onSubmit={submit} role="search">
            <span className={o.handle} aria-hidden />
            <h2 className="ds-headline-s" style={{ margin: 0 }}>Find your programme</h2>
            <label className={s.field}>
              <span className={s.label}>Search</span>
              <input className={s.input} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Programmes, places, goals" autoFocus />
            </label>
            <label className={s.field}>
              <span className={s.label}>Goal</span>
              <select className={s.select} value={goal} onChange={(e) => setGoal(e.target.value)}>
                {GOALS.map((g) => <option key={g.v} value={g.v}>{g.v ? g.l : "Any goal"}</option>)}
              </select>
            </label>
            <label className={s.field}>
              <span className={s.label}>Where</span>
              <select className={s.select} value={where} onChange={(e) => setWhere(e.target.value)}>
                <option value="">Any destination in Asia</option>
                {countries.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className={s.field}>
              <span className={s.label}>How long</span>
              <select className={s.select} value={len} onChange={(e) => setLen(e.target.value)}>
                {LENGTHS.map((g) => <option key={g.v} value={g.v}>{g.l}</option>)}
              </select>
            </label>
            <button type="submit" className={s.go} style={{ justifyContent: "center" }}>
              <Icon name="search" />
              Find my programme
            </button>
          </form>
        </div>
      )}
    </>
  )
}
