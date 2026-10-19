import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { COUNTRY_FLAGS, COUNTRIES, countrySlug } from "../../_lib/countries"
import { supabasePublic } from "@/lib/supabase-public"

// destination_countries is the source of truth for which countries exist and for their slugs (Stage 1).
async function countryFromDb(slug: string): Promise<string | null> {
  const { data } = await supabasePublic
    .from("destination_countries")
    .select("country")
    .eq("slug", slug.toLowerCase())
    .eq("active", true)
    .maybeSingle()
  return (data?.country as string | undefined) ?? null
}
import { dataLayerScript } from "../../_lib/track"
import { GOALS, dayRange, loadPrograms, loadProperties, money, shortLine, type CatalogProgram, type CatalogProperty } from "../../_lib/catalog"
import { Badge, ButtonLink, Chip, Facts, Icon, ListItem, SectionHead, SeeAll, UvpPill } from "../../ds/ui"
import { CountryCard, JourneyPrompt, Photo, PlaceCard, ProgramCard, cardStyles as cs } from "../../ds/cards"
import x from "../../ds/sections.module.css"
import { TRACK_ICONS } from "../../_lib/routes"

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country: slug } = await params
  const country = await countryFromDb(slug)
  if (country == null) return { title: "Destination not found" }
  const title = `Wellness in ${country}`
  const description = `Wellness programmes and places in ${country}, planned with a real person. Explore verified properties and programmes on Dream Islands.`
  return {
    title,
    description,
    alternates: { canonical: "/destinations/" + slug },
    openGraph: { title: title + " | Dream Islands", description, url: "https://dreamislands.org/destinations/" + slug },
  }
}

export const dynamic = "force-dynamic"

/** Country copy and UVPs. Countries without an entry get a generic line. */
const COUNTRY_COPY: Record<string, { lead: string; uvp?: { icon: string; label: string }[] }> = {
  China: {
    lead: "Daoist mountains, hot springs in Yunnan, tea forests and the Hainan coast. Programmes planned with a real person.",
    uvp: [
      { icon: "spa", label: "Traditional Chinese Medicine" },
      { icon: "medical_services", label: "Modern medicine" },
    ],
  },
  Thailand: { lead: "Island retreats on Koh Samui and Phuket: detox, sleep, Muay Thai and slow days by the sea." },
  Indonesia: { lead: "Bali's jungle and rice terraces: yoga, breathwork and quiet recovery." },
  Philippines: { lead: "Boracay and the islands: sea, movement and a proper rest." },
  Singapore: { lead: "Sentosa and the city: short, high-standard wellness stays." },
}

const GOOD_TO_KNOW = [
  { icon: "badge", h: "Visa", t: "Rules depend on your passport. Your coordinator checks them for your dates before you book." },
  { icon: "translate", h: "Language", t: "Shown on each programme. Where it is not listed yet, ask your coordinator before you request dates." },
  { icon: "flight_land", h: "Getting there", t: "Transfers from the nearest airport or rail station are planned with your coordinator." },
  { icon: "payments", h: "Deposit or no payment", t: "Confirmed departures take a deposit. Otherwise you pay only after a person confirms dates and price." },
]

const STEPS = [
  { icon: "travel_explore", h: "Pick a programme", t: "Browse by place, or take the 2-minute Wellness Journey and get programmes ranked by how well they fit." },
  { icon: "event_available", h: "Reserve or request dates", t: "Reserve with a deposit when the departure is confirmed, or request dates and pay nothing yet." },
  { icon: "forum", h: "Confirm with a person", t: "Your coordinator confirms the details on WhatsApp. After the trip you take the Wellness Journey again and see what changed." },
]

const WA_LINK = "https://wa.me/message/HOF2AFIBDYY5J1"

function placeStats(prop: CatalogProperty, programs: CatalogProgram[]) {
  const list = programs.filter((p) => p.propertyIds.includes(prop.id))
  const min = list.length ? Math.min(...list.map((p) => p.minPrice).filter((n) => n > 0)) : 0
  const dMin = list.length ? Math.min(...list.map((p) => p.minDays)) : 0
  const dMax = list.length ? Math.max(...list.map((p) => p.maxDays)) : 0
  return { count: list.length, min: Number.isFinite(min) ? min : 0, dMin, dMax, list }
}

export default async function DestinationCountryPage({ params, searchParams }: { params: Promise<{ country: string }>; searchParams: Promise<{ goal?: string }> }) {
  const { country: slug } = await params
  const { goal } = await searchParams
  const country = await countryFromDb(slug)
  if (country == null) notFound()

  const [allPrograms, allProperties, clinics] = await Promise.all([
    loadPrograms(),
    loadProperties(country),
    // Clinics (hospital_clinic) are a separate entity type: counted for the medical link, never listed as places
    supabasePublic.from("properties").select("id", { count: "exact", head: true }).eq("active", true).eq("entity_type", "hospital_clinic").eq("country", country),
  ])
  const properties = allProperties.filter((p) => p.entity_type === "wellness_property")
  const clinicCount = clinics.count ?? 0
  const programs = allPrograms.filter((p) => p.country === country)
  const copy = COUNTRY_COPY[country]

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Wellness in ${country}`,
    url: "https://dreamislands.org/destinations/" + slug,
    hasPart: [
      ...properties.map((p) => ({ "@type": "LodgingBusiness", name: p.name, url: "https://dreamislands.org/properties/" + p.slug })),
      ...programs.map((p) => ({ "@type": "Product", name: p.name, url: p.slug ? "https://dreamislands.org/programs/" + p.slug : undefined })),
    ],
  }
  const scripts = (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script dangerouslySetInnerHTML={{ __html: dataLayerScript("view_destination", { country, slug }) }} />
    </>
  )

  // Other countries that already host programs (for the empty state and cross-sell).
  const others = COUNTRIES.filter((c) => c !== country)
    .map((c) => {
      const list = allPrograms.filter((p) => p.country === c)
      const withImg = list.find((p) => p.hero_image_url)
      const places = Array.from(new Set(list.map((p) => p.location.split(",")[0]).filter(Boolean))).slice(0, 2)
      const min = list.length ? Math.min(...list.map((p) => p.minPrice).filter((n) => n > 0)) : 0
      return { c, count: list.length, image: withImg?.hero_image_url ?? null, places, min }
    })
    .filter((o) => o.count > 0)

  if (programs.length === 0) {
    return (
      <div className="ds-container">
        {scripts}
        <section className={x.empty}>
          <Badge icon="travel_explore" />
          <h1 className="ds-headline-l">No programmes in {country} yet</h1>
          <p className="ds-body-l ds-muted">We are preparing programmes in {country}. Message us and we will write when they open, or look at countries that already host programmes.</p>
          <div className={x.emptyActions}>
            <ButtonLink href={`${WA_LINK}`} variant="filled" size="l" target="_blank" rel="noreferrer">Notify me on WhatsApp</ButtonLink>
            <ButtonLink href="/start" variant="tonal" size="l">Take the Wellness Journey</ButtonLink>
          </div>
        </section>
        {others.length > 0 && (
          <section className={`${x.sectionLoose} ${x.last}`}>
            <div className={x.panel}>
              <SectionHead title="Other countries with programmes" sub={`${country} is on its way. These countries already host Dream Islands programmes.`} action={<SeeAll href="/destinations" label="See all countries" />} />
              <div className={`${cs.grid4} ${cs.railMobile}`}>
                {others.slice(0, 4).map((o) => (
                  <CountryCard
                    key={o.c}
                    href={"/destinations/" + countrySlug(o.c)}
                    name={o.c}
                    flag={COUNTRY_FLAGS[o.c]}
                    image={o.image}
                    meta={<Facts items={[o.places.join(", "), `${o.count} ${o.count === 1 ? "programme" : "programmes"}`]} />}
                    from={o.min ? `from ${money(o.min)}` : null}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    )
  }

  const placeRows = properties
    .map((p) => ({ p, s: placeStats(p, programs) }))
    .filter((r) => r.s.count > 0)
    .sort((a, b) => b.s.count - a.s.count)
  const flagship = placeRows[0]
  // Collage: the place photo first, then program photos, then other places.
  const collage = flagship
    ? [flagship.p.image_url, ...flagship.s.list.map((p) => p.hero_image_url), ...placeRows.slice(1).map((r) => r.p.image_url)].filter((u): u is string => !!u)
    : []
  const heroImage = flagship?.p.image_url || programs.find((p) => p.hero_image_url)?.hero_image_url || null
  const minPrice = Math.min(...programs.map((p) => p.minPrice).filter((n) => n > 0))
  const dMin = Math.min(...programs.map((p) => p.minDays))
  const dMax = Math.max(...programs.map((p) => p.maxDays))

  const activeGoal = GOALS.find((g) => g.key === goal)
  const rails = GOALS.map((g) => ({ g, list: programs.filter((p) => p.cohort === g.cohort) })).filter((r) => r.list.length > 0)
  const shownRails = activeGoal ? rails.filter((r) => r.g.key === activeGoal.key) : rails

  return (
    <div className="ds-container-wide">
      {scripts}

      {/* Hero */}
      <section className={x.hero}>
        <Photo src={heroImage} alt={`Wellness in ${country}`} className={x.heroImg} sizes="100vw" priority style={{ position: "absolute", inset: 0, borderRadius: 0 }} />
        <div className={x.heroShade} />
        <div className={x.heroBody}>
          <span className={x.heroKicker}>
            <Facts items={[country, `${programs.length} programmes`, placeRows.length ? `${placeRows.length} places` : null]} />
          </span>
          <h1 className="ds-display-m">Wellness in {country}</h1>
          <p className={x.heroLead}>{copy?.lead ?? `Wellness programmes in ${country}, planned with a real person.`}</p>
          <span className={x.heroFacts}>
            <Facts items={[dayRange(dMin, dMax), Number.isFinite(minPrice) ? `from ${money(minPrice)} per person` : null]} />
          </span>
          {copy?.uvp && (
            <div className={x.pills}>
              {copy.uvp.map((u) => (
                <UvpPill key={u.label} icon={u.icon}>{u.label}</UvpPill>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="ds-container" style={{ padding: 0 }}>
        {/* Goal entry */}
        <section className={x.section} id="programs">
          <p className={`${x.overline} ${x.mobileHide}`}>Start from the goal</p>
          <h2 className={`ds-headline-m ${x.mobileHide}`} style={{ margin: 0 }}>What do you want from this trip?</h2>
          <div className={x.chips}>
            {rails.map((r) => (
              <Chip key={r.g.key} icon={TRACK_ICONS[r.g.track] ?? true} selected={activeGoal?.key === r.g.key} href={activeGoal?.key === r.g.key ? `/destinations/${slug}#programs` : `/destinations/${slug}?goal=${r.g.key}#programs`}>
                {r.g.chip}
              </Chip>
            ))}
          </div>
          <JourneyPrompt sub="Take your Wellness Journey: 2 minutes, your answer carries over." cta="Take the Wellness Journey" />
        </section>

        {/* Rails per goal */}
        {shownRails.map(({ g, list }) => {
          const places = Array.from(new Set(list.map((p) => p.location.split(",")[0]).filter(Boolean))).slice(0, 3)
          return (
            <section key={g.key} className={x.section}>
              <p className={x.overline}>
                <Facts items={[list[0].trackFull, `${list.length} ${list.length === 1 ? "programme" : "programmes"}`, places.join(", ")]} />
              </p>
              <SectionHead title={g.title} action={<SeeAll href={`/programs?track=${g.track}&country=${country}`} count={list.length} />} />
              <div className={cs.rail}>
                {list.slice(0, 8).map((p, i) => (
                  <ProgramCard key={p.id} program={p} priority={i < 2 && g === shownRails[0].g} />
                ))}
              </div>
            </section>
          )
        })}

        {/* Where to go */}
        {placeRows.length > 0 && (
          <section className={x.sectionLoose}>
            <SectionHead title="Where to go" action={<SeeAll href="/properties" count={placeRows.length} />} />
            <div className={cs.grid3}>
              {placeRows.slice(0, 6).map(({ p, s }) => (
                <PlaceCard
                  key={p.id}
                  id={p.id}
                  href={"/properties/" + p.slug}
                  name={p.name}
                  image={p.image_url}
                  region={<Facts items={[p.island, shortLine(p.description, 48)]} />}
                  from={s.min ? `from ${money(s.min)}` : null}
                  count={`${s.count} ${s.count === 1 ? "programme" : "programmes"}${s.dMin ? `, ${dayRange(s.dMin, s.dMax)}` : ""}`}
                />
              ))}
            </div>
          </section>
        )}

        {/* How it works */}
        <section className={x.sectionLoose}>
          <p className={x.overline}>How it works</p>
          <h2 className="ds-headline-l" style={{ margin: "0 0 32px" }}>Before. During. After.</h2>
          <div className={x.steps}>
            {STEPS.map((st, i) => (
              <div key={st.h}>
                <div className={x.stepArt} aria-hidden><Icon name={st.icon} /></div>
                <p className={x.stepN}>{String(i + 1).padStart(2, "0")}</p>
                <h3 className={x.stepTitle}>{st.h}</h3>
                <p className={x.stepText}>{st.t}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Flagship place */}
        {flagship && (
          <section className={x.sectionLoose}>
            <div className={x.flagship}>
              {collage.length >= 3 ? (
                <div className={x.collage}>
                  <Photo src={collage[0]} alt={flagship.p.name} sizes="(max-width: 900px) 100vw, 600px" />
                  <Photo src={collage[1]} alt="" sizes="300px" />
                  <Photo src={collage[2]} alt="" sizes="300px" />
                </div>
              ) : (
                <Photo src={collage[0] ?? null} alt={flagship.p.name} sizes="(max-width: 900px) 100vw, 600px" style={{ aspectRatio: "4 / 3" }} />
              )}
              <div>
                <p className={x.overline}><Facts items={["The place", flagship.p.island]} /></p>
                <h2 className="ds-headline-l" style={{ margin: "0 0 12px" }}>{flagship.p.name}</h2>
                {flagship.p.description && <p className="ds-body-l ds-muted" style={{ margin: 0 }}>{shortLine(flagship.p.description, 260)}.</p>}
                <div className={x.stats}>
                  <div className={x.stat}><strong>{flagship.s.count}</strong><span>programmes</span></div>
                  {flagship.s.dMin > 0 && <div className={x.stat}><strong>{flagship.s.dMin === flagship.s.dMax ? flagship.s.dMin : `${flagship.s.dMin}–${flagship.s.dMax}`}</strong><span>days</span></div>}
                  {flagship.s.min > 0 && <div className={x.stat}><strong>{money(flagship.s.min)}</strong><span>from, per person</span></div>}
                </div>
                <ButtonLink href={"/properties/" + flagship.p.slug} variant="tonal" trailingIcon="arrow_forward">Explore {flagship.p.name.split(" ")[0]}</ButtonLink>
              </div>
            </div>
          </section>
        )}

        {/* Good to know */}
        <section className={x.sectionLoose}>
          <p className={x.overline}>Before you go</p>
          <h2 className="ds-headline-m" style={{ margin: "0 0 16px" }}>Good to know</h2>
          <div className={x.twoCol}>
            {GOOD_TO_KNOW.map((g) => (
              <ListItem key={g.h} icon={g.icon} headline={g.h} supporting={g.t} />
            ))}
          </div>
        </section>

        {/* Medical (China only) */}
        {country === "China" && (
          <section className={x.section}>
            <div className={x.block}>
              <div className={x.blockRow}>
                <Icon name="medical_services" />
                <div className={x.blockText}>
                  <h2 className="ds-title-l">Medical treatment in China</h2>
                  <p className="ds-body-m ds-muted">{clinicCount > 0 ? `${clinicCount} partner ${clinicCount === 1 ? "hospital" : "hospitals"} in Beijing, Shanghai, Xi'an, Chengdu and Guangzhou. ` : ""}Dream Islands is a DMO, not a medical institution: doctors decide on treatment.</p>
                </div>
                <ButtonLink href="/medical/china" variant="tonal" trailingIcon="arrow_forward">Medical China</ButtonLink>
              </div>
            </div>
          </section>
        )}

        {/* Promise */}
        <section className={`${x.sectionLoose} ${x.last}`}>
          <div className={x.promise}>
            <Icon name="spa" />
            <h2 className="ds-headline-l">Not sure which one fits? Get matched in 2 minutes.</h2>
            <div className={x.promiseActions}>
              <ButtonLink href="/start" variant="filled" size="l">Take the Wellness Journey</ButtonLink>
              <ButtonLink href={WA_LINK} variant="tonal" size="l" target="_blank" rel="noreferrer">Message us</ButtonLink>
            </div>
            <span className={x.promiseNote}><Facts items={["Your Wellness Journey", "about 2 minutes", "free"]} /></span>
          </div>
        </section>
      </div>
    </div>
  )
}
