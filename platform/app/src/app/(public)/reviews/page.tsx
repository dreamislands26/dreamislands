import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import { loadReviews } from "../_lib/catalog"
import { Stars } from "../ds/ui"
import { JourneyPrompt, ReviewCard, cardStyles as cs } from "../ds/cards"
import x from "../ds/sections.module.css"

export const metadata: Metadata = {
  title: "Guest Reviews",
  description: "Real guest stories from Dream Islands wellness journeys across Asia — outcomes, programmes, and destinations.",
  alternates: { canonical: "/reviews" },
  openGraph: {
    title: "Guest Reviews | Dream Islands",
    description: "Real guest stories from Dream Islands wellness journeys across Asia.",
    url: "https://dreamislands.org/reviews",
  },
}

export const dynamic = "force-dynamic"

export default async function ReviewsPage() {
  const { data } = await supabaseAdmin
    .from("reviews")
    .select("*, programs(name, slug)")
    .eq("status", "published")
    .in("visibility", ["both", "en"])
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })

  const ratedReviews = (data ?? []).filter((r: any) => typeof r.rating === "number")
  const avgRating =
    ratedReviews.length > 0
      ? ratedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / ratedReviews.length
      : null

  const jsonLd =
    ratedReviews.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Dream Islands",
          url: "https://dreamislands.org",
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Math.round(avgRating! * 100) / 100,
            reviewCount: ratedReviews.length,
            bestRating: 5,
            worstRating: 1,
          },
          review: ratedReviews.slice(0, 30).map((r: any) => {
            const prog = Array.isArray(r.programs) ? r.programs[0] : r.programs
            return {
              "@type": "Review",
              author: { "@type": "Person", name: r.guest_name || "Guest" },
              reviewRating: {
                "@type": "Rating",
                ratingValue: r.rating,
                bestRating: 5,
                worstRating: 1,
              },
              ...(r.text_en || r.text_ru ? { reviewBody: r.text_en || r.text_ru } : {}),
              ...(r.created_at ? { datePublished: String(r.created_at).slice(0, 10) } : {}),
              ...(prog?.name ? { itemReviewed: { "@type": "Product", name: prog.name } } : {}),
            }
          }),
        }
      : null

  const list = await loadReviews()

  return (
    <div className="ds-container">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <header className={x.pageHead}>
        <p className={x.overline} style={{ margin: 0 }}>Guest stories</p>
        <h1 className="ds-display-s">What guests say</h1>
        <p className="ds-body-l ds-muted">We measure outcomes, not just satisfaction: these are real guests, matched by goal, describing what actually changed before, during and after their stay.</p>
        {avgRating && (
          <p className="ds-title-m" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Stars value={avgRating} /> {avgRating.toFixed(1)} <span className="ds-body-m ds-muted">from {ratedReviews.length} guests</span>
          </p>
        )}
      </header>
      <section className={`${x.section} ${x.last}`}>
        <div className={cs.grid3} style={{ rowGap: 48 }}>
          {list.map((r) => (
            <ReviewCard key={r.id} rating={r.rating} text={r.text} name={r.name} meta={r.meta ?? undefined} />
          ))}
        </div>
        <div style={{ marginTop: 48 }}>
          <JourneyPrompt title="Want a story like these?" sub="Start with your Wellness Journey: 2 minutes, a Wellness Score and matched programmes." cta="Start your Wellness Journey" />
        </div>
      </section>
    </div>
  )
}
