// CF3 · Программа (desktop 86:2482 / 86:2652, mobile 86:2822 / 108:5097).
import { COHORT_LABELS } from "../../_lib/programMapping"
import { COUNTRY_FLAGS, countrySlug } from "../../_lib/countries"
import { enOnly, shortLine, type CatalogProgram } from "../../_lib/catalog"
import { PLACE_CONTENT } from "../../_lib/placeContent"
import { ButtonLink, Facts, Icon, ListItem, Route, SectionHead, SeeAll } from "../../ds/ui"
import { Photo, ProgramCard, cardStyles as cs } from "../../ds/cards"
import Gallery from "../../ds/Gallery"
import SaveButton from "../../ds/SaveButton"
import ShareButton from "../../ds/ShareButton"
import BookingPanel from "./BookingPanel"
import { Icon as Brand } from "../../_components/Icon"
import MobilePhoto from "../../ds/MobilePhoto"
import x from "../../ds/sections.module.css"
import s from "./program.module.css"
import Flag from "../../ds/Flag"

type Property = { id: string; name: string; slug: string; island: string | null; country: string | null; contact_wa: string | null }
type Variant = { id: string; label: string; duration_days: number; duration_nights: number; price_basic_usd: number; price_vip_usd: number | null; price_basic_thb?: number | null; active: boolean; sort_order: number }
type ScheduleItem = { id: string; day_no: number; start_time: string | null; end_time: string | null; title: string; description: string | null; kind: string | null; sort_order: number }
type ServiceLink = { is_included: boolean; sort_order: number; services: { id: string; name: string; slug: string; category: string | null; description: string | null; price_usd: number | null; duration_min: number | null } }

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
export type AccommodationItem = { id: string; property_id: string; room_type: string; capacity: number; has_pool: boolean; price_thb_per_night: number; description: string | null; sort_order: number; properties: { id: string; name: string } | null }
export type ConfirmedBooking = { id: string; arrival: string; departure: string; pax: number }
export type ProgramReview = { id: string; name: string; meta: string | null; text: string; rating: number; date?: string | null }

const WA_DEFAULT = "https://wa.me/message/HOF2AFIBDYY5J1"

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
}
function icsHref(b: ConfirmedBooking, programName: string) {
  const compact = (v: string) => v.replace(/-/g, "")
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Dream Islands//Booking//EN", "BEGIN:VEVENT", `UID:${b.id}@dreamislands.org`, `DTSTART;VALUE=DATE:${compact(b.arrival)}`, `DTEND;VALUE=DATE:${compact(b.departure)}`, `SUMMARY:${programName} — Dream Islands`, "DESCRIPTION:Your Dream Islands wellness stay.", "END:VEVENT", "END:VCALENDAR"]
  return "data:text/calendar;charset=utf8," + encodeURIComponent(lines.join("\r\n"))
}

/** Icon plate hues for the What to expect and What you'll do lists: the home goal tile palette, in an order
 *  where neighbours differ (mint, sky, peach, lavender, sage, coral, sand) */
const HUES = [160, 225, 60, 285, 130, 25, 95]
/** An icon for an activity from its title and text; spa when nothing matches */
const ACTIVITY_ICONS: [RegExp, string][] = [
  [/arriv|airport|transfer|check-?in|welcome/i, "flight_land"],
  [/depart|farewell|check-?out/i, "flight"],
  [/tcm|acupunct|moxib|chinese medicine|consult|doctor|clinic/i, "stethoscope"],
  [/foot bath|bath|sauna|onsen|hot spring|spa\b/i, "spa"],
  [/herbal|tea\b|infusion|oil pulling/i, "local_florist"],
  [/massage|tuina|thai massage/i, "massage"],
  [/yoga|meditat|breath|qigong|tai ?chi|mindful/i, "self_improvement"],
  [/rainforest|forest|jungle|garden|plantation/i, "forest"],
  [/beach|sea|island|snorkel/i, "beach_access"],
  [/surf/i, "surfing"],
  [/boat|cruise|kayak/i, "directions_boat"],
  [/hike|trek|walk|trail/i, "directions_walk"],
  [/pool|swim|aqua/i, "pool"],
  [/gym|training|workout|fitness|strength|muay|boxing/i, "fitness_center"],
  [/run|sprint/i, "directions_run"],
  [/temple|culture|cultural|heritage|park|museum|old town/i, "temple_buddhist"],
  [/detox|juice|nutrition|diet|cook|meal plan/i, "nutrition"],
  [/sleep|rest|relax/i, "bedtime"],
  [/assess|scan|test|measure|screen/i, "monitoring"],
]
const activityIcon = (t: { title: string; text: string }) =>
  ACTIVITY_ICONS.find(([re]) => re.test(t.title))?.[1] ?? ACTIVITY_ICONS.find(([re]) => re.test(t.text))?.[1] ?? "spa"

/** Four "What you'll do" items: distinct activities from the schedule (no meals), else the method text. */
function whatYoullDo(program: ProgramDetail) {
  const seen = new Set<string>()
  const items: { title: string; text: string }[] = []
  const sorted = [...program.program_schedule_items].sort((a, b) => a.day_no - b.day_no || a.sort_order - b.sort_order)
  for (const it of sorted) {
    if (it.kind === "meal") continue
    const key = it.title.toLowerCase().replace(/\s*\(.*\)/, "")
    if (seen.has(key)) continue
    seen.add(key)
    items.push({ title: it.title, text: enOnly(it.description) ?? "" })
    if (items.length === 4) break
  }
  if (items.length === 0 && program.how_we_achieve) items.push({ title: "The method", text: enOnly(program.how_we_achieve) ?? "" })
  return items
}

function Stars({ n, size }: { n: number; size: number }) {
  return (
    <span className={s.stars} aria-label={`${n} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ fontSize: size, opacity: i < Math.round(n) ? 1 : 0.25 }}>★</span>
      ))}
    </span>
  )
}

function Ratings({ reviews }: { reviews: ProgramReview[] }) {
  const avg = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
  const dist = [5, 4, 3, 2, 1].map((k) => reviews.filter((r) => Math.round(r.rating) === k).length)
  const max = Math.max(...dist, 1)
  return (
    <div className={s.ratings}>
      <SectionHead title="Ratings & Reviews" titleClass="ds-headline-s" action={<SeeAll href="/reviews" count={reviews.length} />} />
      <div className={s.ratingSummary}>
        <div className={s.score}>
          <span className="ds-display-l">{avg.toFixed(1)}</span>
          <span className="ds-title-s ds-muted">out of 5</span>
        </div>
        <div className={s.dist}>
          {dist.map((c, i) => (
            <div key={i} className={s.distRow}>
              <span className={s.distStars}>{"★".repeat(5 - i)}</span>
              <span className={s.distBar}><span style={{ width: `${(c / max) * 100}%` }} /></span>
            </div>
          ))}
          <span className="ds-body-s ds-muted">{reviews.length} Ratings</span>
        </div>
      </div>
      <div className={s.reviewRail}>
        {reviews.slice(0, 8).map((r) => {
          const first = r.text.split(/(?<=[.!?])\s/)[0] ?? r.text
          const title = shortLine(first, 40)
          const body = r.text.slice(first.length).trim() || r.text
          return (
            <article key={r.id} className={s.reviewCard}>
              <div className={s.reviewTop}>
                <span className="ds-title-m">{title}</span>
                {r.date && <span className="ds-body-s ds-muted">{new Date(r.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>}
              </div>
              <div className={s.reviewMeta}>
                <Stars n={r.rating} size={12} />
                <span className="ds-body-s ds-muted">{r.name}</span>
              </div>
              <p className="ds-body-m ds-ink">{body}</p>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export default function ProgramView({
  program,
  accommodations,
  confirmedBooking,
  galleryImages,
  reviews,
  related,
  supplierPrice,
}: {
  program: ProgramDetail
  accommodations: AccommodationItem[]
  confirmedBooking: ConfirmedBooking | null
  galleryImages: { url: string; alt: string }[]
  reviews: ProgramReview[]
  related: CatalogProgram[]
  supplierPrice?: { amount: number; currency: string } | null
}) {
  const cohort = COHORT_LABELS[program.cohort]
  const properties = program.program_properties.map((pp) => pp.properties).filter(Boolean)
  const primary = properties[0] ?? null
  const place = primary ? PLACE_CONTENT[primary.slug] : undefined
  const firstWa = properties.find((p) => p?.contact_wa)?.contact_wa ?? null
  const waHref = firstWa ? `https://wa.me/${firstWa.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi! I'd like to book "${program.name}".`)}` : WA_DEFAULT
  const variants = program.program_variants.filter((v) => v.active).sort((a, b) => a.sort_order - b.sort_order)
  const days = variants.length ? Math.min(...variants.map((v) => v.duration_days)) : null
  const flag = primary?.country ? COUNTRY_FLAGS[primary.country] ?? "" : ""
  const placeParts = primary ? [primary.island, primary.country].filter(Boolean) as string[] : []
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : null
  const images = galleryImages.length ? galleryImages : program.hero_image_url ? [{ url: program.hero_image_url, alt: program.name }] : []
  const todo = whatYoullDo(program)
  const summary = enOnly(program.summary)
  const intro = enOnly(program.goal) ?? enOnly(program.how_we_achieve)

  const highlights = [
    primary ? { icon: "home_health", h: `Hosted by ${primary.name.trim()}`, t: "Your Dream Islands coordinator handles everything else" } : null,
    placeParts.length ? { icon: "location_on", h: placeParts.join(", "), t: place?.route ? place.route.stops.map((st) => st.name).join(" → ") : "Transfers planned with your coordinator" } : null,
    days ? { icon: "calendar_month", h: `${days} days`, t: shortLine(enOnly(program.how_we_achieve), 70) || "A day-by-day plan shared before the trip" } : null,
    { icon: "monitoring", h: "Measure what changed", t: "Your Wellness Journey before the trip and again after it" },
  ].filter((h): h is { icon: string; h: string; t: string } => !!h)

  const saveItem = { kind: "program" as const, id: program.id, title: program.name, href: `/programs/${program.slug}`, image: program.hero_image_url, meta: `${flag} ${placeParts[0] ?? ""}`.trim() }

  const started = confirmedBooking ? (
    <section className={s.started}>
      <div className={s.startedMain}>
        <span className={s.startedIcon}><Icon name="check" size={28} /></span>
        <h1 className="ds-display-s">Your journey has started.</h1>
        <p className="ds-body-l ds-muted" style={{ margin: 0 }}>
          <Facts items={["Deposit paid", `${fmtDate(confirmedBooking.arrival)} to ${fmtDate(confirmedBooking.departure)}`, `${confirmedBooking.pax} ${confirmedBooking.pax === 1 ? "guest" : "guests"}`]} />. Here is what happens next.
        </p>
        <div>
          <ListItem icon="forum" headline="1. A person confirms your dates" supporting="Your coordinator writes on WhatsApp within a day." />
          <ListItem icon="spa" headline="2. Take your Wellness Journey" supporting="2 minutes. The coordinator shapes the programme around your answers." />
          <ListItem icon="confirmation_number" headline="3. Tickets and transfer" supporting="Transfers and tickets are shared on WhatsApp." />
        </div>
        <div className={s.startedActions}>
          <ButtonLink href="/start" variant="filled" size="l">Start your Wellness Journey</ButtonLink>
          <ButtonLink href={waHref} variant="tonal" size="l" target="_blank" rel="noreferrer">Message your advisor</ButtonLink>
          <a href={icsHref(confirmedBooking, program.name)} download="dream-islands-booking.ics" className={s.textLink}><Icon name="calendar_add_on" size={18} />Add to calendar</a>
        </div>
      </div>
      <div className={s.trip}>
        <p className="ds-title-m" style={{ margin: 0 }}>{program.name}</p>
        <p className="ds-body-m ds-muted" style={{ margin: 0 }}><Facts items={[<span key="pl"><Flag of={primary?.country} /> {placeParts.join(", ")}</span>, `${fmtDate(confirmedBooking.arrival)} to ${fmtDate(confirmedBooking.departure)}`, `${confirmedBooking.pax} ${confirmedBooking.pax === 1 ? "guest" : "guests"}`]} /></p>
      </div>
    </section>
  ) : null

  return (
    <>
      {/* Mobile photo with buttons over it */}
      {/* Clips the content sheet while it unfolds past the screen edges (ds-unfold) */}
      <div className="ds-unfold">
      <MobilePhoto images={images} title={program.name} fallback={primary ? `/properties/${primary.slug}` : "/programs"} save={saveItem} />

      <div className={`ds-container-narrow ${s.page}`}>
        {started}

        {/* Desktop top: gallery + info */}
        <section className={s.top}>
          <div className={s.desktopOnly}><Gallery images={images} title={program.name} /></div>
          <div className={s.info}>
            {primary && <ButtonLink href={`/properties/${primary.slug}`} variant="text" className={s.crumb}>{primary.name.trim()}</ButtonLink>}
            <div className={s.titleRow}>
              <h1 className={s.title}>{program.name}</h1>
              <div className={s.titleActions}>
                <ShareButton title={program.name} />
                <SaveButton variant="inline" item={saveItem} />
              </div>
            </div>
            <p className={s.factsMobile}><Facts items={[placeParts.length ? <span key="pl"><Flag of={primary?.country} /> {placeParts.join(" | ")}</span> : null, cohort?.fullName]} /></p>
            <div className={s.stats}>
              {/* No reviews: no rating column (Oleg 07.11.2026) */}
              {avg ? <div><strong>{avg.toFixed(1)}</strong><span>{reviews.length} reviews</span></div> : null}
              {days && <div><strong>{days}</strong><span>days</span></div>}
              <div><strong>2</strong><span>check-ins</span></div>
            </div>
            {summary && <p className={s.summary}>{summary}</p>}
            <p className={s.facts}>
              <Facts items={[avg ? <span key="r" className={s.factRating}>★ {avg.toFixed(1)} ({reviews.length})</span> : "New", placeParts.length ? <span key="pl"><Flag of={primary?.country} /> {placeParts.join(", ")}</span> : null, days ? `${days} days` : null, cohort?.fullName]} />
            </p>
            <ButtonLink href="#reserve" replace variant="tonal" size="l" trailingIcon="arrow_forward" className={s.checkDates}>Check dates</ButtonLink>
            <div className={s.highlights}>
              <h2 className={s.mobileOnlyTitle}>What to expect</h2>
              <div className={s.sectionCard}>
                {highlights.map((h, i) => <ListItem key={h.h} icon={h.icon} hue={HUES[i % HUES.length]} headline={h.h} supporting={h.t} />)}
              </div>
            </div>
          </div>
        </section>

        <div className={s.body}>
          <div className={s.content}>
            {intro && <p className={s.lead}>{intro}</p>}

            {todo.length > 0 && (
              <div>
                <h2 className={s.h2}>What you&apos;ll do</h2>
                <div className={s.todo}>
                  {todo.map((t, i) => (
                    <div key={t.title} className={s.todoRow}>
                      <Photo src={images[i + 1]?.url ?? images[0]?.url ?? null} alt="" className={s.todoPhoto} sizes="176px" />
                      <div className={s.todoText}>
                        <span className="ds-title-m">{t.title}</span>
                        {t.text && <span className="ds-body-m ds-muted">{t.text}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Phone: the list and its buttons in one card (Oleg 07.11.2026); desktop: the buttons under the rows */}
                <div className={s.todoCard}>
                  <div className={s.todoList}>
                    {todo.map((t, i) => <ListItem key={t.title} icon={activityIcon(t)} hue={HUES[(i + 1) % HUES.length]} headline={t.title} supporting={t.text || undefined} />)}
                  </div>
                  <div className={s.ctaRow}>
                    <ButtonLink href="#reserve" replace variant="tonal" trailingIcon="arrow_forward">Check dates</ButtonLink>
                    <ButtonLink href={waHref} variant="tonal" target="_blank" rel="noreferrer" className={s.waBtn}><Brand.wa width={18} height={18} aria-hidden />Message on WhatsApp</ButtonLink>
                  </div>
                </div>
              </div>
            )}

            {accommodations.length > 0 && (
              <div>
                <h2 className={s.h2}>Where you stay</h2>
                {accommodations.map((a) => (
                  <ListItem key={a.id} card icon={a.has_pool ? "pool" : "bed"} headline={<span className={s.oneLine}>{enOnly(a.room_type) ?? a.room_type}</span>} supporting={<span className={s.roomFacts}><Facts items={[a.capacity ? `Up to ${a.capacity} ${a.capacity === 1 ? "guest" : "guests"}` : null, enOnly(a.description)]} /></span>} trailing={<ButtonLink href="#reserve" replace variant="tonal" trailingIcon="arrow_forward" aria-label="Check dates" className={s.roomCta}><span className={s.roomCtaText}>Check dates</span></ButtonLink>} />
                ))}
              </div>
            )}

            {/* No reviews yet: no section (the stats already say "New") */}
            {reviews.length > 0 && <Ratings reviews={reviews} />}

            {place?.hosts && (
              <div>
                <h2 className={s.h2}>Meet your hosts</h2>
                <div className={s.hosts}>
                  {place.hosts.map((h) => (
                    <div key={h.name} className={s.host}>
                      <span className={h.initials === "DI" ? s.hostAvatarAlt : s.hostAvatar}>{h.initials}</span>
                      <div className={s.hostText}>
                        <span className="ds-title-m">{h.name}</span>
                        <span className="ds-body-s ds-muted">{h.role}</span>
                        <span className="ds-body-m ds-ink">{h.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={s.hostList}>
                  {place.hosts.map((h) => <ListItem key={h.name} icon={h.initials === "DI" ? "support_agent" : "temple_buddhist"} headline={h.name} supporting={`${h.role}. ${h.text}`} />)}
                </div>
                <div style={{ marginTop: 16 }}><ButtonLink href={waHref} variant="tonal" target="_blank" rel="noreferrer" className={s.waBtn}><Brand.wa width={18} height={18} aria-hidden />Message on WhatsApp</ButtonLink></div>
              </div>
            )}

          </div>
          <BookingPanel
            programId={program.id}
            programName={program.name}
            propertyId={primary?.id}
            propertyName={primary?.name}
            country={primary?.country ?? undefined}
            placeLine={`${flag} ${placeParts.join(", ")}`.trim()}
            variants={variants.map((v) => ({ id: v.id, label: v.label, duration_days: v.duration_days, duration_nights: v.duration_nights, price_basic_usd: Number(v.price_basic_usd) || 0, checkout: v.price_basic_thb != null && Number(v.price_basic_thb) > 0 }))}
            waHref={waHref}
            supplierPrice={supplierPrice}
          />
        </div>

        {/* Below the booking: what to know, then how to get there, the last block before the related programmes */}
        <div className={s.after}>
            {(program.target_guest || primary?.country) && (
            <div>
              <h2 className={s.h2}>Things to know</h2>
              <div className={s.known}>
                {program.target_guest && <div className={s.knownCard}><Icon name="info" className={s.knownInfo} /><h3>Who it&apos;s for</h3><p>{shortLine(enOnly(program.target_guest), 140)}</p></div>}
                {primary?.country && <div className={s.knownCard}><Icon name="info" className={s.knownInfo} /><h3>Visa and language</h3><p>See the <a href={`/destinations/${countrySlug(primary.country)}`}>{primary.country} guide</a>. Your coordinator checks the rules for your dates.</p></div>}
              </div>
              <div className={`${s.knownList} ${s.sectionCard}`}>
                {program.target_guest && <ListItem icon="person" headline="Who it's for" supporting={shortLine(enOnly(program.target_guest), 140)} />}
                {primary?.country && <ListItem icon="badge" headline="Visa and language" supporting={`See the ${primary.country} guide. Your coordinator checks the rules for your dates.`} />}
              </div>
            </div>
          )}
            {place?.route && (
            <div>
              <h2 className={s.h2}>Getting there</h2>
              <Route stops={place.route.stops} />
              {place.route.note && <p className="ds-body-m ds-muted" style={{ margin: "12px 0 0" }}>{place.route.note}</p>}
            </div>
          )}
        </div>

        {related.length > 0 && (
          <section className={x.sectionLoose}>
            <p className={x.overline}>{primary ? `Same ${primary.island?.toLowerCase().includes("mountain") ? "mountain" : "place"}, other lengths` : "You may also like"}</p>
            <SectionHead titleClass={s.h2} className={s.relatedHead} title={primary ? `More at ${(primary.island ?? primary.name).split(",")[0].trim()}` : "Similar programmes"} action={<SeeAll href={primary ? `/properties/${primary.slug}` : "/programs"} count={related.length} />} />
            <div className={cs.rail}>
              {related.slice(0, 8).map((p) => <ProgramCard key={p.id} program={p} />)}
            </div>
          </section>
        )}

        <section className={`${x.sectionLoose} ${x.last}`}>
          <div className={s.notSure}>
            <Icon name="spa" />
            <div className={s.notSureText}>
              <h2 className="ds-title-l">Not sure this is the one?</h2>
              <p className="ds-body-m ds-muted">Take the Wellness Journey: 2 minutes, free, no sign-up to see results.</p>
            </div>
            <ButtonLink href="/start" variant="tonal" size="l">Take the Wellness Journey</ButtonLink>
          </div>
        </section>
        {/* Phones: the booking bar settles here as a card at the end of the page (BookingPanel) */}
        <div className={s.barDock} data-bar-dock />
      </div>
      </div>
    </>
  )
}
