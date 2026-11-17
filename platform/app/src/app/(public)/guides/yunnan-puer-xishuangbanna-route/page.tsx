import Link from "@/lib/i18n-link"
import type { Metadata } from "next"
import { supabaseCatalog as supabaseAdmin } from "@/lib/supabase-catalog" // cached public catalog reads
import { type DbProgramRow } from "../../_lib/programMapping"
import { mapProgramsResolved } from "../../_lib/programMappingResolved"
import ProgramCard from "../../_components/ProgramCard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Pu'er + Xishuangbanna Route: 7–10 Day Yunnan Wellness",
  description:
    "One Yunnan wellness route: Pu'er forest and tea, then Xishuangbanna hot springs and Dai heritage. Itinerary logic and what is included.",
  alternates: { canonical: "/guides/yunnan-puer-xishuangbanna-route" },
  openGraph: {
    title: "Pu'er + Xishuangbanna Route: 7–10 Day Yunnan Wellness | Dream Islands",
    description:
      "Forest and tea in Pu'er, then hot springs and Dai culture in Xishuangbanna. A 7 or 10 day route through southern Yunnan with real matched programmes.",
    url: "https://dreamislands.org/guides/yunnan-puer-xishuangbanna-route",
  },
}

const PHOTO_PATHS = [
  "yunnan/puer/yunnan-puer-forest-base-aerial-lake-01.png",
  "yunnan/puer/yunnan-puer-forest-base-wooden-cabin-05.png",
  "yunnan/wyndham-jinghong/wyndham-jinghong-resort-pool-and-main-building-xishuangbanna-yunnan-01.png",
  "yunnan/xishuangbanna/yunnan-xishuangbanna-botanical-garden-palms-pond-01-2560.jpg",
  "yunnan/xishuangbanna/yunnan-xishuangbanna-rainforest-giant-tree-roots-04.png",
  "yunnan/xishuangbanna/yunnan-xishuangbanna-wild-elephant-valley-aerial-walkway-02-2560.jpg",
]

const WHY_ROUTE = [
  "Two contrasting moods in one trip: cool, quiet forest and tea hills in Pu'er, then a warm tropical resort with hot springs in Xishuangbanna",
  "A natural order: first settle down in the forest, then move to culture and leisure once the pace has slowed",
  "One operator and one itinerary for both regions, including the overland transfer from Pu'er to Jinghong",
  "Long enough to feel the change of scene, still low-intensity: no day is packed",
]

type Stage = { day: string; title: string; note: string }

const ITINERARY: Stage[] = [
  { day: "Day 1", title: "Arrive in Pu'er", note: "Check in at the forest base, welcome tea, a light walk." },
  { day: "Day 2", title: "Forest restoration", note: "Breathing practice, a forest trail and nature observation." },
  { day: "Day 3", title: "Tea culture", note: "A tea plantation visit, how Pu'er tea is made, a tea session." },
  { day: "Day 4", title: "Overland to Jinghong", note: "Transfer to Xishuangbanna, resort check-in and free hot-spring time." },
  { day: "Day 5", title: "Dai culture", note: "A Dai village, handicrafts and local cuisine." },
  { day: "Day 6", title: "Tropical nature", note: "A tropical botanical garden or rainforest park with a light education programme." },
  { day: "Day 7", title: "Departure, or extend", note: "The 7-day route ends with a transfer. The 10-day route continues." },
  { day: "Days 8–10", title: "10-day extension", note: "Wild Elephant Valley, coffee or medicinal-plant themes, free time with hot springs or an optional spa or Dai heritage session, then departure on day 10." },
]

const WHAT_IT_INCLUDES = [
  "Accommodation in both regions: a 4-star forest hotel in Pu'er and a 5-star resort in Jinghong, twin-share rooms",
  "Local transport in both regions, including the Pu'er to Jinghong transfer, programme meals, a guide, entrance fees and travel insurance",
  "Forest walks, tea hill experience, rainforest nature education, hot springs, Dai culture and selected sights",
  "Not included: flights or trains to and from Yunnan. A Russian-language guide and public-holiday resources are confirmed separately",
  "Optional add-ons are paid separately: a tea cake, coffee farm or medicinal-plant base, a botanical garden, Dai Park or Wild Elephant Valley upgrade, Dai heritage sessions and spa",
]

const DESTINATION_SLUGS = ["puer-xishuangbanna-combined-journey", "puer-forest-tea-wellness", "xishuangbanna-hotsprings-dai-wellness"]

const FAQS = [
  {
    q: "What is the Pu'er and Xishuangbanna route?",
    a: "A 7 or 10 day wellness and culture route through southern Yunnan. It starts with forest and tea culture in Pu'er and continues to hot springs, Dai heritage and tropical nature in Xishuangbanna. It is a tourism and wellness programme, not a clinical one, and is operated by Xi’an Overseas Tourism Co., Ltd.",
  },
  {
    q: "7 days or 10 days: what is the difference?",
    a: "The 7-day route covers Pu'er forest and tea, the transfer to Jinghong, Dai culture and a tropical nature day. The 10-day route adds deeper experiences such as Wild Elephant Valley, coffee or medicinal-plant themes and free time for hot springs or optional spa and Dai heritage sessions.",
  },
  {
    q: "How do we get from Pu'er to Xishuangbanna?",
    a: "The transfer is overland and included in the programme, on day 4. Flights or trains into and out of Yunnan are not included.",
  },
  {
    q: "What is included?",
    a: "Accommodation in both regions, local transport, programme meals, a guide, entrance fees and travel insurance. Optional extras are paid separately. See the programme page for the exact schedule.",
  },
  {
    q: "Who is it for, and who is it not for?",
    a: "It suits guests with a week or more who want nature, tea and culture at an easy pace, including couples and small groups. It is not a medical programme and does not replace diagnosis or treatment. Hot-spring bathing: speak to your doctor first if you have a cardiovascular condition, are pregnant or are sensitive to heat.",
  },
  {
    q: "Can I do only one of the two regions?",
    a: "Yes. There are separate programmes for Pu'er (3 or 5 days) and for Xishuangbanna (3 or 5 days). The combined route suits those who want to see both in one trip.",
  },
]

export default async function PuerXishuangbannaRoutePage() {
  const [{ data: rows }, { data: photoRows }] = await Promise.all([
    supabaseAdmin
      .from("programs")
      .select(
        "id, name, slug, summary, cohort, tier, duration_days, price_usd, outcomes, is_composite, hero_image_url, " +
          "program_properties(role, properties(id, name, island, country, contact_wa)), " +
          "program_variants(duration_days, duration_nights, price_basic_usd, price_vip_usd, active)",
      )
      .in("slug", DESTINATION_SLUGS)
      .eq("active", true)
      .eq("status", "published"),
    supabaseAdmin
      .from("media_assets")
      .select("path, public_url, alt_en")
      .eq("bucket", "properties")
      .eq("active", true)
      .in("path", PHOTO_PATHS),
  ])

  const programs = await mapProgramsResolved((rows ?? []) as unknown as DbProgramRow[])
  const bySlug = new Map(programs.map((p) => [p.slug, p]))
  const matched = DESTINATION_SLUGS.map((s) => bySlug.get(s)).filter((p): p is NonNullable<typeof p> => !!p)

  const photoByPath = new Map((photoRows ?? []).map((r: { path: string; public_url: string | null; alt_en: string | null }) => [r.path, r]))
  const photos = PHOTO_PATHS.map((p) => photoByPath.get(p)).filter((r): r is NonNullable<typeof r> => !!r && !!r.public_url)

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Guides", item: "https://dreamislands.org/guides" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Pu'er + Xishuangbanna Route",
        item: "https://dreamislands.org/guides/yunnan-puer-xishuangbanna-route",
      },
    ],
  }

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* HERO */}
      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Route guide · China</div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 8vw, 60px)", margin: "0 0 20px", color: "var(--ink)", maxWidth: 900 }}>
          Pu&apos;er and <span className="display-italic">Xishuangbanna</span>, one route.
        </h1>
        <p className="body-lg" style={{ marginBottom: 20, maxWidth: 700 }}>
          Forest and tea in Pu&apos;er, then hot springs and Dai culture in Xishuangbanna. A 7 or 10 day route through
          southern Yunnan: how it is built, what is included and which real programmes match.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <Link href="/start" className="btn btn-primary btn-lg">
            Get your WS →
          </Link>
          <Link href="/programs/puer-xishuangbanna-combined-journey" className="btn btn-ghost btn-lg">
            See the programme
          </Link>
        </div>
      </section>

      {/* PHOTOS */}
      {photos.length > 0 && (
        <section className="shell" style={{ paddingTop: 40 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {photos.map((ph) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={ph.path}
                src={ph.public_url as string}
                alt={ph.alt_en ?? "Yunnan wellness route"}
                loading="lazy"
                style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: 14 }}
              />
            ))}
          </div>
        </section>
      )}

      {/* WHY */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Why combine the two</h2>
          <ul style={{ margin: "16px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {WHY_ROUTE.map((s) => (
              <li key={s} style={{ display: "flex", gap: 10 }}>
                <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--accent)", marginTop: 8 }} />
                <span className="body-sm">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ITINERARY */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Itinerary logic</div>
            <h2>Day by <span className="display-italic">day</span>.</h2>
          </div>
        </div>
        <div className="card" style={{ padding: 28 }}>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
            {ITINERARY.map((s) => (
              <li key={s.day} className="body-sm" style={{ display: "flex", gap: 10 }}>
                <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--accent)", marginTop: 8 }} />
                <span>
                  <strong style={{ color: "var(--ink)" }}>{s.day}: {s.title}.</strong> {s.note}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* INCLUDES */}
      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>What the route includes</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {WHAT_IT_INCLUDES.map((c) => (
              <li key={c} className="body-sm" style={{ display: "flex", gap: 10 }}>
                <span style={{ minWidth: 6, height: 6, borderRadius: 3, background: "var(--accent)", marginTop: 8 }} />
                {c}
              </li>
            ))}
          </ul>
          <p className="body-sm" style={{ marginTop: 14, color: "var(--ink-3)", fontStyle: "italic" }}>
            A tourism and wellness programme, not a medical one. It does not replace diagnosis or treatment. Dream
            Islands is a Destination Marketing Organization, not a medical institution.
          </p>
        </div>
      </section>

      {/* MATCHED PROGRAMMES */}
      {matched.length > 0 && (
        <section className="shell" style={{ paddingTop: 56 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Real matched programmes</div>
              <h2>Plan your <span className="display-italic">route</span>.</h2>
            </div>
          </div>
          <div className="rail">
            {matched.map((p) => (
              <ProgramCard key={p.id} program={p} variant="rail" />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div
          className="card"
          style={{ padding: "36px 28px", background: "var(--accent)", color: "var(--accent-ink)", border: 0 }}
        >
          <div className="eyebrow" style={{ color: "rgba(255,255,255,.7)" }}>Not sure which one fits?</div>
          <p className="display" style={{ fontSize: "clamp(24px, 5vw, 36px)", margin: "12px 0 20px", maxWidth: 560 }}>
            <span className="display-italic">Free WS</span>, matched programme, real humans on WhatsApp.
          </p>
          <Link href="/start" className="btn" style={{ background: "var(--accent-ink)", color: "var(--accent-deep)" }}>
            Get your WS →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Frequently asked</div>
            <h2>Before you <span className="display-italic">book</span>.</h2>
          </div>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {FAQS.map((f) => (
            <details key={f.q} className="card" style={{ padding: "16px 20px" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 15, color: "var(--ink)", listStyle: "none" }}>
                {f.q}
              </summary>
              <p className="body-sm" style={{ margin: "10px 0 0" }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
