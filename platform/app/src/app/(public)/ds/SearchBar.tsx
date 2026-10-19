"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Icon } from "./ui"
import s from "./search.module.css"
import o from "./overlay.module.css"

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

/** Desktop search: three segments and one action. Segments are native selects for accessibility. */
export default function SearchBar({ countries, wide }: { countries: string[]; wide?: boolean }) {
  const router = useRouter()
  const [goal, setGoal] = useState("")
  const [where, setWhere] = useState("")
  const [length, setLength] = useState("")
  function submit(e: React.FormEvent) {
    e.preventDefault()
    const q = new URLSearchParams()
    if (goal) q.set("track", goal)
    if (where) q.set("country", where)
    if (length) q.set("length", length)
    router.push(`/programs${q.toString() ? `?${q}` : ""}`)
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
    if (q.trim()) p.set("q", q.trim())
    if (goal) p.set("track", goal)
    if (where) p.set("country", where)
    if (len) p.set("length", len)
    setOpen(false)
    router.push(`/programs${p.toString() ? `?${p}` : ""}`)
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
