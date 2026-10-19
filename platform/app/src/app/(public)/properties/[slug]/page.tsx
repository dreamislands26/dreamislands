import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import { dataLayerScript } from "../../_lib/track"
import { countrySlug } from "../../_lib/countries"
import { dayRange, enOnly, loadGallery, loadPrograms, loadProperties, loadReviews, loadRooms, money, shortLine, type CatalogProgram } from "../../_lib/catalog"
import { GENERIC_FAQ, PLACE_CONTENT } from "../../_lib/placeContent"
import { ButtonLink, Facts, Faq, Icon, InfoCard, ListItem, Route, SectionHead, SeeAll } from "../../ds/ui"
import { PlaceCard, ProgramCard, ReviewCard, ScoreCard, cardStyles as cs } from "../../ds/cards"
import Gallery from "../../ds/Gallery"
import SaveButton from "../../ds/SaveButton"
import ShareButton from "../../ds/ShareButton"
import MobilePhoto from "../../ds/MobilePhoto"
import { BottomActionBar } from "../../ds/overlay"
import x from "../../ds/sections.module.css"
import p from "./place.module.css"
import Flag from "../../ds/Flag"
import ReserveModal from "../../_components/ReserveModal"
import { canonicalPathForDbSlug, MEDICAL_SITE } from "@/lib/medical-routes"

function trimMeta(input: string, max = 155): string {
  const t = input.replace(/\s+/g, " ").trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const i = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "))
  if (i > 80) return cut.slice(0, i + 1)
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "") + "..."
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { data } = await supabaseAdmin.from("properties").select("name, island, country, description, image_url, translations").eq("slug", slug).eq("active", true).maybeSingle()
  if (!data) return { title: "Property not found" }
  const row = data as { name: string; island: string | null; country: string | null; description: string | null; image_url: string | null }
  const location = [row.island, row.country].filter(Boolean).join(", ")
  // SEO copy from the database (translations.en) when present; medical properties are canonical under /medical
  const trEn = (((data as { translations?: { en?: unknown } }).translations?.en) ?? {}) as { seo_title?: string; meta_description?: string }
  const seoTitle = trEn.seo_title ? String(trEn.seo_title).replace(/\s*\|\s*Dream Islands\s*$/i, "") : null
  const title = seoTitle ?? (location ? `${row.name.trim()} - ${location}` : row.name.trim())
  const description = trimMeta(trEn.meta_description ?? row.description ?? `${row.name.trim()}, a verified wellness property on Dream Islands.`)
  return {
    title,
    description,
    alternates: { canonical: canonicalPathForDbSlug(slug) },
    openGraph: { title: `${title} | Dream Islands`, description, url: `${MEDICAL_SITE}${canonicalPathForDbSlug(slug)}`, images: row.image_url ? [{ url: row.image_url }] : undefined },
    twitter: { card: "summary_large_image", title: `${title} | Dream Islands`, description, images: row.image_url ? [row.image_url] : undefined },
  }
}

export const dynamic = "force-dynamic"

// Tanya ecosystem has its own full section — send visitors there instead of a generic page.
const TANYA_SLUGS = new Set(["tanya-core", "bunya-clinic", "tanya-wellbeing"])
const WA_DEFAULT = "https://wa.me/message/HOF2AFIBDYY5J1"

function durationRails(list: CatalogProgram[], placeName: string) {
  const routes = list.filter((q) => q.type === "Composite" || !q.location.toLowerCase().includes(placeName.toLowerCase().split(" ")[0]))
  const rest = list.filter((q) => !routes.includes(q))
  const short = rest.filter((q) => q.minDays <= 5)
  const deep = rest.filter((q) => q.minDays > 5)
  const span = (l: CatalogProgram[]) => dayRange(Math.min(...l.map((q) => q.minDays)), Math.max(...l.map((q) => q.maxDays)))
  return [
    { key: "short", title: "Short resets", list: short },
    { key: "deep", title: "Deeper practice", list: deep },
    { key: "routes", title: "Routes and longer journeys", list: routes },
  ]
    .filter((r) => r.list.length > 0)
    .map((r) => ({ ...r, span: span(r.list) }))
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (TANYA_SLUGS.has(slug)) redirect("/tanya-samui")

  const { data: property } = await supabaseAdmin
    .from("properties")
    .select("id, name, slug, island, country, certified, description, image_url, contact_wa, translations, entity_type")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle()
  if (!property) notFound()
  const name = (property.name as string).trim()

  const [allPrograms, gallery, rooms, reviews, countryPlaces] = await Promise.all([
    loadPrograms(),
    loadGallery({ property_id: property.id }, name),
    loadRooms([property.id]),
    loadReviews(),
    property.country ? loadProperties(property.country) : Promise.resolve([]),
  ])
  const programs = allPrograms.filter((q) => q.propertyIds.includes(property.id))
  const images = gallery.length ? gallery : property.image_url ? [{ url: property.image_url as string, alt: name }] : []
  const content = PLACE_CONTENT[slug]
  const minPrice = programs.length ? Math.min(...programs.map((q) => q.minPrice).filter((n) => n > 0)) : 0
  const dMin = programs.length ? Math.min(...programs.map((q) => q.minDays)) : 0
  const dMax = programs.length ? Math.max(...programs.map((q) => q.maxDays)) : 0
  const rails = durationRails(programs, name)
  const placeReviews = reviews.filter((r) => r.programSlugs.some((s) => programs.some((q) => q.slug === s))).slice(0, 3)
  const waHref = property.contact_wa
    ? `https://wa.me/${String(property.contact_wa).replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi! I'd like to know more about ${name}.`)}`
    : WA_DEFAULT
  const more = countryPlaces.filter((pl) => pl.id !== property.id && allPrograms.some((q) => q.propertyIds.includes(pl.id))).slice(0, 4)

  const entityType = (property as { entity_type?: string | null }).entity_type ?? null
  const isMedicalProp = entityType === "hospital_clinic" || entityType === "network_coordinator"
  const videos: { youtube_id: string; title_en?: string }[] = Array.isArray((property as { translations?: { videos?: unknown } }).translations?.videos)
    ? ((property as { translations: { videos: { youtube_id: string; title_en?: string }[] } }).translations.videos)
    : []
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": entityType === "hospital_clinic" ? "Hospital" : entityType === "network_coordinator" ? "Organization" : "LodgingBusiness",
    name,
    description: property.description ?? undefined,
    image: property.image_url ?? undefined,
    url: `${MEDICAL_SITE}${canonicalPathForDbSlug(property.slug)}`,
    address: { "@type": "PostalAddress", addressLocality: property.island ?? undefined, addressCountry: property.country ?? undefined },
  }
  const highlights = content?.highlights ?? [
    property.certified ? { icon: "verified", h: "Verified partner", t: "Checked by the Dream Islands team" } : null,
    { icon: "forum", h: "A person plans it with you", t: "Your coordinator replies on WhatsApp" },
    { icon: "monitoring", h: "Measure what changed", t: "Your Wellness Score before and after the trip" },
  ].filter((h): h is { icon: string; h: string; t: string } => !!h)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {slug === "mile-wellness-resort" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "VideoObject",
              name: "Mile Wellness Resort, Yunnan | TCM, Medical Wellness & Hot Springs in China",
              description:
                "Mile Wellness Resort is a premium medical wellness retreat in Mile, Yunnan, China, combining Traditional Chinese Medicine (TCM), functional medicine, modern diagnostics, silica hot springs and restorative wellness. Programmes range from short 3-day wellness escapes to 7-14 day deep recovery, executive health and preventive wellness programmes.",
              thumbnailUrl: ["https://i.ytimg.com/vi/fpyzycLUIck/hqdefault.jpg"],
              uploadDate: "2026-09-01T08:00:25-07:00",
              duration: "PT1M4S",
              contentUrl: "https://youtu.be/fpyzycLUIck",
              embedUrl: "https://www.youtube.com/embed/fpyzycLUIck",
              publisher: { "@type": "Organization", name: "Dream Islands", url: "https://dreamislands.org" },
            }),
          }}
        />
      )}
      {videos.map((v) => (
        <script
          key={"vo-" + v.youtube_id}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "VideoObject",
              name: `${v.title_en ?? name} | ${name}`,
              description: `${v.title_en ?? "Video"} at ${name}${property.island ? ", " + property.island : ""}${property.country ? ", " + property.country : ""}.`,
              thumbnailUrl: [`https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg`],
              uploadDate: "2026-10-06T00:00:00+00:00",
              contentUrl: `https://youtu.be/${v.youtube_id}`,
              embedUrl: `https://www.youtube.com/embed/${v.youtube_id}`,
              publisher: { "@type": "Organization", name: "Dream Islands", url: "https://dreamislands.org" },
            }),
          }}
        />
      ))}
      <script dangerouslySetInnerHTML={{ __html: dataLayerScript("view_property", { property_id: property.id, property_name: property.name, country: property.country, destination_country: property.country }) }} />

      <MobilePhoto images={images} title={name} fallback={property.country ? `/destinations/${countrySlug(property.country)}` : "/destinations"} save={{ kind: "place", id: property.id, title: name, href: `/properties/${property.slug}`, image: property.image_url ?? null, meta: [property.island, property.country].filter(Boolean).join(", ") }} />

      <div className={`ds-container-narrow ${p.page}`}>
        {/* Top: gallery + summary */}
        <section className={p.top}>
          <div className={p.desktopOnly}><Gallery images={images} title={name} /></div>
          <div className={p.summary}>
            {property.country && (
              <ButtonLink href={`/destinations/${countrySlug(property.country)}`} variant="text" size="m" className={p.crumb}>
                {property.country}
              </ButtonLink>
            )}
            <div className={p.titleRow}>
              <h1 className={p.title}>{name}</h1>
              <div className={p.titleActions}>
                <ShareButton title={name} />
                <SaveButton variant="inline" item={{ kind: "place", id: property.id, title: name, href: `/properties/${property.slug}`, image: property.image_url ?? null, meta: [property.island, property.country].filter(Boolean).join(", ") }} />
              </div>
            </div>
            <p className={p.factsMobile}><Flag of={property.country} /> {[property.island, property.country].filter(Boolean).join(", ")}</p>
            {programs.length > 0 && (
              <div className={p.stats}>
                <div><strong>{programs.length}</strong><span>{programs.length === 1 ? "programme" : "programmes"}</span></div>
                {dMin > 0 && <div><strong>{dMin === dMax ? dMin : `${dMin}–${dMax}`}</strong><span>days</span></div>}
                {minPrice > 0 && <div><strong>{money(minPrice)}</strong><span>from</span></div>}
              </div>
            )}
            {property.description && <p className={p.lede}>{shortLine(enOnly(property.description), 240)}.</p>}
            <p className={p.facts}>
              <Facts items={[programs.length ? `${programs.length} ${programs.length === 1 ? "programme" : "programmes"}` : null, <span key="pl"><Flag of={property.country} /> {[property.island, property.country].filter(Boolean).join(", ")}</span>, dayRange(dMin, dMax), minPrice ? `from ${money(minPrice)} per person` : null]} />
            </p>
            <div className={p.highlights}>
              {highlights.map((h) => (
                <ListItem key={h.h} icon={h.icon} headline={h.h} supporting={h.t} />
              ))}
            </div>
            {isMedicalProp && programs.length === 0 ? (
              <ReserveModal
                programs={[{ id: "", name: `Case review - ${name}`, property_id: property.id, property_name: property.name, destination_country: property.country ?? undefined, case_mode: true }]}
                triggerLabel="Submit Your Case"
                triggerClassName="btn btn-primary"
              />
            ) : programs.length > 0 ? (
              <ButtonLink href="#programs" variant="filled" size="l" className={p.cta}>See {programs.length} {programs.length === 1 ? "programme" : "programmes"}</ButtonLink>
            ) : (
              <ButtonLink href={waHref} variant="filled" size="l" className={p.cta} target="_blank" rel="noreferrer">Message on WhatsApp</ButtonLink>
            )}
          </div>
        </section>

        {content?.intro && <p className={`ds-body-l ${p.intro}`}>{content.intro}</p>}

        {content?.why && (
          <section className={x.sectionLoose}>
            <p className={x.overline}>Why this place</p>
            <h2 className="ds-headline-m" style={{ margin: "0 0 16px" }}>{content.why.title}</h2>
            <div className={x.twoCol}>
              {content.why.items.map((it) => <ListItem key={it.h} icon={it.icon} headline={it.h} supporting={it.t} />)}
            </div>
          </section>
        )}

        {content?.ecosystem && (
          <section className={x.sectionLoose}>
            <p className={x.overline}>Ecosystem</p>
            <h2 className="ds-headline-m" style={{ margin: "0 0 24px" }}>Where you stay and where you practise</h2>
            <div className={`${cs.grid3} ${p.eco}`}>
              {content.ecosystem.map((e) => <InfoCard key={e.label} icon={e.icon} label={e.label} title={e.h} text={e.t} />)}
            </div>
          </section>
        )}

        {/* Programs by length */}
        <div id="programs" style={{ scrollMarginTop: 96 }} />
        {rails.map((r) => (
          <section key={r.key} className={x.sectionLoose}>
            <p className={x.overline}>{r.span}</p>
            <SectionHead title={r.title} action={<SeeAll href={`/programs${property.country ? `?country=${property.country}` : ""}`} count={programs.length} />} />
            <div className={cs.rail}>
              {r.list.map((q) => <ProgramCard key={q.id} program={q} />)}
            </div>
          </section>
        ))}

        {slug === "mile-wellness-resort" && (
          <section className={x.sectionLoose}>
            <h2 className="ds-headline-m" style={{ margin: "0 0 16px" }}>Watch: Mile Wellness Resort</h2>
            <div className={p.video}>
              <iframe
                src="https://www.youtube.com/embed/fpyzycLUIck"
                title="Mile Wellness Resort, Yunnan | TCM, Medical Wellness & Hot Springs in China"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </section>
        )}

        {content?.hosts && (
          <section className={x.sectionLoose}>
            <h2 className="ds-headline-m" style={{ margin: "0 0 24px" }}>Meet your hosts</h2>
            <div className={p.hosts}>
              {content.hosts.map((h) => (
                <div key={h.name} className={p.host}>
                  <span className={p.hostAvatar}>{h.initials}</span>
                  <div>
                    <p className="ds-title-m" style={{ margin: 0 }}>{h.name}</p>
                    <p className="ds-body-s ds-muted" style={{ margin: "2px 0 8px" }}>{h.role}</p>
                    <p className="ds-body-m ds-muted" style={{ margin: 0 }}>{h.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <ButtonLink href={waHref} variant="tonal" target="_blank" rel="noreferrer" className={p.hostCta}>Message on WhatsApp</ButtonLink>
          </section>
        )}

        {content?.whoFor && (
          <section className={x.sectionLoose}>
            <p className={x.overline}>Who it&apos;s for</p>
            <h2 className="ds-headline-m" style={{ margin: "0 0 16px" }}>{content.whoFor.title}</h2>
            <div className={x.twoCol}>
              {content.whoFor.items.map((it) => <ListItem key={it.h} icon={it.icon} headline={it.h} supporting={it.t} />)}
            </div>
          </section>
        )}

        {/* Results */}
        <section className={x.sectionLoose}>
          <div className={p.results}>
            <div>
              <p className={x.overline}>Results</p>
              <h2 className="ds-headline-m" style={{ margin: "0 0 12px" }}>We measure, not just promise</h2>
              <p className="ds-body-l ds-muted" style={{ margin: "0 0 12px" }}>Every guest takes the Wellness Journey before the trip and again after it. Your Wellness Score shows what changed in sleep, stress, movement and lifestyle.</p>
              {placeReviews.length === 0 && <p className="ds-body-m ds-muted" style={{ margin: 0 }}>Results from {name.split(" ")[0]} guests appear here after the first trips.</p>}
            </div>
            <ScoreCard score={64} label="Example · Wellness Score" title="Room to recover" focus="Primary focus: Sleep & Recovery" bars={[{ name: "Sleep & Recovery", value: 48 }, { name: "Movement & Physical Load", value: 71 }, { name: "Lifestyle & Risk", value: 66 }, { name: "Social & Emotional", value: 62 }]} />
          </div>
        </section>

        {videos.length > 0 && (
          <section className={x.sectionLoose}>
            <SectionHead title="Watch" />
            <div className={cs.grid3}>
              {videos.map((v) => (
                <iframe
                  key={v.youtube_id}
                  src={`https://www.youtube-nocookie.com/embed/${v.youtube_id}`}
                  title={v.title_en ?? name}
                  loading="lazy"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: "100%", aspectRatio: "16 / 9", border: 0, borderRadius: "var(--ds-r-lg)" }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section className={x.sectionLoose}>
          <h2 className="ds-headline-m" style={{ margin: "0 0 24px" }}>What guests say</h2>
          {placeReviews.length > 0 ? (
            <div className={cs.grid3}>
              {placeReviews.map((r) => <ReviewCard key={r.id} rating={r.rating} text={r.text} name={r.name} meta={r.meta ?? undefined} />)}
            </div>
          ) : (
            <div className={p.newPlace}>
              <span className="ds-headline-m">New</span>
              <div>
                <p className="ds-title-m" style={{ margin: "0 0 4px" }}>New on Dream Islands</p>
                <p className="ds-body-m ds-muted" style={{ margin: 0 }}>Reviews appear after the first guests come back. Guests who take the Wellness Journey before and after also see how their own score changed.</p>
              </div>
            </div>
          )}
        </section>

        {rooms.length > 0 && (
          <section className={x.sectionLoose}>
            <h2 className="ds-headline-m" style={{ margin: "0 0 16px" }}>Where you stay</h2>
            <div className={x.twoCol}>
              {rooms.map((r) => (
                <ListItem key={r.id} icon={r.has_pool ? "pool" : "bed"} headline={enOnly(r.room_type) ?? r.room_type} supporting={<Facts items={[r.capacity ? `Up to ${r.capacity} ${r.capacity === 1 ? "guest" : "guests"}` : null, shortLine(enOnly(r.description), 48)]} />} />
              ))}
            </div>
          </section>
        )}

        {content?.route && (
          <section className={x.sectionLoose}>
            <h2 className="ds-headline-m" style={{ margin: "0 0 16px" }}>Getting there</h2>
            <Route stops={content.route.stops} />
            <p className="ds-body-m ds-muted" style={{ margin: "12px 0 0" }}>{content.route.note}</p>
          </section>
        )}

        <section className={x.sectionLoose}>
          <p className={x.overline}>Before you book</p>
          <h2 className="ds-headline-m" style={{ margin: "0 0 24px" }}>Questions about {name.split(" ")[0]}</h2>
          <Faq items={content?.faq ?? GENERIC_FAQ} />
        </section>

        {more.length > 0 && (
          <section className={x.sectionLoose}>
            <p className={x.overline}>Other places</p>
            <SectionHead title={`More in ${property.country}`} action={<SeeAll href={`/destinations/${countrySlug(property.country as string)}`} count={more.length} />} />
            <div className={cs.grid4}>
              {more.map((pl) => {
                const list = allPrograms.filter((q) => q.propertyIds.includes(pl.id))
                const min = Math.min(...list.map((q) => q.minPrice).filter((n) => n > 0))
                return (
                  <PlaceCard key={pl.id} id={pl.id} href={`/properties/${pl.slug}`} name={pl.name} image={pl.image_url} region={<Facts items={[pl.island, shortLine(enOnly(pl.description), 40)]} />} from={Number.isFinite(min) ? `from ${money(min)}` : null} count={`${list.length} ${list.length === 1 ? "programme" : "programmes"}`} />
                )
              })}
            </div>
          </section>
        )}

        <section className={`${x.sectionLoose} ${x.last}`}>
          <div className={x.block}>
            <div className={x.blockRow}>
              <Icon name="spa" />
              <div className={x.blockText}>
                <h2 className="ds-title-l">Not sure which of the {programs.length || "programs"} fits?</h2>
                <p className="ds-body-m ds-muted">Take the Wellness Journey: 2 minutes, free, no sign-up to see results.</p>
              </div>
              <ButtonLink href="/start" variant="tonal">Take the Wellness Journey</ButtonLink>
              <ButtonLink href={waHref} variant="text" target="_blank" rel="noreferrer">Message us on WhatsApp</ButtonLink>
            </div>
          </div>
        </section>
      </div>
      {programs.length > 0 && (
        <BottomActionBar price={minPrice ? `from ${money(minPrice)}` : `${programs.length} programmes`} sub={<Facts items={[`${programs.length} ${programs.length === 1 ? "programme" : "programmes"}`, dayRange(dMin, dMax)]} />}>
          <ButtonLink href="#programs" variant="filled" size="l">See programmes</ButtonLink>
        </BottomActionBar>
      )}
    </>
  )
}
