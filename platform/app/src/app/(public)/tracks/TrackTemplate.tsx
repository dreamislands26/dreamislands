// Shared layout for the five track guides (S6). Each page keeps its own
// copy, programme types, matched program slugs and FAQ.
import { loadPrograms, GOALS } from "../_lib/catalog"
import { ButtonLink, Faq, Icon, ListItem, SectionHead, SeeAll } from "../ds/ui"
import { JourneyPrompt, ProgramCard, cardStyles as cs } from "../ds/cards"
import x from "../ds/sections.module.css"
import t from "./track.module.css"

export type ProgrammeType = { name: string; bestFor: string; duration: string; price: string; location: string }

export default async function TrackTemplate({
  title,
  trackParam,
  lead,
  involvesIntro,
  involves,
  whoFor,
  note,
  types,
  slugs,
  faqs,
}: {
  title: string
  trackParam: string
  lead: string
  involvesIntro: string
  involves: string[]
  whoFor: string[]
  note: string
  types: ProgrammeType[]
  slugs: string[]
  faqs: { q: string; a: string }[]
}) {
  const all = await loadPrograms()
  const goal = GOALS.find((g) => g.track === trackParam)
  const bySlug = new Map(all.map((p) => [p.slug, p]))
  const picked = slugs.map((s) => bySlug.get(s)).filter((p): p is NonNullable<typeof p> => !!p)
  const more = goal ? all.filter((p) => p.cohort === goal.cohort && !slugs.includes(p.slug ?? "")) : []
  const list = [...picked, ...more].slice(0, 8)
  const count = goal ? all.filter((p) => p.cohort === goal.cohort).length : picked.length
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  }

  return (
    <div className="ds-container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <header className={x.pageHead}>
        <p className={x.overline} style={{ margin: 0 }}>Track guide<span className="ds-sep" />{title}</p>
        <h1 className="ds-display-s">{title} programmes in Asia</h1>
        <p className="ds-body-l ds-muted">{lead}</p>
        <div className={t.actions}>
          <ButtonLink href="/start" variant="filled" size="l">Start your Wellness Journey</ButtonLink>
          <ButtonLink href={`/programs?track=${trackParam}`} variant="tonal" size="l">See {count} programmes</ButtonLink>
        </div>
      </header>

      <section className={x.sectionLoose}>
        <div className={t.two}>
          <div className={x.block}>
            <h2 className="ds-headline-s" style={{ margin: "0 0 6px" }}>What this track actually involves</h2>
            <p className="ds-body-m ds-muted" style={{ margin: "0 0 12px" }}>{involvesIntro}</p>
            <ul className={t.list}>
              {involves.map((s) => (
                <li key={s}><Icon name="check" size={18} /><span>{s}</span></li>
              ))}
            </ul>
          </div>
          <div className={x.block}>
            <h2 className="ds-headline-s" style={{ margin: "0 0 12px" }}>Who it&apos;s for</h2>
            {whoFor.map((w) => <ListItem key={w} icon="person" headline={w} />)}
            <p className="ds-body-s ds-muted" style={{ margin: "12px 0 0" }}>{note}</p>
          </div>
        </div>
      </section>

      {types.length > 0 && (
        <section className={x.sectionLoose}>
          <p className={x.overline}>Programme types</p>
          <h2 className="ds-headline-m" style={{ margin: "0 0 24px" }}>Comparing your options</h2>
          <div className={t.tableWrap}>
            <table className={t.table}>
              <thead>
                <tr><th>Type</th><th>Best for</th><th>Duration</th><th>From</th><th>Where</th></tr>
              </thead>
              <tbody>
                {types.map((r) => (
                  <tr key={r.name}>
                    <td className={t.strong}>{r.name}</td>
                    <td>{r.bestFor}</td>
                    <td>{r.duration}</td>
                    <td className={t.strong}>{r.price.replace(/^from\s*/i, "")}</td>
                    <td>{r.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {list.length > 0 && (
        <section className={x.sectionLoose}>
          <p className={x.overline}>{count} programmes</p>
          <SectionHead title={`${title} programmes`} action={<SeeAll href={`/programs?track=${trackParam}`} count={count} />} />
          <div className={cs.rail}>
            {list.map((p) => <ProgramCard key={p.id} program={p} />)}
          </div>
        </section>
      )}

      <section className={x.section}>
        <JourneyPrompt title={`Not sure ${title} is your track?`} sub="Take your Wellness Journey: your answers pick the track and the programmes." cta="Start your Wellness Journey" />
      </section>

      <section className={`${x.sectionLoose} ${x.last}`}>
        <p className={x.overline}>Frequently asked</p>
        <h2 className="ds-headline-m" style={{ margin: "0 0 24px" }}>Before you book</h2>
        <Faq items={faqs} />
      </section>
    </div>
  )
}
