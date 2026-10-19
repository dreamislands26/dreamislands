import Link from "next/link"
import { COUNTRY_FLAGS, COUNTRIES, countrySlug } from "../_lib/countries"
import { GOALS, money, type CatalogProgram, type CatalogProperty, type GuestReview, type Outcome } from "../_lib/catalog"
import { ButtonLink, Facts, Icon, SeeAll } from "../ds/ui"
import { JourneyPrompt, OutcomeTile, Photo, PlaceCard, ProgramCard, cardStyles as cs } from "../ds/cards"
import SearchBar from "../ds/SearchBar"
import x from "../ds/sections.module.css"
import h from "./home.module.css"
import HomeMobile from "./HomeMobile"
import HeroVideo from "../ds/HeroVideo"

const PHOTOS = "https://xbzrtofanbrahasxbisf.supabase.co/storage/v1/object/public/ecosystem/homepage/"
const THAILAND = PHOTOS + "dream-islands-tropical-sunset-wellness-travel-asia.png"
const WA = "https://wa.me/message/HOF2AFIBDYY5J1"

const GOAL_COPY: Record<string, { icon: string; hook: string }> = {
  reset: { icon: "spa", hook: "Reset & Recovery: rest, detox, sleep again." },
  performance: { icon: "directions_run", hook: "Performance: train smarter, rebuild capacity." },
  mind: { icon: "self_improvement", hook: "Mind Balance: calm the nervous system." },
  immersion: { icon: "landscape", hook: "Island Immersion: longer stays that change routine." },
  sport: { icon: "surfing", hook: "Sport & Chill: sport, recovery and leisure." },
}
const isMedical = (slug: string | null, name: string) => /medical|surgery|outpatient|bm-package/i.test(slug ?? "") || /medical|surgery|outpatient/i.test(name)
const HOME_GOAL_ORDER = ["reset", "performance", "mind", "immersion", "sport"]

const STEPS = [
  { icon: "spa", h: "Take your Wellness Journey", t: "23 short questions in about 2 minutes. You get a Wellness Score and matched programmes." },
  { icon: "travel_explore", h: "Travel the programme", t: "A real programme in a real place, planned with a person on WhatsApp." },
  { icon: "monitoring", h: "See what changed", t: "Take the Wellness Journey again after the trip and compare your Wellness Score." },
]

export default function HomeV2({ programs, tanya, tanyaPhotos, chinaImage, outcomes, properties, reviews }: { programs: CatalogProgram[]; tanya: CatalogProperty | null; tanyaPhotos: string[]; chinaImage: string | null; outcomes: Outcome[]; properties: CatalogProperty[]; reviews: GuestReview[] }) {
  const byCountry = COUNTRIES.map((c) => {
    const list = programs.filter((p) => p.country === c)
    const places = Array.from(new Set(list.map((p) => p.location.split(",")[0]).filter((x) => x && !/multi-city/i.test(x))))
    const min = list.length ? Math.min(...list.map((p) => p.minPrice).filter((n) => n > 0)) : 0
    return { c, list, places, min: Number.isFinite(min) ? min : 0, image: list.find((p) => p.hero_image_url)?.hero_image_url ?? null }
  })
  const big = byCountry.filter((r) => r.c === "Thailand" || r.c === "China")
  const rest = byCountry.filter((r) => r.c !== "Thailand" && r.c !== "China")
  const featured = programs.filter((p) => p.hero_image_url && !isMedical(p.slug, p.name)).slice(0, 8)
  const tanyaPrograms = tanya ? programs.filter((p) => p.propertyIds.includes(tanya.id)) : []
  const tanyaMin = tanyaPrograms.length ? Math.min(...tanyaPrograms.map((p) => p.minPrice).filter((n) => n > 0)) : 0

  return (
    <>
    <HomeMobile programs={programs} outcomes={outcomes} properties={properties} reviews={reviews} />
    <div className={`ds-container ${h.desktopOnly}`}>
      {/* Hero: 1280x560, radius 36, text inset 24 */}
      <section className={h.hero}>
        <HeroVideo src="/video/hero-jungle-desktop.mp4" poster="/video/hero-jungle-desktop.jpg" media="(min-width: 768px)" className={h.heroVideo} />
        <div className={h.heroShade} />
        <div className={h.heroBody}>
          <span className={h.heroKicker}>Outcome-driven wellness travel in Asia</span>
          <h1 className="ds-display-l">Feel different when you come back.</h1>
          <p className={h.heroLead}>Take a 2-minute Wellness Journey, get matched with a programme, and see your Wellness Score change after the trip.</p>
          <SearchBar countries={COUNTRIES} wide />
        </div>
      </section>

      <div>
        <section className={h.promptSection}>
          <JourneyPrompt title="Not sure where to start?" sub="Your Wellness Journey: 23 short questions, about 2 minutes. We match programmes to your result." cta="Start your Wellness Journey" />
        </section>

        {/* Tracks */}
        <section className={x.sectionLoose} id="outcomes">
          <div className={h.head}>
            <p className={h.overline}>Five tracks</p>
            <h2 className="ds-headline-l">What do you want to change?</h2>
          </div>
          <div className={h.tiles}>
            {HOME_GOAL_ORDER.map((k) => {
              const g = GOALS.find((x) => x.key === k)!
              const n = programs.filter((p) => p.cohort === g.cohort).length
              return <OutcomeTile key={k} icon={GOAL_COPY[k].icon} title={g.chip} hook={GOAL_COPY[k].hook} count={`${n} ${n === 1 ? "programme" : "programmes"}`} href={`/programs?track=${g.track}`} />
            })}
          </div>
        </section>

        {/* How it works */}
        <section className={x.sectionLoose} id="how-it-works">
          <div className={h.head}>
            <p className={h.overline}>How Dream Islands works</p>
            <h2 className="ds-headline-l">Before. During. After.</h2>
          </div>
          <div className={h.steps}>
            {STEPS.map((st, i) => (
              <div key={st.h} className={h.step}>
                <div className={h.stepArt} aria-hidden><Icon name={st.icon} /></div>
                <p className="ds-display-s">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="ds-title-l">{st.h}</h3>
                <p className="ds-body-l">{st.t}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Programs */}
        <section className={x.sectionLoose}>
          <div className={h.headRow}>
            <div className={h.head}>
              <p className={h.overline}><Facts items={["Real programmes", String(programs.length)]} /></p>
              <h2 className="ds-headline-l">Programmes built around real outcomes</h2>
            </div>
            <SeeAll href="/programs" />
          </div>
          <div className={cs.rail}>
            {featured.map((p, i) => <ProgramCard key={p.id} program={p} priority={i < 2} />)}
          </div>
        </section>

        {/* Destinations */}
        <section className={x.sectionLoose}>
          <div className={h.headRow}>
            <div className={h.head}>
              <p className={h.overline}>{COUNTRIES.length} countries</p>
              <h2 className="ds-headline-l">Where you&apos;ll go</h2>
            </div>
            <SeeAll href="/destinations" />
          </div>
          <div className={h.big}>
            {big.map((r) => (
              <PlaceCard
                key={r.c}
                id={`country-${r.c}`}
                href={`/destinations/${countrySlug(r.c)}`}
                name={r.c}
                image={r.c === "Thailand" ? THAILAND : chinaImage ?? r.image}
                region={<Facts items={[r.places.slice(0, 4).join(", "), r.c === "Thailand" ? "Tanya Samui, our flagship since 2009" : "Daoist mountains and hot springs"]} />}
                from={r.min ? `from ${money(r.min)}` : null}
                count={`${r.list.length} programmes`}
              />
            ))}
          </div>
        </section>

        <section className={x.sectionLoose}>
          <div className={h.head}>
            <p className={h.overline}>Five more countries</p>
            <h2 className="ds-headline-l">Beyond Thailand and China</h2>
          </div>
          <div className={h.countries}>
            {rest.map((r) => (
              <Link key={r.c} href={`/destinations/${countrySlug(r.c)}`} className={h.country}>
                <span className={h.flag} aria-hidden>{COUNTRY_FLAGS[r.c]}</span>
                <span className="ds-title-l">{r.c}</span>
                <span className="ds-body-m ds-muted">
                  <Facts items={[r.places.slice(0, 2).join(", "), r.list.length ? `${r.list.length} ${r.list.length === 1 ? "programme" : "programmes"}` : null]} />
                </span>
                {r.list.length === 0 && <span className={h.soon}>Coming soon</span>}
              </Link>
            ))}
          </div>
        </section>

        {/* Flagship */}
        {tanya && (
          <section className={x.sectionLoose}>
            <div className={h.flagship}>
              {tanyaPhotos.length >= 3 ? (
                <div className={h.mosaic}>
                  <Photo src={tanyaPhotos[0]} alt="Tanya Samui" sizes="(max-width: 900px) 100vw, 600px" />
                  <Photo src={tanyaPhotos[1]} alt="" sizes="300px" />
                  <Photo src={tanyaPhotos[2]} alt="" sizes="300px" />
                </div>
              ) : (
                <Photo src={tanyaPhotos[0] ?? tanya.image_url} alt="Tanya Samui" style={{ aspectRatio: "4 / 3" }} />
              )}
              <div className={h.flagText}>
                <p className={h.overline}><Facts items={["Our flagship", "Koh Samui, Thailand"]} /></p>
                <h2 className="ds-display-s">Tanya Samui</h2>
                <p className="ds-body-l">An oasis of health and longevity on Koh Samui since 2009. Three spaces, one protocol: the holistic retreat, a wellness center and a preventive medicine clinic.</p>
                <div className={h.stats}>
                  <div className={h.stat}><strong>{tanyaPrograms.length || 6}</strong><span>programmes</span></div>
                  <div className={h.stat}><strong>2009</strong><span>opened</span></div>
                  {tanyaMin > 0 && Number.isFinite(tanyaMin) && <div className={h.stat}><strong>{money(tanyaMin)}</strong><span>from, per person</span></div>}
                </div>
                <div className={h.flagCta}><ButtonLink href="/tanya-samui" variant="tonal" trailingIcon="arrow_forward">Explore Tanya Samui</ButtonLink></div>
              </div>
            </div>
          </section>
        )}

        {/* Promise */}
        <section className={`${x.sectionLoose} ${x.last}`}>
          <div className={`${x.promise} ${h.promise}`}>
            <Icon name="spa" />
            <h2 className="ds-headline-l">No guesswork. A clear baseline, a matched stay, a measurable shift.</h2>
            <div className={x.promiseActions}>
              <ButtonLink href="/start" variant="filled" size="l">Start your Wellness Journey</ButtonLink>
              <ButtonLink href={WA} variant="tonal" size="l" target="_blank" rel="noreferrer">Message us</ButtonLink>
            </div>
            <span className={x.promiseNote}><Facts items={["Your Wellness Journey", "about 2 minutes", "free"]} /></span>
          </div>
        </section>
      </div>
    </div>
    </>
  )
}
