// S1 · Главная · Mobile (Figma 150:24912, revision 18.10.2026). Own layout, not a squeezed desktop.
import { goalIcon, homeRoutes, routeHref, routeMatch } from "../_lib/routes"
import Link from "next/link"
import { COUNTRIES, countrySlug } from "../_lib/countries"
import { outcomeLabel, type CatalogProgram, type CatalogProperty, type GuestReview, type Outcome } from "../_lib/catalog"
import { ButtonLink, Facts, Icon, Stars } from "../ds/ui"
import { Photo, ProgramCard } from "../ds/cards"
import HomeMobileHeader, { HERO_ID, LoadMore } from "./HomeMobileHeader"
import PullRail from "./PullRail"
import HeroVideo from "../ds/HeroVideo"
import m from "./homeMobile.module.css"
import Flag from "../ds/Flag"

const WA = "https://wa.me/message/HOF2AFIBDYY5J1"
const SUB = "Good places for your body and mind"


/** Before / During / After (Figma 150:25609). */
const PHASES = [
  { icon: "monitoring", h: "Before", sub: "Measure & Match", t: "Understand current state, desired change and appropriate programme, get access to personal statistics" },
  { icon: "travel_explore", h: "During", sub: "Programme, Place, Practices", t: "Travel into a structured programme designed around the selected outcome" },
  { icon: "insights", h: "After", sub: "Measure again", t: "Understand what changed and what to continue" },
]

/** Chips come from the shared routes (_lib/routes.ts); `match` mirrors the catalog filter behind
 *  `href`, so the rails under the chips show exactly what the chip opens. */
type ChipItem = { label: string; icon: string; href: string; match: (p: CatalogProgram) => boolean }
function chipsFrom(outcomes: Outcome[], programs: CatalogProgram[]): ChipItem[] {
  return homeRoutes(outcomes, programs).map((r) => ({ label: r.label, icon: r.icon, href: routeHref(r), match: routeMatch(r) }))
}

/** Arrow from the DS (Figma 150:24796). */
function Arrow() {
  return (
    <svg style={{ width: "0.6875rem", height: "0.75rem" }} viewBox="0 0 11 12" fill="none" aria-hidden>
      <path opacity="0.8" d="M0 6.89189V5.12432H8.34429L4.22714 1.23243L5.40571 0L11 5.43243V6.56757L5.40571 12L4.21143 10.7514L8.31286 6.89189H0Z" fill="currentColor" />
    </svg>
  )
}

const isMedical = (p: CatalogProgram) => /medical|surgery|outpatient|bm-package/i.test(p.slug ?? "") || /medical|surgery|outpatient/i.test(p.name)

function Head({ title, sub, href, seeAll }: { title: string; sub?: string; href?: string; seeAll?: boolean }) {
  return (
    <div className={m.head}>
      <div className={m.headText}>
        <h2 className="ds-headline-s">{title}</h2>
        {sub && <p className="ds-overline ds-muted">{sub}</p>}
      </div>
      {href && (seeAll
        ? <Link href={href} className={m.seeAll}>See All <Arrow /></Link>
        : <Link href={href} className={m.go} aria-label={`${title}: see all`}><Arrow /></Link>)}
    </div>
  )
}

function Rail({ list, href }: { list: CatalogProgram[]; href: string }) {
  return (
    <PullRail href={href}>
      {list.map((p, i) => <div key={p.id} className={m.card}><ProgramCard program={p} priority={i < 2} /></div>)}
    </PullRail>
  )
}

export default function HomeMobile({ programs, outcomes, properties, reviews }: { programs: CatalogProgram[]; outcomes: Outcome[]; properties: CatalogProperty[]; reviews: GuestReview[] }) {
  const wellness = programs.filter((p) => !isMedical(p))
  const withImg = wellness.filter((p) => p.hero_image_url)
  const chips = chipsFrom(outcomes, wellness)
  // The three program rails follow the first three chips, in order (Oleg, 18.10.2026).
  const rails = chips.slice(0, 3).map((c) => ({ ...c, list: withImg.filter(c.match).slice(0, 8) })).filter((r) => r.list.length > 0)
  const countries = COUNTRIES.map((c) => {
    const list = programs.filter((p) => p.country === c)
    const places = Array.from(new Set(list.map((p) => p.location.split(",")[0]).filter((x) => x && !/multi-city/i.test(x))))
    const min = list.length ? Math.min(...list.map((p) => p.minPrice).filter((n) => n > 0)) : 0
    return { c, list, places, min: Number.isFinite(min) ? min : 0, image: list.find((p) => p.hero_image_url)?.hero_image_url ?? null }
  })
  const rest = countries.filter((r) => r.c !== "Thailand" && r.c !== "China")
  // Goal tiles: the curated goals that have programs, in taxonomy order.
  const goalList = outcomes.map((o) => ({ ...o, n: wellness.filter((p) => p.outcomes.includes(o.slug)).length })).filter((o) => o.n > 0)
  // Two rows in one scroller (column flow): interleave so the top row reads 1, 2, 3, 4 and the bottom continues.
  const half = Math.ceil(goalList.length / 2)
  const goals = Array.from({ length: half }, (_, i) => [goalList[i], goalList[half + i]]).flat().filter((g): g is (typeof goalList)[number] => !!g)
  // China block: wellness properties, partner hospitals and programs, all from the catalog.
  const cn = {
    destinations: properties.filter((p) => p.country === "China" && p.entity_type === "wellness_property").length,
    hospitals: properties.filter((p) => p.country === "China" && p.entity_type === "hospital_clinic").length,
    programs: programs.filter((p) => p.country === "China").length,
    list: withImg.filter((p) => p.country === "China").slice(0, 8),
  }
  const stories = [...reviews].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 8)

  return (
    <div className={m.root}>
      <HomeMobileHeader />

      {/* Hero: full-bleed under the fixed header, rounded bottom 48 */}
      <section className={m.hero} id={HERO_ID}>
        <HeroVideo src="/video/hero-jungle-mobile.mp4" poster="/video/hero-jungle-mobile.jpg" media="(max-width: 767px)" className={m.heroVideo} />
        <div className={m.heroShade} />
        <div className={m.heroBody}>
          <div className={m.heroText}>
            <h1 className="ds-headline-l">Find your programme</h1>
            <p className="ds-body-m">Take a 2 min survey to find personal programme<br />and get health insights</p>
          </div>
          <Link href="/start" className={m.heroCta}>Take Survey <span className={m.heroCtaTag}>2 min</span></Link>
        </div>
      </section>

      {/* Search + goal chips: sticky under the header */}
      <div className={m.search}>
        <Link href="/programs" className={m.searchBtn} aria-label="Search programmes"><Icon name="search" size={20} /></Link>
        <div className={m.chips}>
          {chips.map((c) => (
            <Link key={c.label} href={c.href} className={m.chip}>
              <span className={m.chipDot} aria-hidden><Icon name={c.icon} /></span>
              <span className="ds-label-l">{c.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Track your progress: Before / During / After (Figma 150:25681) */}
      <section className={m.intro} style={{ paddingTop: "2.25rem", textAlign: "center" }}>
        <h2 className="ds-headline-m">Track your progress</h2>
      </section>
      {PHASES.map((ph) => (
        <section key={ph.h} className={m.phase}>
          <div className={m.phaseArt} aria-hidden><Icon name={ph.icon} /></div>
          <div className={m.phaseText}>
            <h3 className="ds-headline-s">{ph.h}</h3>
            <p className={m.phaseSub}>{ph.sub}</p>
            <p className="ds-title-m">{ph.t}</p>
          </div>
        </section>
      ))}
      <div className={m.surveyRow}>
        <Link href="/start" className={m.surveyBig}>Take Survey <span className={m.surveyTag}>2 min</span></Link>
      </div>

      {/* Goals: both rows scroll together as one block */}
      <section className={m.section} style={{ paddingTop: "2.25rem" }}>
        <h2 className="ds-headline-m">What do you want to change?</h2>
        <div className={m.tiles}>
          {goals.map((g) => (
            <Link key={g.slug} href={`/programs?goal=${g.slug}`} className={m.tile}>
              <span className={m.tileTitle}>{outcomeLabel(g)}</span>
              <span className={m.tileHook}>{g.hook}</span>
              <Icon name={goalIcon(g.slug)} className={m.tileIcon} />
              <span className={m.tileGo} aria-hidden><Arrow /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* Personal Experience: profile and matched programs (Figma 197:26111, 197:26097) */}
      <section className={m.section} style={{ gap: "1.25rem" }}>
        <h2 className="ds-headline-m">Personal Experience</h2>
        <div className={m.promise}>
          <div className={m.promiseText}>
            <h3 className="ds-headline-l">Wellness Profile</h3>
            <p className={m.promiseBody}>Access your wellness statistics in the app. Connect health trackers, take additional surveys.</p>
          </div>
          <div className={m.promiseActions}>
            <Link href="/profile" className={m.promiseGreen}>Create Profile</Link>
          </div>
        </div>
      </section>
      <section className={m.section}>
        <div className={`${m.promise} ${m.promiseTight}`}>
          <div className={m.promiseText}>
            <h3 className="ds-headline-l">Programmes for you</h3>
            <p className={m.promiseBody}>Take a 2 min survey to find personal programme and get health insights. Or message us to get a personal consultation.</p>
          </div>
          <span className="ds-body-s ds-muted">Time: 2 minutes</span>
          <div className={m.promiseActions}>
            <Link href="/start" className={`${m.promiseGreen} ${m.glow}`}>Take Survey</Link>
            <a href={WA} className={m.promiseTonal} target="_blank" rel="noreferrer">Contact a Specialist</a>
          </div>
        </div>
      </section>

      {/* Programs: rails follow the first three chips */}
      <section className={m.intro} style={{ paddingTop: "3rem" }}>
        <h2 className="ds-headline-m">Programmes built<br />around real outcomes</h2>
      </section>
      {rails.map((r) => (
        <section key={r.label} className={m.section} style={{ paddingTop: "2.25rem" }}>
          <Head title={r.label} sub={SUB} href={r.href} />
          <Rail list={r.list} href={r.href} />
        </section>
      ))}

      {/* China: green card with a looping video on top (Figma 197:26223) */}
      {cn.programs > 0 && (
        <section className={m.cn}>
          <div className={m.cnCard}>
            <HeroVideo src="/video/china-zhangjiajie-mobile.mp4" poster="/video/china-zhangjiajie-mobile.jpg" media="(max-width: 767px)" className={m.cnVideo} />
            <div className={m.cnShade} />
            <div className={m.cnGreen} />
            <div className={m.cnText}>
              <div>
                <p className={m.cnKicker}>A core destination</p>
                <h2 className="ds-display-m">Explore China</h2>
              </div>
              <p className={m.cnStats}>
                {[`${cn.programs} programmes`, cn.hospitals > 0 && `${cn.hospitals} partner hospitals`, cn.destinations > 0 && `${cn.destinations} destinations`]
                  .filter(Boolean)
                  .map((t, i) => <span key={i}>{t}</span>)}
              </p>
            </div>
            <div className={m.cnRow}>
              {cn.list.map((p) => (
                <Link key={p.id} href={p.slug ? `/programs/${p.slug}` : "/programs"} className={m.mini}>
                  <Photo src={p.hero_image_url} alt={p.name} className={m.miniPhoto} sizes="64px" />
                  <span className={m.miniText}>
                    <span className={m.miniTitle}>{p.name}</span>
                    <span className={m.miniLine}>
                      <span className={m.miniEllipsis}>{p.flag ? <><Flag of={p.flag} />{" "}</> : null}{p.place?.[0] ?? p.country}</span>
                      {p.rating ? <><i className={m.miniDot} aria-hidden /><span className={m.miniStar} aria-hidden>★</span>{p.rating.toFixed(1)}</> : null}
                    </span>
                    <span className={m.miniLine}>{p.price}<i className={m.miniDot} aria-hidden />{p.duration}</span>
                  </span>
                </Link>
              ))}
            </div>
            <div className={m.cnActions}>
              <Link href={`/destinations/${countrySlug("China")}`} className={m.cnExplore}>Explore <Icon name="arrow_forward" size={20} /></Link>
              <a href={WA} className={m.cnContact} target="_blank" rel="noreferrer">Contact Specialist</a>
            </div>
          </div>
        </section>
      )}

      {/* Other destinations */}
      <section className={m.section}>
        <Head title="Other Destinations" href="/destinations" />
        <PullRail href="/destinations" photo={112} gap={8}>
          {rest.map((r) => (
            <Link key={r.c} href={`/destinations/${countrySlug(r.c)}`} className={m.country}>
              <Photo src={r.image} alt={r.c} className={m.countryPhoto} sizes="112px" />
              <span className={m.countryText}>
                <span className="ds-title-l">{r.c}</span>
                <span className="ds-body-m ds-muted">{r.places.slice(0, 2).join(", ") || "Coming soon"}</span>
              </span>
            </Link>
          ))}
        </PullRail>
      </section>

      {/* Our stories: guest reviews */}
      {stories.length > 0 && (
        <section className={m.section}>
          <Head title="Our stories" />
          <PullRail href="/reviews" photo={208} gap={8}>
            {stories.map((r) => (
              <article key={r.id} className={m.story}>
                <Stars value={r.rating} />
                <p className={m.storyText}>&ldquo;{r.text}&rdquo;</p>
                <div className={m.storyWho}>
                  <span className="ds-title-s">{r.name}</span>
                  {r.meta && <span className={m.storyMeta}>{r.meta}</span>}
                </div>
              </article>
            ))}
          </PullRail>
          <Link href="/reviews" className={m.textBtn}>Read All Stories</Link>
        </section>
      )}

      {/* Not sure which one fits (Figma 214:30685) */}
      <section className={m.section} style={{ padding: "3rem 1.5rem 0" }}>
        <div className={`${m.promise} ${m.promiseTight}`} style={{ paddingBottom: "2rem" }}>
          <Icon name="spa" className={m.promiseIcon} />
          <h2 className="ds-headline-s">Not sure which one fits? Get matched in 2 minutes.</h2>
          <div className={m.promiseActions}>
            <Link href="/start" className={`${m.promiseGreen} ${m.glow}`} style={{ gap: "0.5rem" }}>Take Survey <span className={m.surveyTag}>2 min</span></Link>
            <a href={WA} className={m.promiseTonal} target="_blank" rel="noreferrer">Message us</a>
          </div>
          <p className="ds-body-s ds-muted" style={{ margin: 0 }}><Facts items={["Your Wellness Journey", "about 2 minutes", "free"]} /></p>
        </div>
      </section>

      <section className={m.section}>
        <Head title="See all programmes" sub={SUB} href="/programs" seeAll />
        <LoadMore
          nudges={[
            { label: "Take the Wellness Journey", href: "/start" },
            { label: "Find my programme", href: "/start" },
            { label: "Get your Wellness Score", href: "/start" },
            { label: "Ask us on WhatsApp", href: WA, external: true },
          ]}
          banner={
            <div className={m.decide}>
              <h2 className="ds-headline-l">Can&apos;t decide?</h2>
              <p className="ds-body-m">Take the 2-minute Wellness Journey and we&apos;ll match programmes to you.</p>
              <ButtonLink href="/start" variant="filled" size="l" block>Get Your Wellness Score</ButtonLink>
              <a href={WA} className={`${m.promiseTonal} ${m.onTonal}`} target="_blank" rel="noreferrer">Message us</a>
            </div>
          }
        >
          {wellness.map((p) => <ProgramCard key={p.id} program={p} />)}
        </LoadMore>
      </section>
    </div>
  )
}
