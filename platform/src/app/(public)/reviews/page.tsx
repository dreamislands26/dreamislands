import Link from "next/link"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase-server"
import { ReviewCard, type Review } from "../_components/ReviewsSection"

export const metadata: Metadata = {
  title: "Guest Reviews",
  description: "Real guest stories from Dream Islands wellness journeys across Asia — outcomes, programs, and destinations.",
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

  const reviews = (data ?? []) as Review[]

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

  return (
    <div style={{ background: "#1C262A", minHeight: "100vh", paddingBottom: 80 }}>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <div className="shell" style={{ paddingTop: 64, paddingBottom: 48 }}>
        <div className="eyebrow" style={{ color: "#AEE1C0", marginBottom: 12 }}>
          Guest reviews
        </div>
        <h1 className="display" style={{ color: "#fff", margin: "0 0 20px" }}>
          Guest Stories
        </h1>
        <p className="body-lg" style={{ color: "rgba(255,255,255,.75)", marginBottom: 40, maxWidth: 640 }}>
          We measure outcomes, not just satisfaction — these are real guests, matched by goal,
          describing what actually changed before, during and after their stay.
        </p>
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
          {reviews.length === 0 && (
            <p style={{ color: "rgba(255,255,255,.5)", gridColumn: "1 / -1" }}>
              No reviews yet.
            </p>
          )}
        </div>
        <div style={{ marginTop: 48 }}>
          <Link href="/" style={{ color: "#AEE1C0", fontSize: 14 }}>
            {"←"} Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
