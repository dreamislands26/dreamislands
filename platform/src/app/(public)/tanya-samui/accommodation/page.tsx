import Image from "next/image"
import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase-server"
import { Icon } from "../../_components/Icon"

export const dynamic = "force-dynamic"

type AccRow = {
  id: string
  room_type: string
  capacity: number
  has_pool: boolean
  price_thb_per_night: number
  description: string | null
  image_url: string | null
}

export default async function TanyaAccommodationPage() {
  const { data: prop } = await supabaseAdmin.from("properties").select("id").eq("slug", "tanya-core").single()

  const { data: rows } = await supabaseAdmin
    .from("accommodation_rates")
    .select("id, room_type, capacity, has_pool, price_thb_per_night, description, image_url")
    .eq("property_id", prop?.id ?? "")
    .eq("active", true)
    .order("sort_order")

  const rooms = (rows ?? []) as AccRow[]

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <section className="shell" style={{ paddingTop: 24 }}>
        <Link href="/tanya-samui" className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 13, marginBottom: 24, display: "inline-flex" }}>
          {"←"} Tanya Samui
        </Link>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Accommodation</div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 8vw, 60px)", margin: "0 0 20px", color: "var(--ink)" }}>
          Rooms and <span className="display-italic">villas</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 40, maxWidth: 700 }}>
          From shared New Wing rooms to private pool villas — every room type at Tanya Samui, with nightly
          rates. Accommodation is included in every program; villas and upgrades are available on request.
        </p>

        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {rooms.map((r) => (
            <div key={r.id} className="card" style={{ overflow: "hidden" }}>
              {r.image_url ? (
                <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3" }}>
                  <Image src={r.image_url} alt={r.room_type} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: "cover" }} />
                </div>
              ) : (
                <div
                  aria-hidden="true"
                  style={{
                    width: "100%",
                    aspectRatio: "4 / 3",
                    background: "linear-gradient(135deg, #2C3336 0%, #1B5A45 100%)",
                    display: "grid",
                    placeItems: "center",
                    color: "rgba(174,225,192,0.55)",
                  }}
                >
                  <Icon.flower width="30%" height="30%" />
                </div>
              )}
              <div style={{ padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 19, color: "var(--ink)" }}>
                    {r.room_type}
                  </h3>
                  {r.has_pool && <span className="tag" style={{ fontSize: 10, whiteSpace: "nowrap" }}>Private pool</span>}
                </div>
                <div className="body-sm" style={{ marginBottom: 10 }}>
                  Up to {r.capacity} guest{r.capacity > 1 ? "s" : ""}
                </div>
                {r.description && <p className="body-sm" style={{ margin: "0 0 14px" }}>{r.description}</p>}
                <div style={{ fontSize: 17, fontWeight: 600, color: "var(--ink)" }}>
                  ฿{r.price_thb_per_night.toLocaleString()} <span className="body-sm" style={{ fontWeight: 400 }}>/ night</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40 }}>
          <Link href="/tanya-samui#programs" className="btn btn-primary">
            Browse programs at Tanya Samui
          </Link>
        </div>
      </section>
    </div>
  )
}
