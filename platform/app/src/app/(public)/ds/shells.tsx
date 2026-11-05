// Page shells: the real layout of a page that is still loading, with skeletons only where its data
// goes (ds/PageTransition). What is fixed on the page (headings, button labels, search, track chips)
// and what the clicked card already showed (title, resort, price) appear at once. Photos stay
// skeletons: the card photo is not the first photo of the page's gallery, and a photo swapping on
// load looks like a glitch. Shells reuse
// the pages' own CSS modules, so a layout change on a page carries over; a new section on a page
// only needs adding here if it should show while loading. The shell is inert: nothing in it reacts.
import type { ReactNode } from "react"
import type { Preview } from "@/lib/nav-pending"
import { COUNTRIES } from "../_lib/countries"
import { COHORT_LABELS, TRACK_ICONS } from "../_lib/programMapping"
import { ButtonLink, Chip, Icon, IconButton, ListItem, SectionHead, Skeleton, cx } from "./ui"
import { JourneyPrompt, cardStyles as cs } from "./cards"
import { CardsSkeleton } from "./skeletons"
import Flag from "./Flag"
import SearchBar from "./SearchBar"
import FilterMenus, { type FilterMenu } from "../programs/FilterMenus"
import cardCss from "./cards.module.css"
import mp from "./mobilePhoto.module.css"
import g from "./gallery.module.css"
import x from "./sections.module.css"
import pr from "../programs/[slug]/program.module.css"
import pl from "../properties/[slug]/place.module.css"
import c from "../programs/catalog.module.css"
import ms from "../programs/mobileSearch.module.css"
import rs from "../programs/resultsSheet.module.css"
import sk from "./skeletons.module.css"
import s from "./shells.module.css"

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className={sk.screen} role="status" aria-busy="true" inert>
      <span className="ds-visually-hidden">Loading</span>
      {children}
    </div>
  )
}

/** Mobile: full-bleed photo with back / share / save over it (ds/MobilePhoto). */
function MobilePhoto() {
  return (
    <div className={mp.mPhoto}>
      <Skeleton shape="block" className={cx(s.fill, s.mobilePhoto)} />
      <div className={mp.mPhotoBar}>
        <IconButton icon="arrow_back" label="Back" variant="photo" />
        <div className={mp.mPhotoActions}>
          <IconButton icon="ios_share" label="Share" variant="photo" />
          <IconButton icon="favorite" label="Save" variant="photo" />
        </div>
      </div>
    </div>
  )
}

/** Desktop gallery (ds/Gallery): its grid of photos. */
function Gallery() {
  return (
    <div className={g.wrap}>
      <div className={g.grid}>
        {[0, 1, 2, 3].map((i) => <div key={i} className={g.cell}><Skeleton shape="block" className={s.fill} /></div>)}
      </div>
    </div>
  )
}

function TitleActions({ className }: { className: string }) {
  return (
    <div className={className}>
      <IconButton icon="ios_share" label="Share" />
      <span className={cardCss.saveInline}><Icon name="favorite" />Save</span>
    </div>
  )
}

function Title({ text, className }: { text?: string; className: string }) {
  return text ? <h1 className={className}>{text}</h1> : <Skeleton className={s.title} />
}

const lines = (n: number, last = s.w60) => Array.from({ length: n }, (_, i) => <Skeleton key={i} className={i === n - 1 ? last : undefined} />)
const Lines = ({ n, last }: { n: number; last?: string }) => <div className={s.lines}>{lines(n, last)}</div>
const SkItem = ({ icon }: { icon: string }) => <ListItem icon={icon} headline={<Skeleton className={s.itemHead} />} supporting={<Skeleton className={s.itemSub} />} />

/** Programme page (programs/[slug]/ProgramView + BookingPanel). */
export function ProgramShell({ preview: p }: { preview?: Preview }) {
  const price = p?.price
  return (
    <Shell>
      <MobilePhoto />
      <div className={`ds-container-narrow ${pr.page}`}>
        <section className={pr.top}>
          <div className={pr.desktopOnly}><Gallery /></div>
          <div className={pr.info}>
            {/* The card names the resort, the page links to it above the title; a country is no resort */}
            {p?.place && !COUNTRIES.includes(p.place) ? <ButtonLink href="#" variant="text" className={pr.crumb}>{p.place}</ButtonLink> : <Skeleton className={cx(s.crumb, s.desktopOnly)} />}
            <div className={pr.titleRow}>
              <Title text={p?.title} className={pr.title} />
              <TitleActions className={pr.titleActions} />
            </div>
            <p className={pr.factsMobile}><Skeleton className={s.center} /></p>
            <div className={pr.stats}>
              <div><strong><Skeleton className={s.stat} /></strong><span>reviews</span></div>
              <div><strong><Skeleton className={s.stat} /></strong><span>days</span></div>
              <div><strong>2</strong><span>check-ins</span></div>
            </div>
            <Lines n={3} />
            <p className={pr.facts}><Skeleton className={s.w60} /></p>
            <ButtonLink href="#reserve" variant="tonal" size="l" className={pr.checkDates}>Check dates</ButtonLink>
            <div className={pr.highlights}>
              <h2 className={pr.mobileOnlyTitle}>What to expect</h2>
              <SkItem icon="home_health" />
              <SkItem icon="location_on" />
              <SkItem icon="calendar_month" />
              <ListItem icon="monitoring" headline="Measure what changed" supporting="Your Wellness Journey before the trip and again after it" />
            </div>
          </div>
        </section>

        <div className={pr.body}>
          <div className={pr.content}>
            <Lines n={4} />
            <div>
              <Skeleton className={s.h2} />
              <SkItem icon="self_improvement" />
              <SkItem icon="self_improvement" />
              <SkItem icon="self_improvement" />
            </div>
          </div>
          <aside className={pr.aside}>
            <div className={pr.pill}><Skeleton className={s.w80} /></div>
            <div className={pr.card}>
              <div className={pr.priceRow}>
                {price ? <span className="ds-headline-s">{price.replace(/^from/, "From")}</span> : <Skeleton className={s.price} />}
                <Skeleton className={cx(s.w45, s.small)} />
              </div>
              <div className={s.slots}>
                <span className="ds-label-m ds-muted">Upcoming departures</span>
                {[0, 1, 2].map((i) => <Skeleton key={i} shape="block" className={s.slot} />)}
              </div>
              <Skeleton shape="block" className={s.button} />
            </div>
          </aside>
        </div>
      </div>
      <div className={pr.barSpacer} aria-hidden />
      <div className={pr.bar}>
        <div className={pr.barPrice}>
          <span className={pr.barTop}>{price ? <strong>{price}</strong> : <Skeleton className={s.price} />}</span>
          <Skeleton className={cx(s.barSub, s.small)} />
        </div>
        <Skeleton shape="block" className={s.barButton} />
      </div>
    </Shell>
  )
}

/** Place page (properties/[slug]). */
export function PlaceShell({ preview: p }: { preview?: Preview }) {
  return (
    <Shell>
      <MobilePhoto />
      <div className={`ds-container-narrow ${pl.page}`}>
        <section className={pl.top}>
          <div className={pl.desktopOnly}><Gallery /></div>
          <div className={pl.summary}>
            <Skeleton className={cx(s.crumb, s.desktopOnly)} />
            <div className={pl.titleRow}>
              <Title text={p?.title} className={pl.title} />
              <TitleActions className={pl.titleActions} />
            </div>
            <p className={pl.factsMobile}><Skeleton className={s.center} /></p>
            <div className={pl.stats}>
              <div><strong><Skeleton className={s.stat} /></strong><span>programmes</span></div>
              <div><strong><Skeleton className={s.stat} /></strong><span>days</span></div>
              <div><strong><Skeleton className={s.stat} /></strong><span>from</span></div>
            </div>
            <Lines n={3} />
            <p className={pl.facts}><Skeleton className={s.w60} /></p>
            <div className={pl.highlights}>
              <SkItem icon="home_health" />
              <SkItem icon="location_on" />
              <SkItem icon="calendar_month" />
            </div>
            <Skeleton shape="block" className={cx(s.button, s.cta, pl.cta)} />
          </div>
        </section>
        <section className={x.sectionLoose}>
          <Skeleton className={s.h2} />
          <CardsSkeleton className={cs.rail} count={5} />
        </section>
      </div>
    </Shell>
  )
}

/** Country page (destinations/[country]): the name comes from the address. */
export function CountryShell({ country }: { country: string }) {
  return (
    <Shell>
      <div className="ds-container-wide">
        <section className={x.hero}>
          <Skeleton shape="block" className={cx(x.heroImg, s.heroImg)} />
          <div className={x.heroShade} />
          <div className={x.heroBody}>
            <span className={x.heroKicker}>{country}</span>
            <h1 className="ds-display-m">Wellness in {country}</h1>
            <div className={s.heroLines}>{lines(2)}</div>
          </div>
        </section>
        <div className="ds-container" style={{ padding: 0 }}>
          <section className={x.section}>
            <p className={`${x.overline} ${x.mobileHide}`}>Start from the goal</p>
            <h2 className={`ds-headline-m ${x.mobileHide}`} style={{ margin: 0 }}>What do you want from this trip?</h2>
            <div className={x.chips}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} shape="block" className={s.chip} />)}</div>
            <JourneyPrompt sub="Take your Wellness Journey: 2 minutes, your answer carries over." cta="Take the Wellness Journey" />
          </section>
          {[0, 1].map((i) => (
            <section key={i} className={x.section}>
              <p className={x.overline}><Skeleton className={s.overline} /></p>
              <SectionHead title={<Skeleton className={s.h2} />} />
              <CardsSkeleton className={cs.rail} count={5} />
            </section>
          ))}
        </div>
      </div>
    </Shell>
  )
}

const TRACKS = [1, 2, 3, 4, 7].map((n) => COHORT_LABELS[n])
const MENUS: FilterMenu[] = ["Goal", "Duration", "Price", "Country"].map((label) => ({ key: label, label, options: [] }))

/** Catalogue (programs/page): search, track chips and filters as they are; the count and cards load. */
export function CatalogShell({ search }: { search: string }) {
  const track = new URLSearchParams(search).get("track")
  return (
    <Shell>
      {/* Mobile: map under the search bar, results sheet over it */}
      <div className={c.mobile}>
        <div className={c.map}><Skeleton shape="block" className={s.map} /></div>
        <div className={ms.top}>
          <div className={ms.bar}>
            <IconButton icon="arrow_back" label="Back" className={ms.round} />
            <div className={ms.pill}>
              <Icon name="search" />
              <input type="search" placeholder="What do you want to improve?" aria-label="Find your programme" readOnly tabIndex={-1} />
            </div>
            <span className={ms.tuneWrap}><IconButton icon="tune" label="Filters" className={ms.round} /></span>
          </div>
          <div className={ms.chips}>
            <Chip selected={!track}>All</Chip>
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} shape="block" className={s.chip} />)}
          </div>
        </div>
        <div className={rs.sheet}>
          <div className={rs.head}>
            <span className={rs.handle} aria-hidden />
            <div className={ms.resultsHead}><Skeleton className={s.count} /></div>
          </div>
          <div className={rs.list}><CardsSkeleton className={c.list} count={2} wide /></div>
        </div>
      </div>

      <div className={`ds-container ${c.desktop}`}>
        <header className={x.pageHead} style={{ maxWidth: "none" }}>
          <p className={x.overline} style={{ margin: 0 }}><Skeleton className={s.overline} /></p>
          <h1 className="ds-display-s">Find your programme</h1>
          <div className={c.searchDesktop}><SearchBar countries={COUNTRIES} outcomes={[]} loading /></div>
        </header>
        <div className={c.filters}>
          <div className={c.row}>
            <Chip selected={!track}>All tracks</Chip>
            {TRACKS.map((t) => <Chip key={t.name} icon={TRACK_ICONS[t.name] ?? true} selected={track === t.name}>{t.fullName}</Chip>)}
          </div>
          <FilterMenus menus={MENUS} />
        </div>
        <p className={c.count}><Skeleton className={s.count} /></p>
        <CardsSkeleton className={cs.gridCards} count={8} />
      </div>
    </Shell>
  )
}
