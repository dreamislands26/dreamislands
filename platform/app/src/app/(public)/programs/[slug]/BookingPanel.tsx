"use client"
// Booking UI from the DS v2 layouts:
//  - CF3 desktop aside: "Reserve card · Departures" with a pill above it
//  - CF3 mobile: bottom action bar
//  - CF4: "Choose a departure" dialog (desktop) / sheet (mobile)
//  - CF5 analogue: "Your details" step, then Stripe Checkout (production flow)
//  - CF7: request sent; CF8: payment didn't go through (?booking=cancelled)
// Payloads to /api/bookings/public are unchanged from production.
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useSearchParams } from "next/navigation"
import { useRouter } from "@/lib/i18n-nav"
import { getAttribution, getGaClientId, getSessionId, track } from "../../_lib/track"
import { Badge, Button, Chip, Facts, Icon, IconButton, Radio, TextField, cx } from "../../ds/ui"
import { BottomSheet, Dialog, overlayStyles as o } from "../../ds/overlay"
import { PaymentMarks } from "../../ds/payment"
import { slotsFor, type Slot } from "./departures"
import RangeCalendar from "../../ds/RangeCalendar"
import s from "./program.module.css"

export type PanelVariant = { id: string; label: string; duration_days: number; duration_nights: number; price_basic_usd: number; checkout: boolean }
export type PanelRoom = { id: string; name: string; capacity: number | null; icon: string }
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
  supplierPrice,
  rooms = [],
}: {
  programId: string
  programName: string
  /** Rooms of the stay ("Where you stay"); the sheet offers them in a dropdown */
  rooms?: PanelRoom[]
  propertyId?: string
  propertyName?: string
  country?: string
  variants: PanelVariant[]
  waHref: string
  placeLine?: string
  supplierPrice?: { amount: number; currency: string } | null
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
  // Phones: at the end of the page the fixed bar morphs into the card before the footer (Oleg 07.11.2026).
  // While the card ([data-bar-dock] in ProgramView) rises into view, --p goes 0..1 and the bar takes the card's
  // shape (insets, corners, padding); when the card is fully on screen the bar sits exactly on it and hands over.
  const barRef = useRef<HTMLDivElement>(null)
  const [dock, setDock] = useState<HTMLElement | null>(null)
  const [docked, setDocked] = useState(false)
  useEffect(() => {
    const el = document.querySelector<HTMLElement>("[data-bar-dock]")
    setDock(el)
    if (!el) return
    let raf = 0
    const update = () => {
      raf = 0
      const bar = barRef.current, card = el.firstElementChild as HTMLElement | null
      if (!bar || !card) return
      const r = card.getBoundingClientRect(), vh = window.innerHeight
      const p = Math.min(1, Math.max(0, (vh - r.top) / r.height))
      bar.style.setProperty("--p", String(p))
      setDocked(r.bottom <= vh)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf) }
  }, [dock])
  const [failed, setFailed] = useState(params.get("booking") === "cancelled")
  const price = v?.price_basic_usd ?? 0
  const fmtSup = (n: number) => `${supplierPrice!.currency} ${Math.round(n).toLocaleString("en-US")}`
  const sup = supplierPrice ? fmtSup(supplierPrice.amount) : null
  const deposit = Math.round(price * (DEPOSIT_PCT / 100))
  const meta = { program_id: programId, property_id: propertyId, property_name: propertyName, destination_country: country }

  // The room picked in the sheet; a room's arrow in "Where you stay" opens the sheet with it (Oleg 07.11.2026)
  const [roomId, setRoomId] = useState<string>(rooms[0]?.id ?? "")
  const openDialog = useCallback(() => {
    setOpen(true)
    track("open_reserve_modal", meta)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId])

  // On a phone the panel is hidden (the bottom bar books): the page's other "Check dates" links
  // (#reserve) open the dialog instead of jumping to nothing
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.<HTMLElement>('a[href="#reserve"]')
      if (a?.dataset.room) setRoomId(a.dataset.room)
      if (!a || !window.matchMedia("(max-width: 767px)").matches) return
      e.preventDefault()
      openDialog()
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [openDialog])

  const closeFailed = () => {
    setFailed(false)
    router.replace(window.location.pathname, { scroll: false })
  }

  const cta = (withDates: boolean) => (priced ? `Reserve${withDates && slot ? ` ${slot.title}` : ""}` : `Request${withDates && slot ? ` ${slot.title}` : " dates"}`)

  const barBody = (
    <>
      <div className={s.barPrice}>
        <span className={s.barTop}>
          <strong>{sup ? `from ${sup}` : price > 0 ? usd(price) : "On request"}</strong>
          <span className="ds-sep" />
          <span>{days} days</span>
        </span>
        <span className={s.barSub}><Facts items={[slot?.title, priced ? `${usd(deposit)} deposit` : "no payment now"]} /></span>
      </div>
      <Button variant="filled" size="l" onClick={openDialog}>{priced ? "Reserve" : "Request"}</Button>
    </>
  )
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
            <span className="ds-headline-s">{sup ? `From ${sup}` : hasUsd ? `From ${usd(Math.min(...variants.map((x) => x.price_basic_usd).filter((n) => n > 0)))}` : "Price on request"}</span>
            <span className="ds-body-m ds-muted"><Facts items={[hasUsd ? "per person" : null, `${days} days`]} /></span>
          </div>
          {sup && price > 0 && <p className="ds-body-m ds-muted" style={{ margin: 0 }}>About {usd(price)} at today&apos;s exchange rate. Your coordinator confirms the final price.</p>}
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
              <div className={o.sumRow}><span>Programme, {days} days</span><span>{sup ?? usd(price)}</span></div>
              {priced && <div className={o.sumRow}><span>Deposit today</span><span>{usd(deposit)}</span></div>}
              <div className={o.sumRow}><span>Two Wellness Score check-ins</span><span>Included</span></div>
              <div className={cx(o.sumRow, o.sumTotal)}><span>Total, {pax} {pax === 1 ? "guest" : "guests"}</span><span>{supplierPrice ? fmtSup(supplierPrice.amount * pax) : usd(price * pax)}</span></div>
            </div>
          )}
        </div>
      </aside>

      {/* CF3 mobile: bottom action bar; at the end of the page it becomes the card in [data-bar-dock] */}
      <div ref={barRef} className={cx(s.bar, docked && s.barDocked)} data-own-bar="program" aria-hidden={docked || undefined}>
        {barBody}
      </div>
      {dock && createPortal(<div className={cx(s.barCard, !docked && s.barCardWaiting)}>{barBody}</div>, dock)}

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
        rooms={rooms}
        roomId={roomId}
        onRoom={setRoomId}
      />

      {/* CF8: payment didn't go through */}
      <Dialog open={failed} onClose={closeFailed} title="Payment didn’t go through">
        <Badge icon="credit_card_off" tone="error" size="s" />
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
  rooms: PanelRoom[]
  roomId: string
  onRoom: (id: string) => void
}) {
  const { open, onClose, mobile, programId, programName, placeLine, priced, variants, variantId, onVariant, slots, slot, onSlot, pax, setPax, priceUsd, meta, waHref, rooms, roomId, onRoom } = props
  const room = rooms.find((r) => r.id === roomId) ?? rooms[0]
  const [step, setStep] = useState<"choose" | "details" | "sent">("choose")
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
      <Dialog open={open} onClose={close} title="Request sent">
        <Badge icon="mark_chat_read" size="s" />
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
      <Dialog open={open} onClose={close} title={isPriced ? "Pay your deposit" : "Request your dates"} back={() => setStep("choose")}>
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

  // CF4: Choose a departure. Same sheet as Filters (Oleg 07.11.2026): section headings, the action in the
  // sheet's footer, compact rows so a usual case fits one phone screen.
  const reserve = (
    <Button variant="filled" size="l" className={s.depGo} onClick={() => setStep("details")} disabled={!slot}>
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
  )
  return (
    <BottomSheet open={open} onClose={close} title="Choose a departure" footer={reserve}>
      <div className={s.dep}>
        {/* Room: a card with a dropdown (native select over it) (Oleg 07.11.2026) */}
        {room && (
          <section className={s.depGroup}>
            <h3 className="ds-headline-s">Room</h3>
            <label className={s.roomPick}>
              <span className={s.roomPickIcon}><Icon name={room.icon} /></span>
              <span className={s.roomPickText}>
                <span className="ds-title-m">{room.name}</span>
                {room.capacity ? <span className="ds-body-s ds-muted">Up to {room.capacity} {room.capacity === 1 ? "guest" : "guests"}</span> : null}
              </span>
              {rooms.length > 1 && <Icon name="expand_more" size={24} />}
              {rooms.length > 1 && (
                <select value={room.id} onChange={(e) => onRoom(e.target.value)} aria-label="Room">
                  {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}{r.capacity ? ` (up to ${r.capacity})` : ""}</option>)}
                </select>
              )}
            </label>
          </section>
        )}
        {variants.length > 1 && (
          <section className={s.depGroup}>
            <h3 className="ds-headline-s">Length</h3>
            <div className={s.lengths} role="radiogroup" aria-label="Programme length">
              {variants.map((x) => (
                <Chip key={x.id} size="s" selected={x.id === variantId} onClick={() => onVariant(x.id)}>{x.duration_days} days</Chip>
              ))}
            </div>
          </section>
        )}
        <section className={s.depRow}>
          <h3 className="ds-headline-s">Guests</h3>
          <Stepper pax={pax} setPax={setPax} />
        </section>
        <section className={s.depGroup}>
          {/* A calendar of the trips one can take; the picked stay is highlighted; the month sits on the title row (Oleg 07.11.2026) */}
          <RangeCalendar ranges={slots} selected={slot} onPick={onSlot} heading={<h3 className="ds-headline-s">Dates</h3>} />
          {slot && (
            <div className={s.calPick}>
              <span className="ds-title-m">{slot.title}</span>
              <span className="ds-body-m ds-muted"><Facts items={[slot.weekdays, priceUsd ? `${usd(priceUsd)} per person` : null, `${days} days`]} /></span>
            </div>
          )}
        </section>
        <p className={o.note} style={{ textAlign: "center" }}>
          {priced ? "Deposit by card, Apple Pay or Google Pay. A person confirms your trip on WhatsApp." : "No payment now. A person confirms availability and the price on WhatsApp."}
        </p>
        {priced && <div className={s.marksRow}><PaymentMarks /></div>}
      </div>
    </BottomSheet>
  )
}
