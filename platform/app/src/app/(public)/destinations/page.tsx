import type { Metadata } from "next"
import { COUNTRY_FLAGS, COUNTRIES, countrySlug } from "../_lib/countries"
import { loadPrograms, loadProperties, money } from "../_lib/catalog"
import { Facts } from "../ds/ui"
import { CountryCard, JourneyPrompt, PlaceCard, cardStyles as cs } from "../ds/cards"
import x from "../ds/sections.module.css"
import h from "../_components/home.module.css"

export const metadata: Metadata = {
  title: "Destinations",
  description: "Explore Dream Islands wellness destinations across Thailand, China, Indonesia, Malaysia, Philippines, Singapore and Vietnam.",
  alternates: { canonical: "/destinations" },
  openGraph: { title: "Destinations | Dream Islands", description: "Explore Dream Islands wellness destinations across Asia.", url: "https://dreamislands.org/destinations" },
}

export const dynamic = "force-dynamic"

const THAILAND = "https://xbzrtofanbrahasxbisf.supabase.co/storage/v1/object/public/ecosystem/homepage/dream-islands-tropical-sunset-wellness-travel-asia.png"

export default async function DestinationsPage() {
  const [programs, properties] = await Promise.all([loadPrograms(), loadProperties()])
  const rows = COUNTRIES.map((c) => {
    const list = programs.filter((p) => p.country === c)
    const places = Array.from(new Set(list.map((p) => p.location.split(",")[0]).filter(Boolean)))
    const min = list.length ? Math.min(...list.map((p) => p.minPrice).filter((n) => n > 0)) : 0
    const propImg = properties.find((p) => p.country === c && p.image_url)?.image_url ?? null
    return { c, list, places, min: Number.isFinite(min) ? min : 0, image: propImg ?? list.find((p) => p.hero_image_url)?.hero_image_url ?? null }
  })
  const big = rows.filter((r) => r.c === "Thailand" || r.c === "China")
  const rest = rows.filter((r) => r.c !== "Thailand" && r.c !== "China")
  const wudang = properties.find((p) => p.slug === "wudang-mountain-wellness-center")?.image_url ?? null

  return (
    <div className="ds-container">
      <header className={x.pageHead}>
        <p className={x.overline} style={{ margin: 0 }}>Where we operate</p>
        <h1 className="ds-display-s">Pick a destination</h1>
        <p className="ds-body-l ds-muted">Programmes and places in {COUNTRIES.length} countries. Choose one to see what each place is best for.</p>
      </header>

      <section className={x.section}>
        <div className={h.big}>
          {big.map((r) => (
            <PlaceCard
              key={r.c}
              id={`country-${r.c}`}
              href={`/destinations/${countrySlug(r.c)}`}
              name={r.c}
              image={r.c === "Thailand" ? THAILAND : wudang ?? r.image}
              region={<Facts items={[r.places.slice(0, 4).join(", "), r.c === "Thailand" ? "our flagship Tanya Samui since 2009" : "mountains and hot springs"]} />}
              from={r.min ? `from ${money(r.min)}` : null}
              count={`${r.list.length} programmes`}
            />
          ))}
        </div>
      </section>

      <section className={x.sectionLoose}>
        <p className={x.overline}>Five more countries</p>
        <h2 className="ds-headline-m" style={{ margin: "0 0 24px" }}>More countries</h2>
        <div className={`${cs.grid5} ${cs.railMobile}`}>
          {rest.map((r) => (
            <CountryCard
              key={r.c}
              href={`/destinations/${countrySlug(r.c)}`}
              name={r.c}
              flag={COUNTRY_FLAGS[r.c]}
              image={r.image}
              meta={<Facts items={[r.places.slice(0, 2).join(", "), r.list.length ? `${r.list.length} ${r.list.length === 1 ? "programme" : "programmes"}` : "Coming soon"]} />}
              from={r.min ? `from ${money(r.min)}` : null}
            />
          ))}
        </div>
      </section>

      <section className={`${x.sectionLoose} ${x.last}`}>
        <JourneyPrompt title="Not sure where to go?" sub="Take your Wellness Journey: we match programmes, not just places." cta="Start your Wellness Journey" />
      </section>
    </div>
  )
}
