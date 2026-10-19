"use client"
// Booking UI from the DS v2 layouts:
//  - CF3 desktop aside: "Reserve card · Departures" with a pill above it
//  - CF3 mobile: bottom action bar
//  - CF4: "Choose a departure" dialog (desktop) / sheet (mobile)
//  - CF5 analogue: "Your details" step, then Stripe Checkout (production flow)
//  - CF7: request sent; CF8: payment didn't go through (?booking=cancelled)
// Payloads to /api/bookings/public are unchanged from production.
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getAttribution, getGaClientId, getSessionId, track } from "../../_lib/track"
import { Badge, Button, Chip, Facts, Icon, IconButton, Radio, TextField, cx } from "../../ds/ui"
import { Dialog, overlayStyles as o } from "../../ds/overlay"
import { PaymentMarks } from "../../ds/payment"
import { monthLabel, slotsFor, type Slot } from "./departures"
import s from "./program.module.css"

export type PanelVariant = { id: string; label: string; duration_days: number; duration_nights: number; price_basic_usd: number; checkout: boolean }
type ThbVariant = { id: string; label: string; duration_days: number; duration_nights: number; price_basic_thb: number }

const DEPOSIT_PCT = 20
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`
const thb = (n: number) => `฿${Math.round(n).toLocaleString("en-US")}`

function useIsMobile() {
  const [m, setM] = useState(false)
  useEffect(() => {
    const q = window.matchMedia("(max-width: 767px)")
    const on = () => setM(q.matches)
    on()
    q.addEventListener("change", on)
    return () => q.removeEventListener("change", on)
  }, [])
  return m
}

export default function BookingPanel({
  programId,
  programName,
  propertyId,
  propertyName,
  country,
  variants,
  waHref,
  placeLine,
}: {
  programId: string
  programName: string
  propertyId?: string
  propertyName?: string
  country?: string
  variants: PanelVariant[]
  waHref: string
  placeLine?: string
}) {
  const router = useRouter()
  const params = useSearchParams()
  const mobile = useIsMobile()
  const priced = variants.some((v) => v.checkout)
  const hasUsd = variants.some((v) => v.price_basic_usd > 0)
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "")
  const v = variants.find((x) => x.id === variantId) ?? variants[0]
  const days = v?.duration_days ?? 1
  const slots = useMemo(() => slotsFor(days), [days])
  const [start, setStart] = useState<string>(slots[0]?.start ?? "")
  const slot = slots.find((x) => x.start === start) ?? slots[0]
  const [pax, setPax] = useState(1)
  const [open, setOpen] = useState(false)
  const [failed, setFailed] = useState(params.get("booking") === "cancelled")
  const price = v?.price_basic_usd ?? 0
  const deposit = Math.round(price * (DEPOSIT_PCT / 100))
  const meta = { program_id: programId, property_id: propertyId, property_name: propertyName, destination_country: country }

  const openDialog = useCallback(() => {
    setOpen(true)
    track("open_reserve_modal", meta)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId])

  const closeFailed = () => {
    setFailed(false)
    router.replace(window.location.pathname, { scroll: false })
  }

  const cta = (withDates: boolean) => (priced ? `Reserve${withDates && slot ? ` ${slot.title}` : ""}` : `Request${withDates && slot ? ` ${slot.title}` : " dates"}`)

  return (
    <>
      {/* CF3 desktop: pill + Reserve card · Departures */}
      <aside className={s.aside} id="reserve">
        <div className={s.pill}>
          <Icon name={priced ? "verified" : "chat"} />
          <span>{priced ? <Facts items={["Confirmed departure", "a deposit holds your place"]} /> : "A real person confirms your dates on WhatsApp"}</span>
        </div>
        <div className={s.card}>
          <div className={s.priceRow}>
            <span className="ds-headline-s">{hasUsd ? `From ${usd(Math.min(...variants.map((x) => x.price_basic_usd).filter((n) => n > 0)))}` : "Price on request"}</span>
            <span className="ds-body-m ds-muted"><Facts items={[hasUsd ? "per person" : null, `${days} days`]} /></span>
          </div>
          {variants.length > 1 && (
            <div className={s.lengths} role="radiogroup" aria-label="Programme length">
              {variants.map((x) => (
                <Chip key={x.id} selected={x.id === variantId} onClick={() => setVariantId(x.id)}>{x.duration_days} days</Chip>
              ))}
            </div>
          )}
          <div className={o.slots}>
            <span className="ds-label-m ds-muted">Upcoming departures</span>
            {slots.slice(0, 3).map((x) => (
              <SlotRow key={x.start} slot={x} on={x.start === slot?.start} onPick={() => setStart(x.start)} sub={<Facts items={[x.weekdays, `${days} days`]} />} />
            ))}
            <Button variant="text" className={s.showAll} onClick={openDialog}>Show all dates</Button>
          </div>
          <Button variant="filled" size="l" block onClick={openDialog}>{cta(true)}</Button>
          <p className={o.note}>
            {priced ? `Pay a ${usd(deposit)} deposit now. The rest is due after a person confirms your trip on WhatsApp.` : "No payment needed now. A person confirms availability and the final price on WhatsApp."}
          </p>
          {price > 0 && (
            <div className={o.summary}>
              <div className={o.sumRow}><span>Programme, {days} days</span><span>{usd(price)}</span></div>
              {priced && <div className={o.sumRow}><span>Deposit today</span><span>{usd(deposit)}</span></div>}
              <div className={o.sumRow}><span>Two Wellness Score check-ins</span><span>Included</span></div>
              <div className={cx(o.sumRow, o.sumTotal)}><span>Total, {pax} {pax === 1 ? "guest" : "guests"}</span><span>{usd(price * pax)}</span></div>
            </div>
          )}
        </div>
      </aside>

      {/* CF3 mobile: bottom action bar */}
      <div className={s.barSpacer} aria-hidden />
      <div className={s.bar}>
        <div className={s.barPrice}>
          <span className={s.barTop}>
            <strong>{price > 0 ? usd(price) : "On request"}</strong>
            <span className="ds-sep" />
            <span>{days} days</span>
          </span>
          <span className={s.barSub}><Facts items={[slot?.title, priced ? `${usd(deposit)} deposit` : "no payment now"]} /></span>
        </div>
        <Button variant="filled" size="l" onClick={openDialog}>{priced ? "Reserve" : "Request"}</Button>
      </div>

      <BookingDialog
        open={open}
        onClose={() => setOpen(false)}
        mobile={mobile}
        programId={programId}
        programName={programName}
        placeLine={placeLine}
        priced={priced}
        variants={variants}
        variantId={variantId}
        onVariant={setVariantId}
        slots={slots}
        slot={slot}
        onSlot={setStart}
        pax={pax}
        setPax={setPax}
        priceUsd={price}
        meta={meta}
        waHref={waHref}
      />

      {/* CF8: payment didn't go through */}
      <Dialog open={failed} onClose={closeFailed}>
        <div className={s.dialogHead}>
          <Badge icon="credit_card_off" tone="error" size="s" />
          <IconButton icon="close" label="Close" onClick={closeFailed} />
        </div>
        <h2 className="ds-headline-s">Payment didn&apos;t go through</h2>
        <p className="ds-body-m ds-muted" style={{ margin: 0 }}>Your card was not charged. Check the card details and try again, or message us on WhatsApp and we will help you finish the booking.</p>
        <div className={s.box}>
          <div className={o.sumRow}><span className="ds-ink">{programName}</span><span>{slot?.title}</span></div>
          {priced && <div className={o.sumRow}><span>Deposit</span><span>{usd(deposit)}</span></div>}
        </div>
        <div className={s.dialogActions}>
          <Button variant="filled" size="l" onClick={() => { closeFailed(); openDialog() }}>Try again</Button>
          <a href={waHref} target="_blank" rel="noreferrer" className={s.tonalLink}>Message us on WhatsApp</a>
        </div>
      </Dialog>
    </>
  )
}

function SlotRow({ slot, on, onPick, sub, tall }: { slot: Slot; on: boolean; onPick: () => void; sub: React.ReactNode; tall?: boolean }) {
  return (
    <button type="button" role="radio" aria-checked={on} className={cx(o.slot, on && o.slotOn, tall && s.slotTall)} onClick={onPick}>
      <Radio on={on} />
      <span className={o.slotText}>
        <span className={o.slotTitle}>{slot.title}</span>
        <span className={o.slotSub}>{sub}</span>
      </span>
    </button>
  )
}

function Stepper({ pax, setPax }: { pax: number; setPax: React.Dispatch<React.SetStateAction<number>> }) {
  return (
    <div className={o.stepper}>
      <IconButton icon="remove" label="Fewer guests" variant="tonal" onClick={() => setPax((n) => Math.max(1, n - 1))} disabled={pax <= 1} />
      <span className={o.stepperValue} aria-live="polite">{pax}</span>
      <IconButton icon="add" label="More guests" variant="tonal" onClick={() => setPax((n) => Math.min(20, n + 1))} />
    </div>
  )
}

function BookingDialog(props: {
  open: boolean
  onClose: () => void
  mobile: boolean
  programId: string
  programName: string
  placeLine?: string
  priced: boolean
  variants: PanelVariant[]
  variantId: string
  onVariant: (id: string) => void
  slots: Slot[]
  slot?: Slot
  onSlot: (start: string) => void
  pax: number
  setPax: React.Dispatch<React.SetStateAction<number>>
  priceUsd: number
  meta: Record<string, string | undefined>
  waHref: string
}) {
  const { open, onClose, mobile, programId, programName, placeLine, priced, variants, variantId, onVariant, slots, slot, onSlot, pax, setPax, priceUsd, meta, waHref } = props
  const [step, setStep] = useState<"choose" | "details" | "sent">("choose")
  const months = useMemo(() => Array.from(new Set(slots.map((x) => x.monthKey))).slice(0, 3), [slots])
  const [month, setMonth] = useState(months[0] ?? "")
  const shown = slots.filter((x) => x.monthKey === (months.includes(month) ? month : months[0]))
  const [thbVariants, setThbVariants] = useState<ThbVariant[]>([])
  const [name, setName] = useState("")
  const [contact, setContact] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const deposit = Math.round(priceUsd * (DEPOSIT_PCT / 100))
  const days = variants.find((x) => x.id === variantId)?.duration_days ?? variants[0]?.duration_days ?? 1

  useEffect(() => {
    if (!open || !priced) return
    let cancelled = false
    fetch(`/api/programs/${programId}/pricing`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json.success && Array.isArray(json.variants)) setThbVariants(json.variants)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [open, priced, programId])

  const tv = thbVariants.find((x) => x.id === variantId) ?? null
  const isPriced = priced && !!tv
  const thbDeposit = tv ? Math.round(tv.price_basic_thb * (DEPOSIT_PCT / 100)) : null

  const close = () => {
    onClose()
    setStep("choose")
    setError(null)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!slot) return setError("Pick a date")
    if (!name.trim()) return setError("Enter your name")
    if (!contact.trim()) return setError("Enter an email or WhatsApp number")
    setSubmitting(true)
    setError(null)
    try {
      const isEmail = contact.includes("@")
      const attribution = getAttribution()
      const shared = {
        program_id: programId,
        arrival: slot.start,
        pax,
        guest_name: name,
        guest_email: isEmail ? contact : undefined,
        guest_whatsapp: isEmail ? undefined : contact,
        ga_client_id: getGaClientId() ?? undefined,
        session_id: getSessionId() ?? undefined,
        property_id: meta.property_id,
        property_name: meta.property_name,
        destination_country: meta.destination_country,
        market_country: attribution?.market_country,
        traffic_channel: attribution?.traffic_channel,
        utm_source: attribution?.utm_source ?? undefined,
        utm_medium: attribution?.utm_medium ?? undefined,
        utm_campaign: attribution?.utm_campaign ?? undefined,
      }
      const payload = isPriced ? { ...shared, variant_id: tv!.id } : { ...shared, source_page: window.location.pathname }
      const res = await fetch("/api/bookings/public", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? (isPriced ? "Could not start reservation" : "Could not send your request"))
        return
      }
      const lead = { ...meta, program_name: programName, variant_id: isPriced ? tv!.id : undefined, value: isPriced ? thbDeposit : null, currency: "THB", booking_id: json.booking?.id, market_country: attribution?.market_country }
      track("generate_lead", lead)
      if (isPriced) {
        if (json.checkout_url) {
          track("begin_checkout", lead)
          window.location.assign(json.checkout_url)
          return
        }
        setError("Could not start checkout. Please message us on WhatsApp instead.")
      } else {
        setStep("sent")
      }
    } catch {
      setError("Something went wrong. Please try again or message us on WhatsApp.")
    } finally {
      setSubmitting(false)
    }
  }

  if (step === "sent") {
    return (
      <Dialog open={open} onClose={close}>
        <div className={s.dialogHead}>
          <Badge icon="mark_chat_read" size="s" />
          <IconButton icon="close" label="Close" onClick={close} />
        </div>
        <h2 className="ds-headline-s">Request sent</h2>
        <p className="ds-body-m ds-muted" style={{ margin: 0 }}>A person checks availability and the final price and writes to you on WhatsApp within a day. Nothing is charged.</p>
        <div className={s.dialogActions}>
          <a href="/start" className={s.filledLink}>Take your Wellness Journey</a>
          <Button variant="text" onClick={close}>Done</Button>
        </div>
      </Dialog>
    )
  }

  if (step === "details") {
    return (
      <Dialog open={open} onClose={close}>
        <div className={s.dialogHead}>
          <IconButton icon="arrow_back" label="Back" onClick={() => setStep("choose")} />
          <IconButton icon="close" label="Close" onClick={close} />
        </div>
        <h2 className="ds-headline-s">{isPriced ? "Pay your deposit" : "Request your dates"}</h2>
        <div className={s.box}>
          <span className="ds-title-m">{programName}</span>
          <span className="ds-body-m ds-muted"><Facts items={[placeLine, slot?.title, `${pax} ${pax === 1 ? "guest" : "guests"}`]} /></span>
        </div>
        <form onSubmit={submit} className={s.form}>
          <TextField label="Name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
          <TextField label="Email or WhatsApp" autoComplete="email" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="you@example.com or +44…" required />
          {isPriced && tv && thbDeposit != null && (
            <div className={o.summary}>
              <div className={o.sumRow}><span>Programme, {tv.duration_days} days</span><span>{thb(tv.price_basic_thb)}</span></div>
              <div className={cx(o.sumRow, o.sumTotal)}><span>Deposit today</span><span>{thb(thbDeposit)}</span></div>
              <div className={o.sumRow}><span>Due after confirmation</span><span>{thb(tv.price_basic_thb - thbDeposit)}</span></div>
            </div>
          )}
          {error && <p className={o.error} role="alert">{error}</p>}
          <Button type="submit" variant="filled" size="l" block disabled={submitting}>
            {submitting ? "One moment…" : isPriced && thbDeposit != null ? `Pay ${thb(thbDeposit)} deposit` : "Send request"}
          </Button>
          {isPriced && (
            <>
              <PaymentMarks />
              <p className={s.secure}><Icon name="lock" size={16} />Payments by Stripe. We never see your card number.</p>
            </>
          )}
          <a href={waHref} target="_blank" rel="noreferrer" className={s.waLink}>Prefer to talk first? Message us on WhatsApp</a>
        </form>
      </Dialog>
    )
  }

  // CF4: Choose a departure
  return (
    <Dialog open={open} onClose={close} title="Choose a departure">
      {variants.length > 1 && (
        <div className={s.lengths} role="radiogroup" aria-label="Programme length">
          {variants.map((x) => (
            <Chip key={x.id} selected={x.id === variantId} onClick={() => onVariant(x.id)}>{x.duration_days} days</Chip>
          ))}
        </div>
      )}
      <div className={s.guestsRow}>
        <span className={mobile ? "ds-title-s" : "ds-title-m"}>Guests</span>
        <Stepper pax={pax} setPax={setPax} />
      </div>
      {mobile ? (
        <label className={s.monthSelect}>
          <select value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month">
            {months.map((k) => <option key={k} value={k}>{monthLabel(k)}</option>)}
          </select>
          <span className="ds-title-s">{monthLabel(months.includes(month) ? month : months[0])}</span>
          <Icon name="expand_more" size={16} />
        </label>
      ) : (
        <div className={s.lengths}>
          {months.map((k) => <Chip key={k} selected={k === (months.includes(month) ? month : months[0])} onClick={() => setMonth(k)}>{monthLabel(k)}</Chip>)}
        </div>
      )}
      <div className={o.slots}>
        {shown.map((x) => (
          <div key={x.start} className={s.slotGroup}>
            {mobile && <span className="ds-label-m ds-muted">{x.dayLabel}</span>}
            <SlotRow
              slot={x}
              tall={!mobile}
              on={x.start === slot?.start}
              onPick={() => onSlot(x.start)}
              sub={mobile ? <Facts items={[priceUsd ? `${usd(priceUsd)} per person` : null, `${days} days`]} /> : <Facts items={[x.weekdays, priceUsd ? `${usd(priceUsd)} per person` : null]} />}
            />
          </div>
        ))}
      </div>
      <Button variant="filled" size="l" block onClick={() => setStep("details")} disabled={!slot}>
        {priced ? (
          <>
            {mobile ? "Reserve" : `Reserve ${slot?.title ?? ""}`}
            <span className="ds-sep" style={{ background: "currentColor", opacity: 0.4 }} />
            {usd(deposit)} deposit
          </>
        ) : (
          `Request ${slot?.title ?? "dates"}`
        )}
      </Button>
      <p className={o.note} style={{ textAlign: "center" }}>
        {priced ? "Deposit by card, Apple Pay or Google Pay. A person confirms your trip on WhatsApp." : "No payment now. A person confirms availability and the price on WhatsApp."}
      </p>
      {priced && <div className={s.marksRow}><PaymentMarks /></div>}
    </Dialog>
  )
}
