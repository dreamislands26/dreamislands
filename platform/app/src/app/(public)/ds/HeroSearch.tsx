"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "@/lib/i18n-nav"
import { Icon } from "./ui"
import { useT } from "@/lib/i18n-client"
import s from "./search.module.css"
import t from "./tripsearch.module.css"
import CityInput from "./CityInput"
import type { OutcomeTag } from "./SearchBar"

const LENGTHS = [
  { v: "", l: "Any length" },
  { v: "short", l: "Up to 5 days" },
  { v: "week", l: "6 to 9 days" },
  { v: "long", l: "10 days or more" },
]

/** Home hero search: one row. Goals open a tag popover (multi-select), then where, start date, departure city, length. */
export default function HeroSearch({ countries, outcomes }: { countries: string[]; outcomes: OutcomeTag[] }) {
  const router = useRouter()
  const tr = useT()
  const [goals, setGoals] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [where, setWhere] = useState("")
  const [length, setLength] = useState("")
  const [date, setDate] = useState("")
  const [from, setFrom] = useState("")
  const wrap = useRef<HTMLDivElement>(null)
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey) }
  }, [open])

  const toggle = (slug: string) => setGoals((g) => (g.includes(slug) ? g.filter((x) => x !== slug) : [...g, slug]))
  const label = goals.length ? outcomes.filter((o) => goals.includes(o.slug)).map((o) => o.label).join(", ") : tr("Sleep, stress, energy…")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const q = new URLSearchParams()
    if (goals.length) q.set("goal", goals.join(","))
    if (where) q.set("country", where)
    if (length) q.set("length", length)
    if (date) q.set("date", date)
    if (from.trim()) q.set("from", from.trim())
    router.push(`/programs${q.toString() ? `?${q}` : ""}`)
  }

  return (
    <div className={t.heroWrap} ref={wrap}>
      {open && (
        <div className={t.pop} role="group" aria-label={tr("Choose one or more goals")}>
          {outcomes.map((g) => (
            <button key={g.slug} type="button" className={goals.includes(g.slug) ? `${t.tag} ${t.tagOn}` : t.tag} aria-pressed={goals.includes(g.slug)} onClick={() => toggle(g.slug)}>
              {g.icon && <Icon name={g.icon} size={18} />}{g.label}
            </button>
          ))}
        </div>
      )}
      <form className={`${s.bar} ${s.barWide}`} onSubmit={submit} role="search">
        <div className={s.segment}>
          <span className={s.label}>{tr("Goals")}</span>
          <button type="button" className={`${s.select} ${t.goalBtn}`} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((v) => !v)}>{label}</button>
        </div>
        <label className={s.segment}>
          <span className={s.label}>{tr("Where")}</span>
          <select className={s.select} value={where} onChange={(e) => setWhere(e.target.value)}>
            <option value="">{tr("Any destination")}</option>
            {countries.map((c) => <option key={c} value={c}>{tr(c)}</option>)}
          </select>
        </label>
        <label className={s.segment}>
          <span className={s.label}>{tr("Start date")}</span>
          <input className={s.select} type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} suppressHydrationWarning />
        </label>
        <label className={s.segment}>
          <span className={s.label}>{tr("Departing from")}</span>
          <CityInput className={s.select} value={from} onChange={setFrom} placeholder={tr("City")} />
        </label>
        <label className={s.segment}>
          <span className={s.label}>{tr("How long")}</span>
          <select className={s.select} value={length} onChange={(e) => setLength(e.target.value)}>
            {LENGTHS.map((g) => <option key={g.v} value={g.v}>{tr(g.l)}</option>)}
          </select>
        </label>
        <button type="submit" className={s.go}>
          <Icon name="search" />
          {tr("Find my programme")}
        </button>
      </form>
    </div>
  )
}
