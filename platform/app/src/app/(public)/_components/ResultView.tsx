"use client"
// Wellness Journey result (S3). Used at the end of /start and on /matched/[id].
import Link from "next/link"
import { useState } from "react"
import { useAccount } from "./account/AuthProvider"
import { COHORT_LABELS, type LandingProgram } from "../_lib/programMapping"
import { COUNTRY_FLAGS } from "../_lib/countries"
import { Button, ButtonLink, Icon, Notice, TextField } from "../ds/ui"
import { ProgramCard, ScoreCard, cardStyles as cs } from "../ds/cards"
import x from "../ds/sections.module.css"
import r from "./result.module.css"

export type MatchedProgram = {
  id: string
  name: string
  slug: string | null
  cohort: number
  tier: string | null
  duration_days: number
  price_usd: number
  outcomes: string[] | null
  is_composite: boolean
  hero_image_url: string | null
  summary: string | null
  program_properties: { role: string | null; properties: { name: string; island: string | null; country: string | null; contact_wa: string | null } }[]
  program_variants: Array<{ duration_days: number; duration_nights: number; price_basic_usd: number; active: boolean }>
}

export type SubScores = { body?: number; recovery?: number; metabolic?: number; mind?: number; risk?: number }

const WA = "https://wa.me/message/HOF2AFIBDYY5J1"

function toLanding(p: MatchedProgram): LandingProgram {
  const prop = p.program_properties?.[0]?.properties
  const variants = (p.program_variants ?? []).filter((v) => v.active)
  const prices = variants.map((v) => Number(v.price_basic_usd)).filter((n) => n > 0)
  const days = variants.map((v) => v.duration_days).filter((n) => n > 0)
  const min = prices.length ? Math.min(...prices) : Number(p.price_usd)
  const cohort = COHORT_LABELS[p.cohort]
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    blurb: p.summary ?? "",
    track: cohort?.name ?? "",
    trackFull: cohort?.fullName ?? "",
    cohort: p.cohort,
    trackColor: "",
    performanceSubtype: null,
    tier: p.tier,
    type: p.is_composite ? "Composite" : "Rebuild",
    duration: `${days.length ? Math.min(...days) : p.duration_days} days`,
    price: `from $${Math.round(min).toLocaleString("en-US")}`,
    tags: p.outcomes ?? [],
    location: [prop?.island, prop?.country].filter(Boolean).join(", "),
    place: prop?.name?.trim() ? [prop.name.trim()] : [],
    flag: prop?.country ? COUNTRY_FLAGS[prop.country] ?? "" : "",
    country: prop?.country ?? null,
    hero_image_url: p.hero_image_url,
    contact_wa: prop?.contact_wa ?? null,
  }
}

function band(score: number) {
  if (score >= 80) return "Strong base"
  if (score >= 65) return "Good base"
  if (score >= 45) return "Room to recover"
  return "Time to reset"
}

export default function ResultView({
  name,
  score,
  focus,
  sub,
  medical,
  programs,
  date,
  alreadySaved,
  email,
}: {
  name?: string | null
  score: number
  focus?: string | null
  sub: SubScores
  medical?: boolean
  programs: MatchedProgram[]
  date?: string | null
  alreadySaved?: boolean
  email?: string
}) {
  const { session, openAuth } = useAccount()
  const [saveEmail, setSaveEmail] = useState(email ?? "")
  const bars = [
    { name: "Sleep & Recovery", value: sub.recovery },
    { name: "Movement & Physical Load", value: sub.body },
    { name: "Metabolic health", value: sub.metabolic },
    { name: "Mind & Emotional", value: sub.mind },
    { name: "Lifestyle & Risk", value: typeof sub.risk === "number" ? Math.round(100 - sub.risk) : undefined },
  ].filter((b): b is { name: string; value: number } => typeof b.value === "number")
  const lowest = bars.length ? bars.reduce((a, b) => (b.value < a.value ? b : a)) : null
  const signedIn = !!session && session.signedIn
  const saved = alreadySaved || signedIn
  const cards = programs.map(toLanding)
  const when = date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null

  return (
    <div className="ds-container-narrow">
      <section className={r.top}>
        <div className={r.text}>
          <p className={x.overline} style={{ margin: 0 }}>{when ? `Your Wellness Journey · ${when}` : "Your Wellness Journey"}</p>
          <h1 className="ds-display-s" style={{ margin: 0 }}>{name ? `${name.split(" ")[0]}, your` : "Your"} Wellness Score is {score}</h1>
          <p className="ds-body-l ds-muted" style={{ margin: 0 }}>
            {band(score)}.{lowest ? ` ${lowest.name} is the main thing to work on.` : ""}
            {focus ? ` Your focus: ${focus}.` : ""}
          </p>
          <p className="ds-body-s ds-muted" style={{ margin: 0 }}>This is not a medical diagnosis. It is a self-reported score used to match programmes.</p>
        </div>
        <ScoreCard score={score} title={band(score)} focus={lowest ? `Primary focus: ${lowest.name}` : undefined} bars={bars} />
      </section>

      {medical && (
        <section className={x.section}>
          <Notice title="Some answers need a doctor first" icon="medical_information">
            We do not diagnose. We suggest the medical route before a wellness programme. <Link href="/medical/china" style={{ color: "inherit", fontWeight: 500 }}>Medical China</Link>
          </Notice>
        </section>
      )}

      {cards.length > 0 && (
        <section className={x.sectionLoose}>
          <p className={x.overline}>Matched to your result</p>
          <h2 className="ds-headline-m" style={{ margin: "0 0 24px" }}>
            {cards.length === 1 ? "A programme" : `${cards.length === 3 ? "Three" : cards.length} programmes`} {lowest ? `for ${lowest.name.toLowerCase()}` : "for you"}
          </h2>
          <div className={cs.gridCards}>
            {cards.map((p) => <ProgramCard key={p.id} program={p} showTrack />)}
          </div>
        </section>
      )}

      <section className={`${x.sectionLoose} ${x.last}`}>
        <div className={r.duo}>
          <div className={x.block}>
            <Icon name="chat" size={28} />
            <h2 className="ds-title-l" style={{ margin: "12px 0 6px" }}>None of these feel right?</h2>
            <p className="ds-body-m ds-muted" style={{ margin: "0 0 16px" }}>A coordinator suggests other options on WhatsApp within minutes.</p>
            <div className={r.actions}>
              <ButtonLink href={WA} variant="tonal" target="_blank" rel="noreferrer">Message us on WhatsApp</ButtonLink>
              <ButtonLink href="/programs" variant="text">See all programmes</ButtonLink>
            </div>
          </div>
          <div className={x.block}>
            <Icon name="bookmark" size={28} />
            {saved ? (
              <>
                <h2 className="ds-title-l" style={{ margin: "12px 0 6px" }}>Saved to your profile</h2>
                <p className="ds-body-m ds-muted" style={{ margin: "0 0 16px" }}>This is the first point of your Wellness Score trend. Take the Wellness Journey again after the trip to see what changed.</p>
                <ButtonLink href="/profile" variant="tonal">Open My Wellness Journey</ButtonLink>
              </>
            ) : (
              <>
                <h2 className="ds-title-l" style={{ margin: "12px 0 6px" }}>Save your result</h2>
                <p className="ds-body-m ds-muted" style={{ margin: "0 0 16px" }}>Your result opens by link without signing in. Save it to compare your Wellness Score after the trip.</p>
                <form
                  className={r.save}
                  onSubmit={(e) => {
                    e.preventDefault()
                    openAuth({ reason: "save", email: saveEmail.trim() || undefined })
                  }}
                >
                  <TextField label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={saveEmail} onChange={(e) => setSaveEmail(e.target.value)} />
                  <Button type="submit" variant="filled" size="l">Save</Button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
