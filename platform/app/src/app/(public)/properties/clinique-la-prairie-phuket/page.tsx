import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getClpPage, chf, PROPERTY_SLUG, type ClpImage } from "./data";
import { Matcher, LeadForm, StickyCta, Track, TrackedLink } from "./ClpClient";
import s from "./clp.module.css";

export const revalidate = 300;

const SITE = "https://dreamislands.org";
const PATH = `/properties/${PROPERTY_SLUG}`;

export async function generateMetadata(): Promise<Metadata> {
  const d = await getClpPage();
  if (!d) return {};
  const img = `${SITE}${d.images.hero.src}`;
  return {
    title: { absolute: d.seoTitle },
    description: d.metaDescription,
    alternates: { canonical: `${SITE}${PATH}` },
    openGraph: { title: d.seoTitle, description: d.metaDescription, url: `${SITE}${PATH}`, images: [img], type: "website" },
    twitter: { card: "summary_large_image", title: d.seoTitle, description: d.metaDescription, images: [img] },
  };
}

function Img({ img, sizes, priority, className }: { img: ClpImage; sizes: string; priority?: boolean; className?: string }) {
  return (
    <Image
      src={img.src}
      alt={img.alt}
      width={img.w}
      height={img.h}
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      className={className}
    />
  );
}

const PILLARS = [
  { key: "medical", title: "Medical", body: "Diagnostics, medical consultations and physician supervision provide the clinical foundation." },
  { key: "nutrition", title: "Nutrition", body: "Nutrition is personalised around programme objectives and assessment findings." },
  { key: "movement", title: "Movement", body: "Movement is integrated according to individual capacity and programme goals." },
  { key: "wellbeing", title: "Wellbeing", body: "Recovery and stress-management practices complete the programme." },
];

const JOURNEY = [
  { t: "Before arrival", b: "Goals, health information and programme coordination." },
  { t: "Assessment", b: "Medical consultation and programme-specific diagnostics." },
  { t: "Personalisation", b: "Results inform nutrition, movement, medical and wellbeing components." },
  { t: "Programme", b: "You follow the personalised schedule within the programme framework." },
  { t: "Strategy", b: "Recommendations for what comes after the stay." },
];

const INCLUDED = [
  { t: "Private villa", b: "Signature Villa accommodation, per the supplier programme rate description." },
  { t: "Medical supervision", b: "Programme-specific physician supervision." },
  { t: "Nutrition", b: "Programme meals and full board according to programme conditions." },
  { t: "Transfers", b: "Round-trip Phuket airport transfers, as described in supplier materials." },
  { t: "Personalisation", b: "Programme adapted to your individual assessment." },
  { t: "Taxes and service", b: "Supplier materials state service charge and VAT are included in the referenced rates." },
];

const DI_STEPS = [
  { t: "Tell us why you're going", b: "Longevity, diagnostics, recovery, energy or prevention." },
  { t: "We identify the relevant programme", b: "Based on your objective, available time and each programme's scope." },
  { t: "We confirm dates and terms", b: "Particularly important during the pre-opening period." },
  { t: "We coordinate the stay", b: "Programme plus Phuket travel planning where you need it." },
];

export default async function CliniqueLaPrairiePhuketPage() {
  const d = await getClpPage();
  if (!d) notFound();
  const I = d.images;
  const from = chf(d.minPriceChf);
  const ctaLabel = d.bookingEnabled ? "Book now" : "Request dates";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Dream Islands", item: SITE },
        { "@type": "ListItem", position: 2, name: "Thailand", item: `${SITE}/destinations/thailand` },
        { "@type": "ListItem", position: 3, name: d.name, item: `${SITE}${PATH}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Resort",
      name: d.name,
      description: d.metaDescription,
      url: `${SITE}${PATH}`,
      image: `${SITE}${I.hero.src}`,
      address: { "@type": "PostalAddress", addressLocality: "Phuket", addressCountry: "TH" },
      priceRange: d.minPriceChf && d.maxPriceChf ? `CHF ${d.minPriceChf} to ${d.maxPriceChf}` : undefined,
      makesOffer: d.programs
        .filter((p) => p.priceChf)
        .map((p) => ({
          "@type": "Offer",
          name: p.name,
          url: `${SITE}${p.href}`,
          priceSpecification: { "@type": "PriceSpecification", minPrice: p.priceChf, priceCurrency: "CHF" },
        })),
    },
    d.faq.length && {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: d.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ].filter(Boolean);

  const matcherOptions = d.programs
    .filter((p) => p.matcherLabel)
    .map((p) => ({ label: p.matcherLabel as string, slug: p.slug, name: p.name, duration: p.durationLabel, price: chf(p.priceChf), href: p.href }));

  return (
    <div className={s.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Track event="clp_page_view" params={{ page_section: "page" }} />

      {/* 01 HERO */}
      <header className={s.hero} id="top">
        <div className={s.heroMedia}>
          <Img img={I.hero} sizes="(max-width: 860px) 100vw, 50vw" priority className={s.cover} />
        </div>
        <div className={s.heroText}>
          {d.openingStatus === "pre_opening" && <span className={s.badge}>{d.openingBadge}</span>}
          <p className={s.eyebrow}>{d.heroEyebrow}</p>
          <h1 className={s.h1}>{d.name}</h1>
          <p className={s.tagline}>{d.heroTagline}</p>
          <p className={s.lead}>{d.heroSubhead}</p>
          {d.openingLine && <p className={s.opening}>{d.openingLine}</p>}
          <div className={s.ctaRow}>
            <TrackedLink href="#enquire" className={s.btnPrimary} event="clp_request_dates_click" params={{ page_section: "hero", cta_type: "primary" }}>
              {ctaLabel}
            </TrackedLink>
            <a href="#programmes" className={s.btnGhost}>Explore programmes</a>
          </div>
          <ul className={s.facts}>
            <li>{d.location.includes("Phuket") ? "Phuket, Thailand" : d.location}</li>
            <li>3 to 7 days</li>
            <li>From {from}</li>
            <li>Medical longevity</li>
          </ul>
        </div>
      </header>

      <div className={s.flow}>
        {/* 02 STATEMENT */}
        <section className={`${s.section} ${s.oStatement}`}>
          <div className={s.statement}>
            <div>
              <h2 className={s.h2}>{d.statementTitle}</h2>
              <p className={s.big}>{d.statement}</p>
              <ul className={s.pillarLabels}>
                {PILLARS.map((p) => <li key={p.key}>{p.title}</li>)}
              </ul>
            </div>
            <figure className={s.figure}>
              <Img img={I.statement} sizes="(max-width: 860px) 100vw, 50vw" />
            </figure>
          </div>
        </section>

        {/* 03 PROOF */}
        <section className={`${s.proof} ${s.oProof}`} aria-label="Key facts">
          <div className={s.proofGrid}>
            {d.proof.map((p) => (
              <div key={p.value + p.label} className={s.proofItem}>
                <span className={s.metric}>{p.value}</span>
                <span className={s.metricLabel}>{p.label}</span>
              </div>
            ))}
          </div>
          <p className={s.fine}>Programme components and availability remain subject to medical assessment and supplier confirmation.</p>
        </section>

        {/* 04 LONGEVITY MASTER ASSESSMENT */}
        <section className={`${s.section} ${s.oLma}`} id="assessment">
          <div className={s.split}>
            <figure className={`${s.figure} ${s.figureLight}`}>
              <Img img={I.assessment} sizes="(max-width: 860px) 100vw, 45vw" />
            </figure>
            <div>
              <p className={s.eyebrow}>The starting point</p>
              <h2 className={s.h2}>Start with data</h2>
              <p className={s.body}>
                Clinique La Prairie&apos;s Longevity Master Assessment is designed to build a detailed picture of your health before the programme is personalised.
              </p>
              <div className={s.bigMetric}>
                <span>300+</span>
                <small>health indicators</small>
              </div>
              <p className={s.small}>Assessment areas described in supplier materials include:</p>
              <ul className={s.chips}>
                {d.assessmentAreas.map((a) => <li key={a}>{a}</li>)}
              </ul>
              <TrackedLink href="#enquire" className={s.textLink} event="clp_programme_guidance_click" params={{ page_section: "assessment", cta_type: "assessment" }} goal="Preventive health">
                Ask about the assessment →
              </TrackedLink>
            </div>
          </div>
        </section>

        {/* 05-06 PROGRAMMES */}
        <section className={`${s.section} ${s.oProgrammes}`} id="programmes">
          <div className={s.center}>
            <p className={s.eyebrow}>Six ways to begin</p>
            <h2 className={s.h2}>Choose where to start</h2>
            <p className={s.body}>Not every guest comes to Phuket for the same reason. Choose by objective rather than by treatment list.</p>
          </div>
          <div className={s.cards}>
            {d.programs.map((p) => (
              <article key={p.slug} className={`${s.card} ${p.featured ? s.cardFeatured : ""}`}>
                {p.badge && <span className={s.cardBadge}>{p.badge}</span>}
                <p className={s.cardTag}>{p.tag}</p>
                <h3 className={s.h3}>{p.name}</h3>
                <p className={s.cardDur}>{p.durationLabel}</p>
                <p className={s.cardBody}>{p.cardSummary}</p>
                <div className={s.cardFoot}>
                  <span className={s.price}>From {chf(p.priceChf)}</span>
                  <TrackedLink href={p.href} className={s.textLink} event="clp_program_view" params={{ programme: p.slug, page_section: "programme_cards" }}>
                    Explore →
                  </TrackedLink>
                </div>
                {p.durationNote && <p className={s.fine}>{p.durationNote}</p>}
              </article>
            ))}
          </div>
        </section>

        {/* 07 MATCHER */}
        <section className={`${s.matcherWrap} ${s.oMatcher}`}>
          <div className={s.inner}>
            <h2 className={s.h2}>What brings you here?</h2>
            <Matcher options={matcherOptions} />
          </div>
        </section>

        {/* 08 FOUR PILLARS */}
        <section className={`${s.section} ${s.oPillars}`}>
          <h2 className={`${s.h2} ${s.center}`}>One programme. Four connected dimensions.</h2>
          <div className={s.pillars}>
            {PILLARS.map((p, i) => (
              <div key={p.key} className={`${s.pillar} ${i % 2 ? s.pillarRev : ""}`}>
                <figure className={s.figure}>
                  <Img img={I[`pillar_${p.key}`]} sizes="(max-width: 860px) 100vw, 55vw" />
                </figure>
                <div>
                  <p className={s.eyebrow}>{String(i + 1).padStart(2, "0")}</p>
                  <h3 className={s.h3big}>{p.title}</h3>
                  <p className={s.body}>{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 09 MEDICAL INFRASTRUCTURE */}
        <section className={`${s.dark} ${s.oInfra}`}>
          <div className={s.split}>
            <div>
              <p className={s.eyebrow}>Medical longevity</p>
              <h2 className={s.h2}>Built around medicine, not added to a resort</h2>
              <p className={s.body}>Supplier materials describe infrastructure including:</p>
              <ul className={s.infraList}>
                {d.infrastructure.map((x) => <li key={x}>{x}</li>)}
              </ul>
              <p className={s.fine}>Availability of individual facilities at opening is to be confirmed by the supplier.</p>
            </div>
            <figure className={s.figure}>
              <Img img={I.infrastructure} sizes="(max-width: 860px) 100vw, 50vw" />
            </figure>
          </div>
        </section>

        {/* 10 VISUAL BREAK */}
        <section className={`${s.break} ${s.oBreak}`}>
          <Img img={I.break} sizes="100vw" className={s.cover} />
          <blockquote className={s.breakQuote}>Health doesn&apos;t exist separately from the environment in which you recover.</blockquote>
        </section>

        {/* 11 TRI VANANDA */}
        <section className={`${s.section} ${s.oSetting}`}>
          <div className={s.split}>
            <div>
              <p className={s.eyebrow}>The setting</p>
              <h2 className={s.h2}>Tri Vananda, Phuket</h2>
              <p className={s.body}>The medical programme is set within a private tropical environment designed around nature, movement and recovery.</p>
              <div className={s.statPair}>
                {d.airportMin && <div><span className={s.metric}>~{d.airportMin} min</span><span className={s.metricLabel}>from Phuket International Airport, per supplier materials</span></div>}
                {d.airportKm && <div><span className={s.metric}>{d.airportKm} km</span><span className={s.metricLabel}>approximate airport distance</span></div>}
              </div>
              {d.trisaraNote && <p className={s.fine}>{d.trisaraNote}</p>}
            </div>
            <figure className={s.figure}>
              <Img img={I.setting} sizes="(max-width: 860px) 100vw, 45vw" />
            </figure>
          </div>
        </section>

        {/* 12 VILLAS */}
        <section className={`${s.section} ${s.oVillas}`}>
          <div className={s.center}>
            <h2 className={s.h2}>Privacy is part of the programme</h2>
            <p className={s.body}>The accommodation is designed as part of the recovery environment rather than as a separate hotel stay.</p>
          </div>
          <figure className={`${s.figure} ${s.wide}`}>
            <Img img={I.villas} sizes="100vw" />
          </figure>
          <div className={s.villas}>
            {d.inventory.map((v) => (
              <div key={v.key} className={s.villa}>
                <figure className={s.figure}>
                  <Img img={I[`villa_${v.key}`]} sizes="(max-width: 860px) 100vw, 33vw" />
                </figure>
                <h3 className={s.h3}>{v.label}</h3>
                <p className={s.villaMeta}>{v.sqm} sqm · Private pool · {v.units} villas</p>
              </div>
            ))}
          </div>
        </section>

        {/* 13 NUTRITION */}
        <section className={`${s.section} ${s.oNutrition}`}>
          <div className={s.split}>
            <figure className={s.figure}>
              <Img img={I.nutrition} sizes="(max-width: 860px) 100vw, 55vw" />
            </figure>
            <div>
              <p className={s.eyebrow}>Nutrition</p>
              <h2 className={s.h2}>Food is part of the programme</h2>
              <p className={s.body}>Supplier materials position personalised nutrition as one of the four programme pillars.</p>
              {d.restaurant && (
                <p className={s.body}>
                  <strong>SEEDS</strong> · {d.restaurant.replace(/^SEEDS,?\s*/i, "Restaurant, approximately ")}
                </p>
              )}
              <p className={s.body}>Programme stays include nutrition according to the selected programme and your individual assessment.</p>
            </div>
          </div>
        </section>

        {/* 14 JOURNEY */}
        <section className={`${s.section} ${s.oJourney}`}>
          <h2 className={`${s.h2} ${s.center}`}>What a stay looks like</h2>
          <ol className={s.timeline}>
            {JOURNEY.map((j, i) => (
              <li key={j.t}>
                <span className={s.step}>{String(i + 1).padStart(2, "0")}</span>
                <strong>{j.t}</strong>
                <p>{j.b}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 15 PRICING */}
        <section className={`${s.section} ${s.oPricing}`} id="prices">
          <div className={s.center}>
            <p className={s.eyebrow}>Programmes</p>
            <h2 className={s.h2}>From {from}</h2>
          </div>
          <table className={s.table}>
            <thead>
              <tr><th>Programme</th><th>Stay</th><th className={s.num}>Starting price</th></tr>
            </thead>
            <tbody>
              {[...d.programs].sort((a, b) => (a.priceChf ?? 0) - (b.priceChf ?? 0)).map((p) => (
                <tr key={p.slug}>
                  <td><Link href={p.href}>{p.name}</Link></td>
                  <td>{p.durationLabel}{p.durationNote ? "*" : ""}</td>
                  <td className={s.num}>{chf(p.priceChf)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={s.fine}>
            Supplier starting rates per person. Programme suitability, dates, final rates and inclusions require confirmation.
            {d.programs.some((p) => p.durationNote) && " *Exact stay duration pending supplier confirmation."}
          </p>
        </section>

        {/* 16 INCLUDED */}
        <section className={`${s.section} ${s.oIncluded}`}>
          <h2 className={`${s.h2} ${s.center}`}>Designed as a complete stay</h2>
          <div className={s.grid3}>
            {INCLUDED.map((x) => (
              <div key={x.t} className={s.inc}>
                <h3 className={s.h4}>{x.t}</h3>
                <p>{x.b}</p>
              </div>
            ))}
          </div>
          <p className={`${s.fine} ${s.center}`}><strong>Exact inclusions vary by programme and booking period.</strong></p>
        </section>

        {/* 17 WHY DREAM ISLANDS */}
        <section className={`${s.matcherWrap} ${s.oDi}`}>
          <div className={s.inner}>
            <h2 className={s.h2}>You don&apos;t need to choose from a treatment menu.</h2>
            <p className={s.body}>Dream Islands helps turn your objective into a practical programme decision.</p>
            <ol className={s.diSteps}>
              {DI_STEPS.map((x, i) => (
                <li key={x.t}><span className={s.step}>{i + 1}</span><strong>{x.t}</strong><p>{x.b}</p></li>
              ))}
            </ol>
            <TrackedLink href="#enquire" className={s.btnPrimary} event="clp_programme_guidance_click" params={{ page_section: "dream_islands", cta_type: "concierge" }}>
              Speak to a longevity concierge →
            </TrackedLink>
          </div>
        </section>

        {/* 18 EXPLORE (internal links) */}
        <nav className={`${s.section} ${s.oLinks}`} aria-label="Explore further">
          <h2 className={`${s.h2} ${s.center}`}>Understand before you choose</h2>
          <ul className={s.links}>
            <li><Link href="/destinations/thailand">Wellness and longevity in Thailand</Link></li>
            <li><Link href="/programs?country=Thailand">All programmes in Thailand</Link></li>
            <li><Link href="/programs/clp-phuket-health-diagnostics">Preventive health diagnostics</Link></li>
            <li><Link href="/programs/clp-phuket-life-reset">Life Reset for sustained pressure</Link></li>
            <li><Link href="/tracks/reset-recovery">Reset and recovery programmes</Link></li>
          </ul>
        </nav>

        {/* 19 FAQ */}
        <section className={`${s.section} ${s.oFaq}`} id="faq">
          <h2 className={`${s.h2} ${s.center}`}>Questions about Clinique La Prairie Phuket</h2>
          <div className={s.faq}>
            {d.faq.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 20 FINAL CONVERSION */}
        <section className={`${s.final} ${s.oFinal}`} id="enquire">
          <div className={s.finalMedia}>
            <Img img={I.final} sizes="100vw" className={s.cover} />
          </div>
          <div className={s.finalInner}>
            <div className={s.finalCopy}>
              <p className={s.eyebrow}>{d.name}</p>
              <h2 className={s.h2}>Start with the right programme.</h2>
              <p className={s.body}>Tell us your goals, preferred dates and how much time you have in Phuket. We&apos;ll help identify the relevant programme and confirm current availability.</p>
            </div>
            <LeadForm programs={d.programs.map((p) => ({ slug: p.slug, name: p.name }))} ctaLabel={d.bookingEnabled ? "Book programme" : "Request programme & dates"} />
          </div>
        </section>
      </div>

      <StickyCta name={d.name} from={from} label={ctaLabel} />
    </div>
  );
}
