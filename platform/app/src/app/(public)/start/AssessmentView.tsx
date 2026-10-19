"use client"
// Wellness Journey (S2): one question per screen, section check-ins,
// resume from where you left off. Scoring and the /api/intake payload are
// unchanged from production.
import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { WBS_QUESTIONS, WBS_SECTION_LABELS, computeWbs, type WbsAnswers, type WbsQuestion, type WbsResult, type WbsSection } from "@/lib/wbs"
import { track } from "../_lib/track"
import MatchedPrograms, { type MatchedProgram } from "../_components/MatchedPrograms"
import SaveResultBlock from "./SaveResultBlock"
import { NoCloseMatch, MedicalSupport, PreventiveLane, type MedicalItem, type LaneItem } from "../matched/[id]/MatchedView"
import { Logo } from "../ds/chrome"
import { Badge, Button, Facts, Icon, IconButton, TextField, cx } from "../ds/ui"
import s from "./journey.module.css"

const ALL_QUESTIONS = WBS_QUESTIONS.filter(
  (q): q is Extract<WbsQuestion, { type: "choice" }> | Extract<WbsQuestion, { type: "height_weight" }> => q.type === "choice" || q.type === "height_weight",
)
const SECTIONS = Array.from(new Set(ALL_QUESTIONS.map((q) => q.section))) as WbsSection[]
const STORE = "di_wj_progress_v1"

type Phase = "questions" | "section" | "contact" | "submitting" | "done"
type ContactForm = { name: string; whatsapp: string; email: string; country: string }
type Saved = { step: number; answers: Record<string, string | number | null>; at: string }

const OPTION_ICONS: Record<string, string> = { A: "battery_alert", B: "self_improvement", C: "monitor_weight", D: "face_retouching_natural", E: "biotech", F: "directions_run" }

const subscribeNoop = () => () => {}
function readStore(): string | null {
  try {
    return localStorage.getItem(STORE)
  } catch {
    return null
  }
}

function splitLabel(label: string) {
  const [title, ...rest] = label.split(" — ")
  return { title, sub: rest.join(" — ") || null }
}

export default function AssessmentView() {
  const router = useRouter()
  const total = ALL_QUESTIONS.length
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number | null>>({})
  const [phase, setPhase] = useState<Phase>("questions")
  const [choice, setChoice] = useState<{ step: number; value: string } | null>(null)
  const [resumeDecided, setResumeDecided] = useState(false)
  const rawSaved = useSyncExternalStore(subscribeNoop, readStore, () => null)
  const saved = useMemo<Saved | null>(() => {
    if (!rawSaved) return null
    try {
      const v = JSON.parse(rawSaved) as Saved
      return v && v.step > 0 && v.step < ALL_QUESTIONS.length ? v : null
    } catch {
      return null
    }
  }, [rawSaved])
  const [contact, setContact] = useState<ContactForm>({ name: "", whatsapp: "", email: "", country: "" })
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [score, setScore] = useState<WbsResult | null>(null)
  const [matchedId, setMatchedId] = useState<string | null>(null)
  const [matchedPrograms, setMatchedPrograms] = useState<MatchedProgram[]>([])
  const [savedToProfile, setSavedToProfile] = useState(false)
  // Ranking v1 extras from /api/intake: no close match, preventive lane, medical pathway
  const [noMatch, setNoMatch] = useState(false)
  const [medicalPathway, setMedicalPathway] = useState<MedicalItem[]>([])
  const [preventiveLane, setPreventiveLane] = useState<LaneItem[]>([])

  useEffect(() => {
    track("wbs_start")
  }, [])

  function persist(nextStep: number, nextAnswers: Record<string, string | number | null>) {
    try {
      localStorage.setItem(STORE, JSON.stringify({ step: nextStep, answers: nextAnswers, at: new Date().toISOString() }))
    } catch {
      // ignore
    }
  }
  function clearStore() {
    try {
      localStorage.removeItem(STORE)
    } catch {
      // ignore
    }
  }

  const current = ALL_QUESTIONS[step]
  const pending = choice && choice.step === step ? choice.value : current && current.type === "choice" ? ((answers[current.id] as string | undefined) ?? null) : null
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step, phase])
  const showResume = phase === "questions" && step === 0 && !resumeDecided && !!saved

  function advance(nextAnswers: Record<string, string | number | null>) {
    setResumeDecided(true)
    setAnswers(nextAnswers)
    const next = step + 1
    persist(next, nextAnswers)
    if (next >= total) {
      setStep(total)
      setPhase("contact")
      return
    }
    // Section check-in when the section changes (not after the goal question)
    if (ALL_QUESTIONS[next].section !== current.section && current.section !== "intent") {
      setStep(next)
      setPhase("section")
      return
    }
    setStep(next)
  }

  function back() {
    if (phase === "contact") {
      setStep(total - 1)
      setPhase("questions")
      return
    }
    if (phase === "section") {
      setStep(step - 1)
      setPhase("questions")
      return
    }
    if (step > 0) setStep(step - 1)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!contact.whatsapp.trim()) {
      setSubmitError("WhatsApp number is required so we can reach you.")
      return
    }
    setPhase("submitting")
    try {
      const wbsAnswers: WbsAnswers = {}
      for (const q of ALL_QUESTIONS) {
        if (q.type === "choice") wbsAnswers[q.id] = answers[q.id] ?? null
      }
      wbsAnswers.height_cm = typeof answers.height_cm === "number" ? answers.height_cm : null
      wbsAnswers.weight_kg = typeof answers.weight_kg === "number" ? answers.weight_kg : null
      const result = computeWbs(wbsAnswers)
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contact.name.trim() || null,
          whatsapp: contact.whatsapp.trim(),
          email: contact.email.trim() || null,
          country: contact.country.trim() || null,
          wbs_score: result.total,
          cohort: result.cohort,
          source: "wbs_form",
          intent: result.intent,
          focus: result.focus,
          program_code: result.program_code,
          recommended_duration: result.recommended_duration,
          confidence: result.confidence,
          sub_body: result.body,
          sub_recovery: result.recovery,
          sub_metabolic: result.metabolic,
          sub_mind: result.mind,
          sub_risk: result.risk,
          medical_review_required: result.medical_review_required,
          medical_flags: result.medical_flags,
          longstay_candidate: result.longstay_candidate,
          height_cm: wbsAnswers.height_cm,
          weight_kg: wbsAnswers.weight_kg,
          raw_answers: wbsAnswers,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setSubmitError(json.error ?? "Submission failed. Please try again.")
        setPhase("contact")
        return
      }
      clearStore()
      setScore(result)
      setMatchedId(json.user?.id ?? null)
      setMatchedPrograms((json.matched_programs ?? []) as MatchedProgram[])
      setSavedToProfile(!!json.saved_to_profile)
      setNoMatch(json.no_close_match === true)
      setMedicalPathway((json.medical_pathway ?? []) as MedicalItem[])
      setPreventiveLane((json.preventive_lane ?? []) as LaneItem[])
      setPhase("done")
      track("wbs_complete", { wbs_score: result.total, cohort: result.cohort })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Network error")
      setPhase("contact")
    }
  }

  const answered = Math.min(step, total)
  const progress = phase === "done" ? 1 : answered / total
  const sectionIndex = current ? SECTIONS.indexOf(current.section) : SECTIONS.length - 1
  const prevSection = step > 0 ? ALL_QUESTIONS[step - 1]?.section : null
  const left = total - answered

  const head = (
    <header className={s.head}>
      <Logo size="s" />
      {phase !== "done" && (
        <div className={s.progressWrap} aria-label={`Question ${Math.min(answered + 1, total)} of ${total}`}>
          <span className={s.progressLabel}><Facts items={["Wellness Journey", phase === "contact" || phase === "submitting" ? "Last step" : `${Math.min(answered + 1, total)} of ${total}`]} /></span>
          <span className={s.progress}><span style={{ width: `${progress * 100}%` }} /></span>
        </div>
      )}
      <IconButton icon="close" label="Leave the Wellness Journey" onClick={() => router.push("/")} />
    </header>
  )

  // Completion keeps the production mechanics: celebration + score, "sent" confirmation with the
  // save-to-profile push (inline sign-in opens the profile), then the matched programs with reserve.
  if (phase === "done" && score) {
    return (
      <div className={s.doneWrap} data-focus>
        {head}
        <main className={s.done}>
          <section className={s.doneCard}>
            <p className={s.doneKicker}>Baseline complete</p>
            <h1 className={s.doneTitle}>Beautiful.</h1>
            <p className="ds-body-l" style={{ margin: 0 }}>Here&apos;s your baseline — and the programmes built for it are just below.</p>
            <ScoreReveal score={score} />
          </section>

          <SaveResultBlock initialEmail={contact.email.trim() || undefined} alreadySaved={savedToProfile} />

          {matchedId && noMatch && <NoCloseMatch focus={score.focus} />}
          {matchedId && !noMatch && (
            <div className={s.doneMatched}>
              <MatchedPrograms
                userId={matchedId}
                name={contact.name.trim() || null}
                programs={matchedPrograms}
                heading={
                  <div style={{ marginBottom: "1.5rem" }}>
                    <p className={s.doneKicker} style={{ textAlign: "left" }}>Matched to your score · {score.focus}</p>
                    <h2 className="ds-display-s" style={{ margin: "0.5rem 0 0.75rem" }}>
                      Made for a baseline <span style={{ color: "var(--ds-primary)" }}>like yours</span>.
                    </h2>
                    <p className="ds-body-l ds-muted" style={{ margin: 0 }}>Reserve dates right here, or chat with us on WhatsApp — we&apos;ll tune the programme to you.</p>
                  </div>
                }
              />
            </div>
          )}
          {matchedId && preventiveLane.length > 0 && <PreventiveLane items={preventiveLane} />}
          {matchedId && medicalPathway.length > 0 && <MedicalSupport items={medicalPathway} />}
        </main>
      </div>
    )
  }

  return (
    <div className={s.wrap} data-focus>
      {head}
      <main className={s.main}>
        {showResume && saved && (
          <section className={s.center}>
            <Badge icon="spa" />
            <h1 className="ds-headline-l" style={{ margin: 0 }}>Continue your Wellness Journey</h1>
            <p className="ds-body-l ds-muted" style={{ margin: 0 }}>
              You answered {saved.step} of {total} questions{saved.at ? ` on ${new Date(saved.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}. Pick up where you left off, it takes about a minute.
            </p>
            <div className={s.actions}>
              <Button variant="filled" size="l" onClick={() => { setResumeDecided(true); setAnswers(saved.answers); setStep(saved.step) }}>Continue</Button>
              <Button variant="tonal" size="l" onClick={() => { clearStore(); setResumeDecided(true); setAnswers({}); setStep(0) }}>Start over</Button>
            </div>
          </section>
        )}

        {phase === "section" && prevSection && (
          <section className={s.card}>
            <p className={s.kicker}><Facts items={[`Section ${SECTIONS.indexOf(prevSection) + 1} of ${SECTIONS.length}`, "done"]} /></p>
            <h1 className="ds-headline-m" style={{ margin: 0 }}>{WBS_SECTION_LABELS[prevSection]}: done</h1>
            <p className="ds-body-l ds-muted" style={{ margin: 0 }}>
              Next: {WBS_SECTION_LABELS[current.section]}. Your answers so far are saved and will shape your matches.
            </p>
            <Button variant="filled" size="l" block onClick={() => setPhase("questions")}>
              Continue<span className="ds-sep" style={{ background: "currentColor", opacity: 0.4 }} />{left} questions left
            </Button>
          </section>
        )}

        {phase === "questions" && !showResume && current && (
          <section className={s.card}>
            <div className={s.topRow}>
              {step > 0 ? <IconButton icon="arrow_back" label="Previous question" onClick={back} /> : <span />}
              <p className={s.kicker}>{WBS_SECTION_LABELS[current.section]}{current.section !== "intent" ? ` · section ${sectionIndex + 1} of ${SECTIONS.length}` : ""}</p>
            </div>
            <h1 className="ds-headline-m" style={{ margin: 0 }}>{current.title}</h1>
            {current.hint && <p className="ds-body-m ds-muted" style={{ margin: 0 }}>{current.hint}</p>}

            {current.type === "choice" && (
              <>
                <div className={s.options} role="radiogroup" aria-label={current.title}>
                  {current.options.map((opt) => {
                    const { title, sub } = splitLabel(opt.label)
                    const on = pending === opt.value
                    const icon = current.id === "intent" ? OPTION_ICONS[opt.value] : null
                    return (
                      <button key={opt.value} type="button" role="radio" aria-checked={on} className={cx(s.option, on && s.optionOn, !sub && s.optionCompact)} onClick={() => setChoice({ step, value: opt.value })} onDoubleClick={() => advance({ ...answers, [current.id]: opt.value })}>
                        {icon && <span className={s.optionIcon}><Icon name={icon} /></span>}
                        <span className={s.optionText}>
                          <span className={s.optionTitle}>{title}</span>
                          {sub && <span className={s.optionSub}>{sub}</span>}
                        </span>
                        <span className={s.check}>{on ? <Icon name="check_circle" fill /> : null}</span>
                      </button>
                    )
                  })}
                </div>
                <Button variant="filled" size="l" block disabled={!pending} onClick={() => pending && advance({ ...answers, [current.id]: pending })}>Continue</Button>
              </>
            )}
            {current.type === "height_weight" && <HeightWeight onContinue={(h, w) => advance({ ...answers, height_cm: h, weight_kg: w })} />}
            <p className={s.savedNote}><Icon name="cloud_done" size={16} />Your answers are saved as you go</p>
          </section>
        )}

        {(phase === "contact" || phase === "submitting") && (
          <section className={s.card}>
            <div className={s.topRow}>
              <IconButton icon="arrow_back" label="Previous question" onClick={back} />
              <p className={s.kicker}>Last step</p>
            </div>
            <h1 className="ds-headline-m" style={{ margin: 0 }}>How do we reach you?</h1>
            <p className="ds-body-m ds-muted" style={{ margin: 0 }}>We send your Wellness Score and matched programmes to WhatsApp. A person replies, not a bot.</p>
            <form onSubmit={onSubmit} className={s.form}>
              <TextField label="Your name" autoComplete="name" placeholder="Alex Carter" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
              <TextField label="WhatsApp number *" type="tel" inputMode="tel" autoComplete="tel" placeholder="+65 9123 4567" required value={contact.whatsapp} onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })} error={!!submitError && !contact.whatsapp.trim()} />
              <TextField label="Email (optional), for your report" type="email" inputMode="email" autoComplete="email" placeholder="alex@example.com" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
              <TextField label="Country (optional)" autoComplete="country-name" placeholder="Singapore" value={contact.country} onChange={(e) => setContact({ ...contact, country: e.target.value })} />
              {submitError && <p className="ds-body-m" style={{ color: "var(--ds-error)", margin: 0 }} role="alert">{submitError}</p>}
              <Button type="submit" variant="filled" size="l" block disabled={phase === "submitting"} trailingIcon={phase === "submitting" ? undefined : "arrow_forward"}>
                {phase === "submitting" ? "Computing your score…" : "See my Wellness Score"}
              </Button>
              <p className="ds-body-s ds-muted" style={{ margin: 0, textAlign: "center" }}>
                By continuing you agree to be contacted about your result. <Link href="/how-wbs-works" style={{ color: "var(--ds-primary)" }}>How the score works</Link>
              </p>
            </form>
          </section>
        )}
      </main>
    </div>
  )
}

function HeightWeight({ onContinue }: { onContinue: (h: number | null, w: number | null) => void }) {
  const [h, setH] = useState("")
  const [w, setW] = useState("")
  const parsed = useMemo(() => {
    const hcm = h ? Math.round(parseFloat(h)) : null
    const wkg = w ? Math.round(parseFloat(w) * 10) / 10 : null
    return { hcm: hcm && hcm >= 100 && hcm <= 250 ? hcm : null, wkg: wkg && wkg >= 20 && wkg <= 350 ? wkg : null }
  }, [h, w])
  return (
    <div className={s.form}>
      <div className={s.pair}>
        <TextField label="Height, cm" type="number" placeholder="172" min={100} max={250} value={h} onChange={(e) => setH(e.target.value)} autoFocus />
        <TextField label="Weight, kg" type="number" placeholder="68" min={20} max={350} step={0.5} value={w} onChange={(e) => setW(e.target.value)} />
      </div>
      <Button variant="filled" size="l" block onClick={() => onContinue(parsed.hcm, parsed.wkg)}>Continue</Button>
      <Button variant="text" size="m" onClick={() => onContinue(null, null)}>Skip this question</Button>
    </div>
  )
}

/** Score and the five sub-scores, as on production (Safety = 100 - risk; amber under 50). */
function ScoreReveal({ score }: { score: WbsResult }) {
  const cats = [
    { label: "Body", val: score.body },
    { label: "Recovery", val: score.recovery },
    { label: "Metabolic", val: score.metabolic },
    { label: "Mind", val: score.mind },
    { label: "Safety", val: Math.round(100 - score.risk) },
  ]
  return (
    <div className={s.reveal}>
      <p className={s.revealScore}>
        {score.total}
        <span>/100</span>
      </p>
      <p className={s.revealFocus}>{score.focus}</p>
      <div className={s.bars}>
        {cats.map((c) => (
          <div key={c.label}>
            <div className={s.barHead}><span>{c.label}</span><span>{c.val}</span></div>
            <div className={s.barTrack}><div className={s.barFill} style={{ width: `${c.val}%`, background: c.val >= 50 ? "var(--ds-primary)" : "#d4882a" }} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}
