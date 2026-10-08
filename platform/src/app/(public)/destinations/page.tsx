import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase-server"
import type { Metadata } from "next"
import { COUNTRY_FLAGS, countrySlug } from "../_lib/countries"

export const metadata: Metadata = {
  title: "Destinations",
  description: "Explore Dream Islands wellness destinations across Thailand, China, Indonesia, Malaysia, Philippines, Singapore and Vietnam.",
  alternates: { canonical: "/destinations" },
  openGraph: {
    title: "Destinations | Dream Islands",
    description: "Explore Dream Islands wellness destinations across Asia.",
    url: "https://dreamislands.org/destinations",
  },
}

export const dynamic = "force-dynamic"

type Row = { country: string | null }

export default async function DestinationsPage() {
  const { data: rows } = await supabaseAdmin
    .from("properties")
    .select("country")
    .eq("active", true)
    .neq("name", "")

  const properties = (rows ?? []) as Row[]
  const countryNames = Array.from(new Set(properties.map((p) => p.country).filter((c): c is string => Boolean(c))))
  const countries = countryNames
    .map((name) => ({ name, count: properties.filter((p) => p.country === name).length }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Where we operate</div>
        <h1
          className="display"
          style={{ fontSize: "clamp(40px, 10vw, 72px)", margin: "0 0 24px", color: "var(--ink)" }}
        >
          Pick a <span className="display-italic">destination</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 40, maxWidth: 700 }}>
          Dream Islands properties and programs span seven countries. Choose one to see its
          properties, programs and what each is best for.
        </p>

        <div
          style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
        >
          {countries.map((c) => (
            <Link
              key={c.name}
              href={"/destinations/" + countrySlug(c.name)}
              className="card"
              style={{ display: "block", padding: 24, textDecoration: "none", color: "inherit" }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{COUNTRY_FLAGS[c.name] ?? ""}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--ink)", marginBottom: 4 }}>
                {c.name}
              </div>
              <div className="body-sm">
                {c.count} {c.count === 1 ? "property" : "properties"}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
