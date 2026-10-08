"use client"
import Link from "next/link"
import { useMemo, useState } from "react"
import { COHORT_LABELS } from "../../_lib/programMapping"
import { Icon } from "../../_components/Icon"
import ProgramImage from "../../_components/ProgramImage"
import ReserveModal from "../../_components/ReserveModal"
import MediaGallery from "../../_components/MediaGallery"
type Property = {
  id: string
  name: string
  slug: string
  island: string | null
  country: string | null
  contact_wa: string | null
}
type Variant = {
  id: string
  label: string
  duration_days: number
  duration_nights: number
  price_basic_usd: number
  price_vip_usd: number | null
  active: boolean
  sort_order: number
}
type ScheduleItem = {
  id: string
  day_no: number
  start_time: string | null
  end_time: string | null
  title: string
  description: string | null
  kind: string | null
  sort_order: number
}
type ServiceLink = {
  is_included: boolean
  sort_order: number
  services: {
    id: string
    name: string
    slug: string
    category: string | null
    description: string | null
    price_usd: number | null
    duration_min: number | null
  }
}
export type ProgramDetail = {
  id: string
  name: string
  slug: string
  cohort: number
  tier: string | null
  summary: string | null
  goal: string | null
  target_guest: string | null
  how_we_achieve: string | null
  guest_feels: string | null
  included_services: string | null
  contraindications: string | null
  hero_image_url: string | null
  outcomes: string[] | null
  is_composite: boolean
  program_properties: Array<{ role: string | null; properties: Property }>
  program_variants: Variant[]
  program_schedule_items: ScheduleItem[]
  program_services: ServiceLink[]
}
export type AccommodationItem = {
  id: string
  property_id: string
  room_type: string
  capacity: number
  has_pool: boolean
  price_thb_per_night: number
  description: string | null
  sort_order: number
  properties: { id: string; name: string } | null
}
export type ConfirmedBooking = {
  id: string
  arrival: string
  departure: string
  pax: number
}
export type ReviewItem = {
  id?: string
  guest_name: string | null
  rating: number | null
  text_en: string | null
  text_ru: string | null
  created_at: string | null
}
const COUNTRY_FLAG: Record<string, string> = {
  Indonesia: "🇮🇩",
  Thailand: "🇹🇭",
  Singapore: "🇸🇬",
}
function fmtTime(t: string | null): string {
  return t ? t.slice(0, 5) : ""
}
function fmtDateLong(iso: string): string {
  const d = new Date(iso + "T00:00:00Z")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
}
function buildIcsHref(booking: ConfirmedBooking, programName: string): string {
  const compact = (iso: string) => iso.replace(/-/g, "")
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dream Islands//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${booking.id}@dreamislands.org`,
    `DTSTART;VALUE=DATE:${compact(booking.arrival)}`,
    `DTEND;VALUE=DATE:${compact(booking.departure)}`,
    `SUMMARY:${programName} — Dream Islands`,
    "DESCRIPTION:Your Dream Islands wellness stay.",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
  return "data:text/calendar;charset=utf8," + encodeURIComponent(lines.join("\r\n"))
}
function ContentBlock({ title, body }: { title: string; body: string | null | undefined }) {
  if (!body || !body.trim()) return null
  return (
    <div style={{ marginBottom: 32 }}>
      <h2
        style={{
          margin: "0 0 12px",
          fontFamily: "var(--font-display)",
          fontSize: 32,
          fontWeight: 400,
          letterSpacing: "-.02em",
          color: "var(--ink)",
        }}
      >
        {title}
      </h2>
      <p className="body-lg" style={{ whiteSpace: "pre-wrap", color: "var(--ink-2)" }}>
        {body}
      </p>
    </div>
  )
}
export default function ProgramDetailView({
  program,
  accommodations,
  confirmedBooking,
  galleryImages = [],
  reviews = [],
}: {
  program: ProgramDetail
  accommodations: AccommodationItem[]
  confirmedBooking?: ConfirmedBooking | null
  galleryImages?: { url: string; alt: string }[]
  reviews?: ReviewItem[]
}) {
  const cohort = COHORT_LABELS[program.cohort] ?? { name: "Reset", fullName: "Reset & Recovery", color: "var(--accent)" }
  const properties = program.program_properties.map((pp) => pp.properties).filter(Boolean)
  const primaryProperty = properties[0] ?? null
  const firstWa = properties.find((p) => p?.contact_wa)?.contact_wa ?? null
  const waHref = firstWa
    ? `https://wa.me/${firstWa.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi! I'd like to book "${program.name}".`)}`
    : "https://wa.me/message/HOF2AFIBDYY5J1"
  const variants = useMemo(
    () => program.program_variants.filter((v) => v.active).sort((a, b) => a.sort_order - b.sort_order),
    [program.program_variants],
  )
  const hasVip = variants.some((v) => v.price_vip_usd != null)
  const [tier, setTier] = useState<"basic" | "vip">("basic")
  const days = useMemo(() => {
    const map = new Map<number, ScheduleItem[]>()
    for (const it of program.program_schedule_items) {
      const arr = map.get(it.day_no) ?? []
      arr.push(it)
      map.set(it.day_no, arr)
    }
    for (const arr of map.values()) arr.sort((a, b) => a.sort_order - b.sort_order)
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [program.program_schedule_items])
  const [activeDay, setActiveDay] = useState<number | null>(days[0]?.[0] ?? null)
  const activeDayItems = days.find(([d]) => d === activeDay)?.[1] ?? []
  const included = program.program_services
    .filter((l) => l.is_included)
    .sort((a, b) => a.sort_order - b.sort_order)
  const optional = program.program_services
    .filter((l) => !l.is_included)
    .sort((a, b) => a.sort_order - b.sort_order)
  const accByProperty = useMemo(() => {
    const map = new Map<string, AccommodationItem[]>()
    for (const a of accommodations) {
      const arr = map.get(a.property_id) ?? []
      arr.push(a)
      map.set(a.property_id, arr)
    }
    return map
  }, [accommodations])
  const [contraOpen, setContraOpen] = useState(false)
  return (
    <div className="page" style={{ paddingBottom: 80 }}>
      <section className="shell" style={{ paddingTop: 16 }}>
        <Link
          href="/programs"
          className="btn btn-ghost"
          style={{ padding: "10px 16px", fontSize: 13, marginBottom: 24 }}
        >
          <Icon.back width={14} height={14} /> All programs
        </Link>
        {confirmedBooking && (
          <div
            className="card"
            style={{ padding: "30px 26px", marginBottom: 32, background: "var(--accent)", color: "var(--accent-ink)", border: 0 }}
          >
            <div className="eyebrow" style={{ color: "rgba(255,255,255,.8)", marginBottom: 8 }}>
              Deposit received · Booking #{confirmedBooking.id.slice(0, 8).toUpperCase()}
            </div>
            <h2 className="display" style={{ margin: "0 0 14px", fontSize: "clamp(24px, 4vw, 34px)" }}>
              Your journey has started.
            </h2>
            <p className="body" style={{ marginBottom: 20, maxWidth: 560 }}>
              Your reservation request is reviewed after the deposit is received. If availability cannot be confirmed, your deposit will be refunded in full.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 40px", marginBottom: 22, fontSize: 14 }}>
              <div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>Arrival</div>
                <strong>{fmtDateLong(confirmedBooking.arrival)}</strong>
              </div>
              <div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>Departure</div>
                <strong>{fmtDateLong(confirmedBooking.departure)}</strong>
              </div>
              <div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>Guests</div>
                <strong>{confirmedBooking.pax}</strong>
              </div>
            </div>
            <div style={{ display: "grid", gap: 8, marginBottom: 22, fontSize: 14 }}>
              <div>1. We review your request and confirm availability.</div>
              <div>2. You receive pre-arrival prep and full details.</div>
              <div>3. You arrive and begin your protocol.</div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                className="btn"
                style={{ background: "var(--accent-ink)", color: "var(--accent-deep)" }}
              >
                <Icon.wa width={16} height={16} /> Message your advisor
              </a>
              <a
                href={buildIcsHref(confirmedBooking, program.name)}
                download="dream-islands-booking.ics"
                className="btn"
                style={{ background: "transparent", color: "var(--accent-ink)", border: "1px solid rgba(255,255,255,.4)" }}
              >
                Add to calendar
              </a>
            </div>
          </div>
        )}
        {/* HERO */}
        <div style={{ display: "grid", gap: 28 }} className="detail-hero">
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              <span className="tag" style={{ background: cohort.color, color: "white" }}>
                {cohort.fullName}
              </span>
              {program.tier && <span className="tag tag-outline">{program.tier}</span>}
              {program.is_composite && (
                <span className="tag" style={{ background: "var(--accent-soft)", color: "var(--accent-deep)" }}>
                  Composite
                </span>
              )}
              {(program.outcomes ?? []).map((o) => (
                <span key={o} className="tag tag-outline">
                  {o}
                </span>
              ))}
            </div>
            <h1
              className="display"
              style={{ margin: 0, fontSize: "clamp(40px, 9vw, 72px)", color: "var(--ink)", lineHeight: 1.05 }}
            >
              {program.name}
            </h1>
            {program.summary && (
              <p className="body-lg" style={{ marginTop: 18, maxWidth: 560 }}>
                {program.summary}
              </p>
            )}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
              <ReserveModal
                programs={[{
                  id: program.id,
                  name: program.name,
                  property_id: primaryProperty?.id,
                  property_name: primaryProperty?.name,
                  destination_country: primaryProperty?.country ?? undefined,
                }]}
                triggerLabel="Reserve dates"
                triggerClassName="btn btn-primary btn-lg"
              />
              <a className="btn btn-ghost btn-lg" href={waHref} target="_blank" rel="noreferrer">
                <Icon.wa width={16} height={16} /> Book on WhatsApp
              </a>
              <Link className="btn btn-ghost btn-lg" href="/start">
                Take the assessment
              </Link>
            </div>
          </div>
          <div>
            <div className="hero-image" style={{ aspectRatio: "4 / 5" }}>
              <ProgramImage url={program.hero_image_url} cohort={program.cohort} alt={program.name} aspect="4 / 5" />
            </div>
            {["club-med-bintan-triathlon-prep-7d","club-med-bintan-triathlon-prep-14d","movenpick-cebu-ironman-prep-camp-7d","movenpick-cebu-ironman-prep-camp-14d"].includes(program.slug) && (<div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}><img src="/mascots/dreamer_triathlon_swim_woman.png" alt="" style={{ width: 90, height: "auto" }} /><img src="/mascots/dreamer_triathlon_bike_man.png" alt="" style={{ width: 90, height: "auto" }} /><img src="/mascots/dreamer_triathlon_run_woman-man.png" alt="" style={{ width: 90, height: "auto" }} /></div>)}
          </div>
        </div>
        <hr style={{ border: 0, borderTop: "1px solid var(--line-2)", margin: "56px 0" }} />
        {/* GALLERY */}
        {galleryImages.length > 0 && <MediaGallery images={galleryImages} title="Gallery" />}
        {/* CONTENT BLOCKS */}
        <ContentBlock title="What you'll get" body={program.goal} />
        <ContentBlock title="Who it's for" body={program.target_guest} />
        <ContentBlock title="The method" body={program.how_we_achieve} />
        <ContentBlock title="How you'll feel" body={program.guest_feels} />
        <ContentBlock title="What's included" body={program.included_services} />
        {/* VARIANTS & PRICING */}
        {variants.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2
              style={{
                margin: "0 0 16px",
                fontFamily: "var(--font-display)",
                fontSize: 32,
                fontWeight: 400,
                color: "var(--ink)",
              }}
            >
              Length & pricing
            </h2>
            {hasVip && (
              <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                {(["basic", "vip"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTier(t)}
                    className="tag"
                    style={{
                      padding: "8px 18px",
                      fontSize: 13,
                      background: tier === t ? "var(--accent)" : "var(--surface-2)",
                      color: tier === t ? "var(--accent-ink)" : "var(--ink-2)",
                      border: `1px solid ${tier === t ? "var(--accent)" : "var(--line)"}`,
                      textTransform: "uppercase",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
            <div className="variant-grid">
              {variants.map((v) => {
                const price =
                  tier === "vip" && v.price_vip_usd != null
                    ? Number(v.price_vip_usd)
                    : Number(v.price_basic_usd)
                return (
                  <div
                    key={v.id}
                    className="card"
                    style={{ padding: 22, display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 16, color: "var(--ink)" }}>{v.label}</div>
                    <div className="body-sm">{v.duration_days} days · {v.duration_nights} nights</div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 32,
                        color: "var(--accent-deep)",
                        marginTop: 8,
                      }}
                    >
                      ${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    {tier === "vip" && v.price_vip_usd == null && (
                      <div className="body-sm" style={{ color: "var(--ink-3)" }}>VIP same as basic</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {/* SCHEDULE */}
        {days.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2
              style={{
                margin: "0 0 16px",
                fontFamily: "var(--font-display)",
                fontSize: 32,
                fontWeight: 400,
                color: "var(--ink)",
              }}
            >
              Schedule
            </h2>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 18, paddingBottom: 4 }}>
              {days.map(([d]) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setActiveDay(d)}
                  className="tag"
                  style={{
                    flex: "0 0 auto",
                    padding: "8px 16px",
                    fontSize: 13,
                    background: activeDay === d ? "var(--accent)" : "var(--surface-2)",
                    color: activeDay === d ? "var(--accent-ink)" : "var(--ink-2)",
                    border: `1px solid ${activeDay === d ? "var(--accent)" : "var(--line)"}`,
                  }}
                >
                  Day {d}
                </button>
              ))}
            </div>
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {activeDayItems.map((it) => (
                  <div
                    key={it.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "120px 1fr",
                      gap: 16,
                      alignItems: "start",
                    }}
                    className="schedule-row"
                  >
                    <div style={{ fontWeight: 600, color: "var(--accent-deep)" }}>
                      {it.start_time ? `${fmtTime(it.start_time)}${it.end_time ? ` – ${fmtTime(it.end_time)}` : ""}` : "—"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--ink)" }}>
                        {it.title}
                        {it.kind && <span className="tag tag-outline" style={{ marginLeft: 8 }}>{it.kind}</span>}
                      </div>
                      {it.description && (
                        <p className="body-sm" style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>
                          {it.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* INCLUDED SERVICES */}
        {included.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ margin: "0 0 16px", fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 400, color: "var(--ink)" }}>
              Services included
            </h2>
            <div className="service-grid">
              {included.map((l) => (
                <div key={l.services.id} className="card" style={{ padding: 18, display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ color: "var(--accent)" }}>
                    <Icon.flower width={28} height={28} />
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--ink)" }}>{l.services.name}</div>
                    {(l.services.category || l.services.duration_min) && (
                      <div className="body-sm">
                        {l.services.category}
                        {l.services.duration_min ? ` · ${l.services.duration_min} min` : ""}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* OPTIONAL UPGRADES */}
        {optional.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 400, color: "var(--ink)" }}>
              Optional upgrades
            </h2>
            <p className="body" style={{ marginBottom: 16, color: "var(--ink-3)" }}>
              Available à-la-carte during your stay.
            </p>
            <div className="service-grid">
              {optional.map((l) => (
                <div key={l.services.id} className="card" style={{ padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--ink)" }}>{l.services.name}</div>
                    {(l.services.category || l.services.duration_min) && (
                      <div className="body-sm">
                        {l.services.category}
                        {l.services.duration_min ? ` · ${l.services.duration_min} min` : ""}
                      </div>
                    )}
                  </div>
                  {l.services.price_usd != null && (
                    <div style={{ fontWeight: 600, color: "var(--ink)" }}>
                      ${Number(l.services.price_usd).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* LOCATIONS + ACCOMMODATIONS */}
        {properties.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ margin: "0 0 16px", fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 400, color: "var(--ink)" }}>
              Locations
            </h2>
            <div style={{ display: "grid", gap: 16 }}>
              {properties.map((pr) => {
                if (!pr) return null
                const rooms = accByProperty.get(pr.id) ?? []
                const flag = pr.country ? (COUNTRY_FLAG[pr.country] ?? "") : ""
                return (
                  <div key={pr.id} className="card" style={{ padding: 22 }}>
                    <div style={{ fontWeight: 600, fontSize: 18, color: "var(--ink)" }}>
                      {flag} {pr.name}
                    </div>
                    <div className="body-sm" style={{ marginTop: 4, marginBottom: rooms.length ? 16 : 0 }}>
                      {pr.island ?? ""} {pr.country ? `· ${pr.country}` : ""}
                    </div>
                    {rooms.length > 0 && (
                      <div className="rooms-grid">
                        {rooms.map((r) => (
                          <div key={r.id} style={{ padding: "12px 14px", borderRadius: 14, background: "var(--surface)" }}>
                            <div style={{ fontWeight: 600, color: "var(--ink)" }}>{r.room_type}</div>
                            <div className="body-sm" style={{ marginTop: 2 }}>
                              Up to {r.capacity} guest{r.capacity > 1 ? "s" : ""}
                              {r.has_pool ? " · private pool" : ""}
                            </div>
                            <div style={{ marginTop: 6, fontWeight: 600, color: "var(--ink)" }}>
                              Included with your package
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {/* GUEST REVIEWS */}
        {reviews.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, marginBottom: 14, color: "var(--ink)" }}>What guests say</h2>
            <div style={{ display: "grid", gap: 14 }}>
              {reviews.slice(0, 6).map((r, i) => (
                <div key={r.id ?? i} className="card" style={{ padding: 20 }}>
                  {typeof r.rating === "number" && (
                    <div style={{ marginBottom: 8, color: "var(--accent)", fontSize: 14 }}>
                      {"\u2605".repeat(Math.round(r.rating))}
                      {"\u2606".repeat(5 - Math.round(r.rating))}
                    </div>
                  )}
                  {(r.text_en || r.text_ru) && (
                    <p className="body-sm" style={{ margin: "0 0 10px", fontStyle: "italic" }}>
                      &ldquo;{r.text_en || r.text_ru}&rdquo;
                    </p>
                  )}
                  <div className="body-sm" style={{ color: "var(--ink-2)", fontWeight: 600 }}>
                    {r.guest_name || "Guest"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* CONTRAINDICATIONS */}
        {program.contraindications && (
          <div className="card" style={{ padding: 20, marginBottom: 40 }}>
            <button
              type="button"
              onClick={() => setContraOpen((x) => !x)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontWeight: 600,
                color: "var(--ink)",
                fontSize: 15,
              }}
              aria-expanded={contraOpen}
            >
              Contraindications
              <Icon.chevron
                width={16}
                height={16}
                style={{ transform: contraOpen ? "rotate(90deg)" : "none", transition: "transform .2s" }}
              />
            </button>
            {contraOpen && (
              <p className="body" style={{ marginTop: 14, whiteSpace: "pre-wrap" }}>
                {program.contraindications}
              </p>
            )}
          </div>
        )}
        {/* FOOTER CTA */}
        <div
          className="card"
          style={{
            padding: "32px 26px",
            background: "var(--accent)",
            color: "var(--accent-ink)",
            border: 0,
            position: "relative",
            overflow: "hidden",
            marginTop: 32,
          }}
        >
          <div style={{ position: "absolute", top: -30, right: -30, opacity: 0.22, pointerEvents: "none" }}>
            <Icon.flower width={170} height={170} />
          </div>
          <div className="eyebrow" style={{ color: "rgba(255,255,255,.75)" }}>
            Ready to book?
          </div>
          <h3
            className="display"
            style={{ fontSize: "clamp(24px, 5vw, 36px)", margin: "10px 0 20px", maxWidth: 520 }}
          >
            <span className="display-italic">Talk to a human.</span> We&apos;ll lock in dates and pre-arrival prep.
          </h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <ReserveModal
              programs={[{
                id: program.id,
                name: program.name,
                property_id: primaryProperty?.id,
                property_name: primaryProperty?.name,
                destination_country: primaryProperty?.country ?? undefined,
              }]}
              triggerLabel="Reserve dates"
              triggerClassName="btn"
              triggerStyle={{ background: "var(--accent-ink)", color: "var(--accent-deep)" }}
            />
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="btn"
              style={{ background: "transparent", color: "var(--accent-ink)", border: "1px solid rgba(255,255,255,.4)" }}
            >
              <Icon.wa width={16} height={16} /> Message on WhatsApp
            </a>
            <Link
              href="/start"
              className="btn"
              style={{ background: "transparent", color: "var(--accent-ink)", border: "1px solid rgba(255,255,255,.4)" }}
            >
              Get matched <Icon.arrow width={14} height={14} />
            </Link>
          </div>
        </div>
      </section>
      <style>{`
        @media (min-width: 900px) {
          .detail-hero { grid-template-columns: 1.1fr 1fr; align-items: center; gap: 64px; padding-top: 24px; }
        }
        .variant-grid {
          display: grid;
          gap: 14px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 600px) { .variant-grid { grid-template-columns: repeat(3, 1fr); } }
        .service-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 700px) { .service-grid { grid-template-columns: repeat(2, 1fr); } }
        .rooms-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 700px) { .rooms-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) {
          .schedule-row { grid-template-columns: 1fr; gap: 4px; }
        }
      `}</style>
    </div>
  )
}
