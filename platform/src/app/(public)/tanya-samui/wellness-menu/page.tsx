import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

type ServiceRow = {
  id: string
  name: string
  category: string | null
  description: string | null
  duration_min: number | null
  price_usd: number | null
}

const CATEGORY_LABELS: Record<string, string> = {
  massage: "Massage",
  mind: "Holistic Mind",
  beauty: "Aesthetics",
  medical: "Medical",
  iv: "IV Therapy",
  ritual: "Rituals & Signature Treatments",
  certification: "Certification Courses",
}

const CATEGORY_ORDER = ["massage", "mind", "beauty", "medical", "iv", "ritual", "certification"]

export default async function TanyaWellnessMenuPage() {
  const { data: rows } = await supabaseAdmin
    .from("services")
    .select("id, name, category, description, duration_min, price_usd")
    .eq("active", true)
    .not("slug", "like", "wud-%")
    .not("slug", "like", "mil-%")
    .not("slug", "like", "bm-%")
    .not("slug", "like", "xian-%")
    .order("sort_order")

  const services = (rows ?? []) as ServiceRow[]
  const byCategory: Record<string, ServiceRow[]> = {}
  for (const s of services) {
    const cat = s.category ?? "other"
    ;(byCategory[cat] ??= []).push(s)
  }
  const categories = CATEGORY_ORDER.filter((c) => byCategory[c]?.length)

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <section className="shell" style={{ paddingTop: 24 }}>
        <Link href="/tanya-samui" className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 13, marginBottom: 24, display: "inline-flex" }}>
          {"←"} Tanya Samui
        </Link>
        <div className="eyebrow" style={{ marginBottom: 12 }}>À la carte</div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 8vw, 60px)", margin: "0 0 20px", color: "var(--ink)" }}>
          The wellness <span className="display-italic">menu</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 40, maxWidth: 700 }}>
          {services.length} treatments across massage, holistic practice, aesthetics, medical diagnostics and IV
          therapy — bookable on their own or layered onto any program.
        </p>

        {categories.map((cat) => (
          <div key={cat} style={{ marginBottom: 44 }}>
            <h2 style={{ fontSize: 22, marginBottom: 16, color: "var(--ink)" }}>{CATEGORY_LABELS[cat] ?? cat}</h2>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
              {byCategory[cat].map((s) => (
                <div key={s.id} className="card" style={{ padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{s.name}</div>
                    {s.price_usd != null && (
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--accent)", whiteSpace: "nowrap" }}>
                        ${s.price_usd}
                      </div>
                    )}
                  </div>
                  {s.duration_min && <div className="body-sm" style={{ marginBottom: 4 }}>{s.duration_min} min</div>}
                  {s.description && <p className="body-sm" style={{ margin: 0 }}>{s.description}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}

        <Link href="/tanya-samui#programs" className="btn btn-primary">
          Browse programs at Tanya Samui
        </Link>
      </section>
    </div>
  )
}
