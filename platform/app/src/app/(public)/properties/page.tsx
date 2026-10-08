import Image from "next/image"
import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase-server"
import type { Metadata } from "next"
import { COUNTRY_FLAGS, countrySlug } from "../_lib/countries"

export const metadata: Metadata = {
  title: "All Properties & Destinations",
  description: "Explore verified wellness properties, clinics and retreat centers across Thailand, Indonesia, Singapore, Malaysia, Philippines, Vietnam and China.",
  alternates: { canonical: "/properties" },
  openGraph: {
    title: "All Properties & Destinations | Dream Islands",
    description: "Explore verified wellness properties and retreat centers across Asia.",
    url: "https://dreamislands.org/properties",
  },
}

export const dynamic = "force-dynamic"

const TRACK_NAMES: Record<number, string> = {
  1: "Reset",
  2: "Performance",
  3: "Mind",
  4: "Immersion",
}

type PropertyRow = {
  id: string
  name: string
  slug: string
  parent_id: string | null
  island: string | null
  country: string | null
  cohort_tags: number[] | null
  certified: boolean
  description: string | null
  image_url: string | null
}

export default async function PropertiesPage() {
  const { data: rows } = await supabaseAdmin
    .from("properties")
    .select("id, name, slug, parent_id, island, country, cohort_tags, certified, description, image_url")
    .eq("active", true)
    .neq("name", "")
    .order("name")

  const properties = (rows ?? []) as PropertyRow[]
  const topLevel = properties.filter((p) => p.parent_id == null)
  const childrenOf = (id: string) => properties.filter((p) => p.parent_id === id)

  const jsonLd =
    topLevel.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: topLevel.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url:
              "https://dreamislands.org" +
              (p.slug === "tanya-core" ? "/tanya-samui" : "/properties/" + p.slug),
            item: {
              "@type": "LodgingBusiness",
              name: p.name.trim(),
              ...(p.description ? { description: p.description } : {}),
              ...(p.image_url ? { image: p.image_url } : {}),
              ...(p.country
                ? { address: { "@type": "PostalAddress", addressCountry: p.country } }
                : {}),
            },
          })),
        }
      : null

  const countryNames = Array.from(new Set(topLevel.map((p) => p.country || "Other")))
  const countryGroups = countryNames
    .map((name) => ({ name, items: topLevel.filter((p) => (p.country || "Other") === name) }))
    .sort((a, b) => b.items.length - a.items.length)

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Our ecosystem</div>
        <h1
          className="display"
          style={{ fontSize: "clamp(40px, 10vw, 72px)", margin: "0 0 24px", color: "var(--ink)" }}
        >
          Where the <span className="display-italic">work happens</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 24, maxWidth: 760 }}>
          Every program on Dream Islands is delivered through a real, curated property, clinic or
          center on the ground - not a generic listing. This is the full destination directory:
          where each one is, what it does, and what it's part of.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 44 }}>
          {countryGroups.map((g) => (
            <a
              key={g.name}
              href={"#" + countrySlug(g.name)}
              className="tag-outline tag"
              style={{ fontSize: 13 }}
            >
              {COUNTRY_FLAGS[g.name] ?? ""} {g.name} ({g.items.length})
            </a>
          ))}
        </div>

        {countryGroups.map((group) => (
          <div key={group.name} id={countrySlug(group.name)} style={{ marginBottom: 56, scrollMarginTop: 90 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 20,
                borderBottom: "1px solid var(--line)",
                paddingBottom: 14,
              }}
            >
              <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 30, color: "var(--ink)" }}>
                {COUNTRY_FLAGS[group.name] ?? ""} {group.name}
              </h2>
              <Link href={"/destinations/" + countrySlug(group.name)} className="btn btn-soft" style={{ fontSize: 13 }}>
                {group.name} destination page {"→"}
              </Link>
            </div>

            <div style={{ display: "grid", gap: 20 }}>
              {group.items.map((prop) => (
                <div key={prop.id} className="card" style={{ overflow: "hidden" }}>
                  {prop.image_url && (
                    <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 7" }}>
                      <Image
                        src={prop.image_url}
                        alt={prop.name.trim()}
                        fill
                        sizes="(max-width: 768px) 100vw, 600px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}
                  <div style={{ padding: 28 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
                    <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 26, color: "var(--ink)" }}>
                      {prop.name.trim()}
                    </h3>
                    {prop.certified && (
                      <span className="tag" style={{ fontSize: 11 }}>Verified Partner</span>
                    )}
                  </div>
                  <div className="body-sm" style={{ marginBottom: 14 }}>
                    {prop.country ? COUNTRY_FLAGS[prop.country] ?? "" : ""}{" "}
                    {[prop.island, prop.country].filter(Boolean).join(" · ")}
                  </div>
                  {prop.description && (
                    <p className="body" style={{ margin: "0 0 16px", maxWidth: 680 }}>
                      {prop.description}
                    </p>
                  )}
                  {prop.cohort_tags && prop.cohort_tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: childrenOf(prop.id).length ? 20 : 0 }}>
                      {prop.cohort_tags.map((c) => (
                        <span key={c} className="tag-outline tag" style={{ fontSize: 11 }}>
                          {TRACK_NAMES[c] ?? "Track " + c}
                        </span>
                      ))}
                    </div>
                  )}

                  {prop.slug === "tanya-core" ? (
                    <Link href="/tanya-samui" className="btn btn-soft" style={{ marginBottom: childrenOf(prop.id).length ? 20 : 0, display: "inline-flex" }}>
                      Explore Tanya Samui {"→"}
                    </Link>
                  ) : (
                    <Link href={"/properties/" + prop.slug} className="btn btn-soft" style={{ marginBottom: childrenOf(prop.id).length ? 20 : 0, display: "inline-flex" }}>
                      Explore {prop.name.trim()} {"→"}
                    </Link>
                  )}

                  {childrenOf(prop.id).length > 0 && (
                    <div
                      style={{
                        display: "grid",
                        gap: 14,
                        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                        borderTop: "1px solid var(--line)",
                        paddingTop: 20,
                      }}
                    >
                      {childrenOf(prop.id).map((child) => (
                        <div key={child.id}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 15 }}>{child.name}</div>
                            {child.certified && <span className="tag" style={{ fontSize: 10 }}>Verified Partner</span>}
                          </div>
                          {child.description && (
                            <p className="body-sm" style={{ margin: 0 }}>{child.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 8 }}>
          <Link href="/programs" className="btn btn-primary">
            Browse programs at these properties
          </Link>
        </div>
      </section>
    </div>
  )
}
