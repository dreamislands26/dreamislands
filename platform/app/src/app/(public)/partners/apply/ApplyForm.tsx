"use client"

import { useState, type FormEvent } from "react"
import { Button, Chip, Icon, IconButton, ListItem, Tag, TextField } from "../../ds/ui"
import { COHORT_NAMES, OFFERINGS, PROPERTY_TYPES, SOURCES } from "@/lib/partner-application-options"
import s from "./apply.module.css"

type Program = { name: string; nights: string; priceFrom: string }
type Practitioner = { name: string; specialty: string }
type Result = { completeness: number; cohorts: number[]; checks: { key: string; label: string; status: string; note?: string }[] }

const STEPS = [
  { icon: "edit_note", title: "Apply", text: "Tell us about your property and what you offer" },
  { icon: "fact_check", title: "Qualify", text: "We check how it fits the Dream Islands tracks" },
  { icon: "view_agenda", title: "Structure", text: "Your programmes get the Dream Islands standard" },
  { icon: "verified", title: "Verify & contract", text: "Credentials, terms and the booking process" },
  { icon: "rocket_launch", title: "Live", text: "Guests can find and book you" },
]

const emptyProgram: Program = { name: "", nights: "", priceFrom: "" }
const emptyPractitioner: Practitioner = { name: "", specialty: "" }

export default function ApplyForm() {
  const [type, setType] = useState("")
  const [offerings, setOfferings] = useState<string[]>([])
  const [programs, setPrograms] = useState<Program[]>([{ ...emptyProgram }])
  const [practitioners, setPractitioners] = useState<Practitioner[]>([{ ...emptyPractitioner }])
  const [source, setSource] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<Result | null>(null)

  const toggle = (key: string) => setOfferings((o) => (o.includes(key) ? o.filter((k) => k !== key) : [...o, key]))
  const editProgram = (i: number, patch: Partial<Program>) => setPrograms((rows) => rows.map((r, k) => (k === i ? { ...r, ...patch } : r)))
  const editPractitioner = (i: number, patch: Partial<Practitioner>) => setPractitioners((rows) => rows.map((r, k) => (k === i ? { ...r, ...patch } : r)))

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const v = (k: string) => String(f.get(k) ?? "")
    setSending(true)
    setError("")
    try {
      const res = await fetch("/api/partner-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property: { name: v("name"), type, country: v("country"), city: v("city"), website: v("website") },
          offerings,
          programs,
          practitioners,
          contact: { name: v("contact_name"), role: v("contact_role"), email: v("contact_email"), phone: v("contact_phone") },
          source,
          consent: f.get("consent") === "on",
          company_confirm: v("company_confirm"),
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Something went wrong")
      setResult(json.profile)
      window.scrollTo({ top: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={`ds-container-narrow ${s.page}`}>
      <aside className={s.intro}>
        <h1 className={`ds-display-s ${s.title}`}>{result ? "Application received" : "Bring your property to Dream Islands"}</h1>
        <p className={`ds-body-l ds-muted ${s.lead}`}>
          {result
            ? "We have set up your partner profile. Next, our team checks the fit and comes back to you."
            : "Tell us about your property and the wellness you offer. It takes about five minutes, and you can add details later."}
        </p>
        <ol className={s.steps}>
          {STEPS.map((st, i) => (
            <li key={st.title} className={i === (result ? 1 : 0) ? s.stepNow : undefined}>
              <ListItem icon={st.icon} headline={st.title} supporting={st.text} />
            </li>
          ))}
        </ol>
      </aside>

      {result ? (
        <Summary result={result} />
      ) : (
        <form className={s.form} onSubmit={onSubmit}>
          <div className={s.honeypot} aria-hidden>
            <label>Company<input name="company_confirm" tabIndex={-1} autoComplete="off" /></label>
          </div>

          <section className={s.block}>
            <h2 className="ds-title-l">Your property</h2>
            <div className={s.grid}>
              <TextField label="Property name *" name="name" required placeholder="Lotus Bay Retreat" className={s.wide} />
              <TextField label="Country *" name="country" required autoComplete="country-name" placeholder="Thailand" />
              <TextField label="City or island" name="city" placeholder="Koh Samui" />
              <TextField label="Website" name="website" type="url" inputMode="url" placeholder="https://yourproperty.com" className={s.wide} />
            </div>
            <div className={s.group}>
              <p className="ds-label-l">Type</p>
              <div className={s.chips}>
                {PROPERTY_TYPES.map((t) => (
                  <Chip key={t} selected={type === t} onClick={() => setType(type === t ? "" : t)}>{t}</Chip>
                ))}
              </div>
            </div>
          </section>

          <section className={s.block}>
            <h2 className="ds-title-l">Wellness you offer</h2>
            <p className="ds-body-m ds-muted">Pick everything guests can do with you. We use it to match you to our tracks.</p>
            <div className={s.chips}>
              {OFFERINGS.map((o) => (
                <Chip key={o.key} icon={o.icon} selected={offerings.includes(o.key)} onClick={() => toggle(o.key)}>{o.label}</Chip>
              ))}
            </div>
          </section>

          <section className={s.block}>
            <h2 className="ds-title-l">Programmes you run today</h2>
            <p className="ds-body-m ds-muted">Name each one as you sell it now. We help you bring them to the Dream Islands standard later.</p>
            {programs.map((p, i) => (
              <div key={i} className={s.row}>
                <TextField label="Programme" value={p.name} onChange={(e) => editProgram(i, { name: e.target.value })} placeholder="7-day detox" className={s.rowMain} />
                <TextField label="Nights" value={p.nights} onChange={(e) => editProgram(i, { nights: e.target.value })} type="number" inputMode="numeric" min={1} placeholder="7" />
                <TextField label="From, USD" value={p.priceFrom} onChange={(e) => editProgram(i, { priceFrom: e.target.value })} type="number" inputMode="numeric" min={1} placeholder="2500" />
                {programs.length > 1 && <IconButton icon="close" label="Remove programme" className={s.remove} onClick={() => setPrograms((rows) => rows.filter((_, k) => k !== i))} />}
              </div>
            ))}
            <Button variant="text" icon="add" className={s.add} onClick={() => setPrograms((rows) => [...rows, { ...emptyProgram }])}>Add programme</Button>
          </section>

          <section className={s.block}>
            <h2 className="ds-title-l">Practitioners</h2>
            <p className="ds-body-m ds-muted">Therapists, doctors, coaches and teachers who lead your programmes.</p>
            {practitioners.map((p, i) => (
              <div key={i} className={`${s.row} ${s.rowTwo}`}>
                <TextField label="Name" value={p.name} onChange={(e) => editPractitioner(i, { name: e.target.value })} placeholder="Dr. Anan Suwan" className={s.rowMain} />
                <TextField label="Speciality" value={p.specialty} onChange={(e) => editPractitioner(i, { specialty: e.target.value })} placeholder="Ayurveda doctor" />
                {practitioners.length > 1 && <IconButton icon="close" label="Remove practitioner" className={s.remove} onClick={() => setPractitioners((rows) => rows.filter((_, k) => k !== i))} />}
              </div>
            ))}
            <Button variant="text" icon="add" className={s.add} onClick={() => setPractitioners((rows) => [...rows, { ...emptyPractitioner }])}>Add practitioner</Button>
          </section>

          <section className={s.block}>
            <h2 className="ds-title-l">Contact</h2>
            <div className={s.grid}>
              <TextField label="Your name *" name="contact_name" required autoComplete="name" placeholder="Alex Carter" />
              <TextField label="Role" name="contact_role" autoComplete="organization-title" placeholder="General manager" />
              <TextField label="Email *" name="contact_email" type="email" required autoComplete="email" placeholder="alex@yourproperty.com" />
              <TextField label="Phone or WhatsApp" name="contact_phone" type="tel" autoComplete="tel" placeholder="+66 81 234 5678" />
            </div>
            <div className={s.group}>
              <p className="ds-label-l">How did you find us?</p>
              <div className={s.chips}>
                {SOURCES.map((o) => (
                  <Chip key={o.key} selected={source === o.key} onClick={() => setSource(source === o.key ? "" : o.key)}>{o.label}</Chip>
                ))}
              </div>
            </div>
          </section>

          <label className={s.consent}>
            <input type="checkbox" name="consent" required />
            <span className="ds-body-m">I agree that Dream Islands may contact me about this application.</span>
          </label>
          {error && <p className={`ds-body-m ${s.error}`} role="alert">{error}</p>}
          <Button type="submit" size="l" disabled={sending} className={s.submit}>{sending ? "Sending…" : "Send application"}</Button>
        </form>
      )}
    </div>
  )
}

function Summary({ result }: { result: Result }) {
  const missing = result.checks.filter((c) => c.status === "missing")
  return (
    <div className={s.form}>
      <section className={s.block}>
        <div className={s.score}>
          <span className="ds-display-s">{result.completeness}%</span>
          <span className="ds-body-m ds-muted">of your profile is filled in</span>
        </div>
        <div className={s.meter} aria-hidden><span style={{ width: `${result.completeness}%` }} /></div>
        {result.cohorts.length > 0 && (
          <div className={s.group}>
            <p className="ds-label-l">Tracks you may fit</p>
            <div className={s.chips}>{result.cohorts.map((c) => <Tag key={c}>{COHORT_NAMES[c] ?? `Track ${c}`}</Tag>)}</div>
          </div>
        )}
      </section>
      {missing.length > 0 && (
        <section className={s.block}>
          <h2 className="ds-title-l">Still to add</h2>
          <p className="ds-body-m ds-muted">Your account manager will ask for these. Having them ready makes it faster.</p>
          <ul className={s.todo}>
            {missing.map((c) => (
              <li key={c.key}>
                <Icon name="radio_button_unchecked" />
                <span className="ds-body-l">{c.label}{c.note && <span className="ds-muted"> · {c.note}</span>}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
