import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase-server"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tanya Samui — Frequently Asked Questions",
  description: "23 answers covering the Tanya Samui protocol, WS tracking, payment, medical safety and arrival logistics.",
  alternates: { canonical: "/tanya-samui/faq" },
  openGraph: {
    title: "Tanya Samui — Frequently Asked Questions | Dream Islands",
    description: "23 answers covering the Tanya Samui protocol, WS tracking, payment, medical safety and arrival logistics.",
    url: "https://dreamislands.org/tanya-samui/faq",
  },
}

export const dynamic = "force-dynamic"

type FaqRow = {
  id: string
  question_en: string
  answer_en: string
  category: string | null
  link: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  wbs: "WS",
  payment: "Payment",
  medical: "Medical & Safety",
  logistics: "Arrival & Logistics",
  accommodation: "Accommodation",
  staff: "Team & Language",
}

const CATEGORY_ORDER = ["general", "wbs", "programme", "accommodation", "medical", "payment", "logistics", "staff"]

export default async function TanyaFaqPage() {
  const { data: rows } = await supabaseAdmin
    .from("faq")
    .select("id, question_en, answer_en, category, link")
    .eq("status", "published")
    .in("visibility", ["both", "en"])
    .order("sort_order")

  const faqs = (rows ?? []) as FaqRow[]
  const byCategory: Record<string, FaqRow[]> = {}
  for (const f of faqs) {
    const cat = f.category ?? "general"
    ;(byCategory[cat] ??= []).push(f)
  }
  const categories = [
    ...CATEGORY_ORDER.filter((c) => byCategory[c]?.length),
    ...Object.keys(byCategory).filter((c) => !CATEGORY_ORDER.includes(c)),
  ]

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question_en,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer_en,
      },
    })),
  }

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <section className="shell" style={{ paddingTop: 24 }}>
        <Link href="/tanya-samui" className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 13, marginBottom: 24, display: "inline-flex" }}>
          {"←"} Tanya Samui
        </Link>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Frequently asked</div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 8vw, 60px)", margin: "0 0 20px", color: "var(--ink)" }}>
          Answers to <span className="display-italic">everything</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 40, maxWidth: 700 }}>
          {faqs.length} questions, grouped by topic. Still stuck?{" "}
          <a href="https://wa.me/message/HOF2AFIBDYY5J1" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
            Message us on WhatsApp
          </a>.
        </p>

        {categories.map((cat) => (
          <div key={cat} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, marginBottom: 14, color: "var(--ink)" }}>{CATEGORY_LABELS[cat] ?? cat}</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {byCategory[cat].map((f) => (
                <details key={f.id} className="card" style={{ padding: "16px 20px" }}>
                  <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 15, color: "var(--ink)", listStyle: "none" }}>
                    {f.question_en}
                  </summary>
                  <p className="body-sm" style={{ margin: "10px 0 0" }}>{f.answer_en}</p>
                  {f.link && (
                    <Link
                      href={f.link.replace("https://dreamislands.org", "").replace("/programmes", "/programs")}
                      className="body-sm"
                      style={{ color: "var(--accent)", display: "inline-block", marginTop: 8 }}
                    >
                      Learn more {"→"}
                    </Link>
                  )}
                </details>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
