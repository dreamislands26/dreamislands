"use client"
import Image from "next/image"
import Link from "next/link"
import { useState, type ReactNode } from "react"
import { COHORT_LABELS } from "../_lib/programMapping"
import { Icon } from "./Icon"
import ProgramImage from "./ProgramImage"

export type MatchedProperty = {
  name: string
  island: string | null
  country: string | null
  contact_wa: string | null
}

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
  program_properties: { role: string | null; properties: MatchedProperty }[]
  program_variants: Array<{
    duration_days: number
    duration_nights: number
    price_basic_usd: number
    active: boolean
  }>
}

/** Program cards with inline "Reserve dates" — shared by /matched/[id] and the assessment result. */
export default function MatchedPrograms({
  userId,
  name,
  programs,
  heading,
}: {
  userId: string
  name: string | null
  programs: MatchedProgram[]
  heading: ReactNode
}) {
  const [reserveTarget, setReserveTarget] = useState<MatchedProgram | null>(null)
  const [reservedIds, setReservedIds] = useState<Set<string>>(new Set())
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitOk, setSubmitOk] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [arrival, setArrival] = useState("")
  const [departure, setDeparture] = useState("")
  const [pax, setPax] = useState(1)

  const today = new Date().toISOString().slice(0, 10)

  function openReserve(p: MatchedProgram) {
    setReserveTarget(p)
    setArrival("")
    setDeparture("")
    setPax(1)
    setSubmitError(null)
  }
  function closeReserve() {
    setReserveTarget(null)
    setSubmitError(null)
  }

  async function onReserveSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reserveTarget) return
    if (!arrival || !departure) { setSubmitError("Pick arrival and departure dates"); return }
    if (departure <= arrival) { setSubmitError("Departure must be after arrival"); return }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch("/api/bookings/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, program_id: reserveTarget.id, arrival, departure, pax }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) { setSubmitError(json.error ?? "Could not save inquiry"); return }
      if (json.checkout_url) {
        window.location.href = json.checkout_url
        return
      }
      setReservedIds((s) => new Set(s).add(reserveTarget.id))
      setSubmitOk(`Inquiry sent for ${reserveTarget.name}. We'll WhatsApp you within a few minutes.`)
      setReserveTarget(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
        <div>
          {heading}

          {submitOk && (
            <div
              className="card"
              style={{
                padding: 16,
                marginBottom: 20,
                background: "var(--accent-soft)",
                borderColor: "var(--accent-soft)",
                color: "var(--accent-deep)",
              }}
            >
              {submitOk}
            </div>
          )}

          <div className="matched-grid">
            {programs.map((p) => (
              <MatchedCard
                key={p.id}
                program={p}
                name={name}
                reserved={reservedIds.has(p.id)}
                onReserve={() => openReserve(p)}
              />
            ))}
            {programs.length === 0 && (
              <div className="card" style={{ padding: 24 }}>
                <div className="body">
                  No active programmes match your cohort right now. Our team will WhatsApp you with
                  the best alternative.
                </div>
              </div>
            )}
          </div>
        </div>

      {reserveTarget && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeReserve}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(20,32,27,.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 520,
              maxHeight: "92dvh",
              overflowY: "auto",
              background: "var(--bg)",
              borderTopLeftRadius: "var(--r-lg)",
              borderTopRightRadius: "var(--r-lg)",
              padding: "24px 22px 32px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div className="eyebrow">Reserve dates</div>
              <button
                type="button"
                onClick={closeReserve}
                aria-label="Close"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--surface-2)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--ink)",
                }}
              >
                <Icon.close width={16} height={16} />
              </button>
            </div>
            <h3 className="display" style={{ margin: "0 0 12px", fontSize: 26, color: "var(--ink)" }}>
              {reserveTarget.name}
            </h3>
            <p className="body-sm" style={{ marginBottom: 18 }}>
              Pick a start and end date. Our team confirms availability and final pricing on WhatsApp.
            </p>
            <form onSubmit={onReserveSubmit} style={{ display: "grid", gap: 12 }}>
              <label>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Arrival</div>
                <input className="field" type="date" value={arrival} min={today} onChange={(e) => setArrival(e.target.value)} required />
              </label>
              <label>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Departure</div>
                <input className="field" type="date" value={departure} min={arrival || today} onChange={(e) => setDeparture(e.target.value)} required />
              </label>
              <label>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Guests</div>
                <input className="field" type="number" min={1} max={20} value={pax} onChange={(e) => setPax(Math.max(1, parseInt(e.target.value || "1", 10)))} required />
              </label>
              {submitError && (
                <div role="alert" style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(168,54,43,.1)", color: "#a8362b", fontSize: 13 }}>
                  {submitError}
                </div>
              )}
              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
                {submitting ? "Redirecting…" : "Continue to secure payment"}
              </button>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: "var(--ink-3)" }}>
                20% deposit, secured by
                <Image src="/stripe-logo.png" alt="Stripe" width={53} height={14} style={{ height: 14, width: "auto" }} />
              </div>
              <button type="button" className="btn btn-ghost btn-block" onClick={closeReserve}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 700px) {
          .matched-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
        }
        .matched-grid { display: grid; gap: 16px; grid-template-columns: 1fr; }
      `}</style>
    </>
  )
}

function MatchedCard({
  program: p,
  name,
  reserved,
  onReserve,
}: {
  program: MatchedProgram
  name: string | null
  reserved: boolean
  onReserve: () => void
}) {
  const cohort = COHORT_LABELS[p.cohort]
  const properties = p.program_properties.map((pp) => pp.properties)
  const firstWa = properties.find((pr) => pr.contact_wa)?.contact_wa
  const greeting = name ? `Hi! I'm ${name}` : "Hi"
  const waHref = firstWa
    ? `https://wa.me/${firstWa.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
        `${greeting} — I just took the WS and "${p.name}" came up as a match. Can we lock in dates?`,
      )}`
    : null

  const activeVariants = p.program_variants?.filter((v) => v.active) ?? []
  const prices = activeVariants.map((v) => Number(v.price_basic_usd)).filter((x) => x > 0)
  const minPrice = prices.length ? Math.min(...prices) : Number(p.price_usd)

  return (
    <article className="card" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Link href={p.slug ? `/programs/${p.slug}` : "#"} style={{ display: "block", position: "relative" }}>
        <ProgramImage url={p.hero_image_url} cohort={p.cohort} alt={p.name} aspect="16 / 10" />
        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
          {cohort && (
            <span className="tag" style={{ background: "rgba(255,255,255,.92)", color: "var(--ink)" }}>
              {cohort.fullName}
            </span>
          )}
          {p.tier && (
            <span className="tag" style={{ background: "rgba(255,255,255,.92)", color: "var(--ink-2)" }}>
              {p.tier}
            </span>
          )}
        </div>
      </Link>
      <div style={{ padding: "18px 18px 20px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        <div>
          <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 600, color: "var(--ink)" }}>{p.name}</h3>
          {p.summary && <p className="body-sm" style={{ margin: 0, color: "var(--ink-2)" }}>{p.summary}</p>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="body-sm">{p.duration_days} days</span>
          <span style={{ fontWeight: 600, color: "var(--ink)" }}>from ${Number(minPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
        <div style={{ display: "grid", gap: 8, marginTop: "auto" }}>
          {reserved ? (
            <button type="button" className="btn" disabled style={{ background: "var(--accent-soft)", color: "var(--accent-deep)" }}>
              Inquiry sent
            </button>
          ) : (
            <button type="button" className="btn btn-primary btn-block" onClick={onReserve}>Reserve dates</button>
          )}
          {waHref && (
            <a className="btn btn-ghost btn-block" href={waHref} target="_blank" rel="noreferrer" style={{ fontSize: 14 }}>
              <Icon.wa width={16} height={16} /> Chat on WhatsApp
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

