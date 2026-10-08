"use client"
import Image from "next/image"
import { useEffect, useState } from "react"
import { track, getGaClientId, getSessionId, getAttribution } from "../_lib/track"

type ReserveProgram = {
  id: string
  name: string
  property_id?: string
  property_name?: string
  destination_country?: string
}
type Variant = {
  id: string
  label: string
  duration_days: number
  duration_nights: number
  price_basic_thb: number
  price_vip_thb: number | null
}

const DEPOSIT_PCT = 20

function formatTHB(n: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n))
}

export default function ReserveModal({
  programs,
  triggerLabel = "Reserve dates",
  triggerClassName = "btn btn-primary",
  triggerStyle,
}: {
  programs: ReserveProgram[]
  triggerLabel?: string
  triggerClassName?: string
  triggerStyle?: React.CSSProperties
}) {
  const [open, setOpen] = useState(false)
  const [programId, setProgramId] = useState(programs[0]?.id ?? "")
  const [variants, setVariants] = useState<Variant[]>([])
  const [variantId, setVariantId] = useState("")
  const [loadingVariants, setLoadingVariants] = useState(false)
  const [variantsLoaded, setVariantsLoaded] = useState(false)
  const [name, setName] = useState("")
  const [contact, setContact] = useState("")
  const [arrival, setArrival] = useState("")
  const [pax, setPax] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requestSubmitted, setRequestSubmitted] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (!open || !programId) return
    let cancelled = false
    setLoadingVariants(true)
    setVariantsLoaded(false)
    setVariantId("")
    setVariants([])
    fetch(`/api/programs/${programId}/pricing`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json.success && Array.isArray(json.variants)) {
          setVariants(json.variants)
          if (json.variants.length > 0) setVariantId(json.variants[0].id)
          if (json.variants.length === 0) {
            const meta = programs.find((p) => p.id === programId) ?? null
            track("pricing_request_opened", {
              program_id: programId,
              property_id: meta?.property_id,
              property_name: meta?.property_name,
              destination_country: meta?.destination_country,
            })
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setLoadingVariants(false)
          setVariantsLoaded(true)
        }
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, programId])

  const selectedVariant = variants.find((v) => v.id === variantId) ?? null
  const selectedProgramMeta = programs.find((p) => p.id === programId) ?? null
  const selectedProgramName = selectedProgramMeta?.name ?? null
  // Two explicit states, driven purely by whether the program has an active,
  // priced variant — never a manual toggle. Checkout activates automatically
  // the moment a variant gets a valid duration + price_basic_thb.
  const isPriced = variantsLoaded && variants.length > 0
  const isUnpriced = variantsLoaded && variants.length === 0
  const fullPrice = selectedVariant?.price_basic_thb ?? null
  const depositAmount = fullPrice != null ? Math.round(fullPrice * (DEPOSIT_PCT / 100)) : null
  const remainingBalance = fullPrice != null && depositAmount != null ? fullPrice - depositAmount : null
  const departure = arrival && selectedVariant
    ? (() => {
        const d = new Date(arrival + "T00:00:00Z")
        d.setUTCDate(d.getUTCDate() + selectedVariant.duration_nights)
        return d.toISOString().slice(0, 10)
      })()
    : null
  function formatDateLong(iso: string) {
    const d = new Date(iso + "T00:00:00Z")
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
  }

  function openModal() {
    setOpen(true)
    track("open_reserve_modal", {
      program_id: programId,
      property_id: selectedProgramMeta?.property_id,
      property_name: selectedProgramMeta?.property_name,
      destination_country: selectedProgramMeta?.destination_country,
    })
    setError(null)
  }
  function close() {
    setOpen(false)
    setError(null)
    setRequestSubmitted(false)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!programId) { setError("Pick a program"); return }
    if (isPriced && !variantId) { setError("Pick a program length"); return }
    if (!name.trim()) { setError("Enter your name"); return }
    if (!contact.trim()) { setError("Enter an email or WhatsApp number"); return }
    if (!arrival) { setError("Pick an arrival date"); return }
    setSubmitting(true)
    setError(null)
    try {
      const isEmail = contact.includes("@")
      const attribution = getAttribution()
      const sharedFields = {
        program_id: programId,
        arrival,
        pax,
        guest_name: name,
        guest_email: isEmail ? contact : undefined,
        guest_whatsapp: isEmail ? undefined : contact,
        ga_client_id: getGaClientId() ?? undefined,
        session_id: getSessionId() ?? undefined,
        property_id: selectedProgramMeta?.property_id,
        property_name: selectedProgramMeta?.property_name,
        destination_country: selectedProgramMeta?.destination_country,
        market_country: attribution?.market_country,
        traffic_channel: attribution?.traffic_channel,
        utm_source: attribution?.utm_source ?? undefined,
        utm_medium: attribution?.utm_medium ?? undefined,
        utm_campaign: attribution?.utm_campaign ?? undefined,
      }
      const payload = isPriced
        ? { ...sharedFields, variant_id: variantId }
        : {
            ...sharedFields,
            source_page: typeof window !== "undefined" ? window.location.pathname : undefined,
          }
      const res = await fetch("/api/bookings/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? (isPriced ? "Could not start reservation" : "Could not send your request"))
        return
      }
      const leadParams = {
        program_id: programId,
        program_name: selectedProgramName,
        variant_id: isPriced ? variantId : undefined,
        value: isPriced ? depositAmount : null,
        currency: "THB",
        property_id: selectedProgramMeta?.property_id,
        property_name: selectedProgramMeta?.property_name,
        destination_country: selectedProgramMeta?.destination_country,
        booking_id: json.booking?.id,
        market_country: attribution?.market_country,
      }
      track("generate_lead", leadParams)
      if (isPriced) {
        if (json.checkout_url) {
          track("begin_checkout", leadParams)
          window.location.href = json.checkout_url
          return
        }
        setError("Could not start checkout — please message us on WhatsApp instead.")
      } else {
        setRequestSubmitted(true)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button type="button" className={triggerClassName} style={triggerStyle} onClick={openModal}>
        {triggerLabel}
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={close}
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
              <div className="eyebrow">{isUnpriced ? "Request availability" : "Reserve dates"}</div>
              <button
                type="button"
                onClick={close}
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
                {"×"}
              </button>
            </div>

            {requestSubmitted ? (
              <div style={{ display: "grid", gap: 14 }}>
                <div
                  style={{
                    padding: "16px 16px",
                    borderRadius: 12,
                    background: "var(--surface-2)",
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  Thanks{name ? `, ${name}` : ""} — we've received your request for{" "}
                  <strong>{selectedProgramName}</strong>. We don't have live pricing for these dates yet;
                  our team will follow up by email or WhatsApp with availability and pricing shortly.
                </div>
                <button type="button" className="btn btn-primary btn-block" onClick={close}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
                {programs.length > 1 && (
                  <label>
                    <div className="eyebrow" style={{ marginBottom: 6 }}>Program</div>
                    <select
                      className="field"
                      value={programId}
                      onChange={(e) => setProgramId(e.target.value)}
                      required
                    >
                      {programs.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </label>
                )}
                {isUnpriced && (
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: "var(--surface-2)",
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    We don't have live pricing for this program yet. Tell us your dates and we'll get back
                    to you with availability and pricing — no payment needed now.
                  </div>
                )}
                {!isUnpriced && (
                  <label>
                    <div className="eyebrow" style={{ marginBottom: 6 }}>Length</div>
                    <select
                      className="field"
                      value={variantId}
                      onChange={(e) => {
                        const v = e.target.value
                        setVariantId(v)
                        const variant = variants.find((x) => x.id === v)
                        track("variant_selected", {
                          program_id: programId,
                          variant_id: v,
                          variant_label: variant?.label,
                          value: variant ? Math.round(variant.price_basic_thb * (DEPOSIT_PCT / 100)) : undefined,
                          currency: "THB",
                          property_id: selectedProgramMeta?.property_id,
                          property_name: selectedProgramMeta?.property_name,
                          destination_country: selectedProgramMeta?.destination_country,
                        })
                      }}
                      disabled={loadingVariants || variants.length === 0}
                      required
                    >
                      {loadingVariants && <option value="">Loading options…</option>}
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label} — THB {formatTHB(v.price_basic_thb)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>Your name</div>
                  <input className="field" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
                <label>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>Email or WhatsApp</div>
                  <input className="field" type="text" value={contact} onChange={(e) => setContact(e.target.value)} required />
                </label>
                <label>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>Arrival</div>
                  <input className="field" type="date" value={arrival} min={today} onChange={(e) => setArrival(e.target.value)} required />
                </label>
                <label>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>Guests</div>
                  <input
                    className="field"
                    type="number"
                    min={1}
                    max={20}
                    value={pax}
                    onChange={(e) => setPax(Math.max(1, parseInt(e.target.value || "1", 10)))}
                    required
                  />
                </label>
                {isPriced && selectedVariant && fullPrice != null && depositAmount != null && remainingBalance != null && (
                  <div
                    style={{
                      display: "grid",
                      gap: 6,
                      padding: "14px 16px",
                      borderRadius: 12,
                      background: "var(--surface-2)",
                      fontSize: 13,
                    }}
                  >
                    {arrival && departure && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span>Dates</span>
                        <strong>{formatDateLong(arrival)} → {formatDateLong(departure)}</strong>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Program total</span>
                      <strong>THB {formatTHB(fullPrice)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Reservation deposit ({DEPOSIT_PCT}%)</span>
                      <strong>THB {formatTHB(depositAmount)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--ink-3)" }}>
                      <span>Remaining balance</span>
                      <span>THB {formatTHB(remainingBalance)}</span>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "var(--ink-3)" }}>
                      Stripe will charge THB. Your bank may convert the amount to your card currency.
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "var(--ink-3)" }}>
                      Your reservation request is reviewed after the deposit is received. If availability cannot be confirmed, your deposit will be refunded in full.
                    </div>
                  </div>
                )}
                {error && (
                  <div
                    role="alert"
                    style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(168,54,43,.1)", color: "#a8362b", fontSize: 13 }}
                  >
                    {error}
                  </div>
                )}
                {isPriced ? (
                  <>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent-deep)", textAlign: "center", padding: "2px 4px 4px" }}>Your deposit secures these dates. If we cannot confirm availability, it is refunded in full.</div>
                    <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting || !selectedVariant}>
                      {submitting ? "Redirecting…" : "Continue to secure payment"}
                    </button>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: "var(--ink-3)" }}>
                      {DEPOSIT_PCT}% deposit, secured by
                      <Image src="/stripe-logo.png" alt="Stripe" width={53} height={14} style={{ height: 14, width: "auto" }} />
                    </div>
                  </>
                ) : (
                  <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting || loadingVariants}>
                    {submitting ? "Sending…" : "Request availability and pricing"}
                  </button>
                )}
                <button type="button" className="btn btn-ghost btn-block" onClick={close}>Cancel</button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
