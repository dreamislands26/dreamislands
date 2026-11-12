"use client"

import { useState } from "react"
import { track } from "../../_lib/track"

// `image`: a screenshot of that view (16:9). Until a tab has one, the card shows only its text: an empty
// "Screenshot pending" frame filled the whole desktop screen (12.11.2026).
const TABS: readonly { key: "admin" | "partner" | "user" | "consumer"; label: string; blurb: string; image?: string }[] = [
  { key: "admin", label: "Admin", blurb: "Manages the full network — properties, programmes, bookings and guest journeys in one place." },
  { key: "partner", label: "Partner", blurb: "What a property team sees — their guests, their programmes, their delivery calendar." },
  { key: "user", label: "User", blurb: "The guest's own view of their journey, goals and progress." },
  { key: "consumer", label: "Consumer frontend", blurb: "The public dreamislands.org experience guests book through." },
]

export default function PlatformTabs() {
  const [active, setActive] = useState<(typeof TABS)[number]["key"]>("admin")
  const activeTab = TABS.find((t) => t.key === active)!

  return (
    <div>
      <div role="tablist" aria-label="Platform views" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={active === t.key}
            onClick={() => {
              setActive(t.key)
              track("platform_view_select", { view: t.key })
            }}
            className={active === t.key ? "btn btn-primary" : "btn btn-ghost"}
            style={{ padding: "10px 16px", fontSize: 13 }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {activeTab.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeTab.image}
            alt={`${activeTab.label} view of the Dream Islands platform`}
            style={{ display: "block", width: "100%", aspectRatio: "16 / 9", objectFit: "cover", borderBottom: "1px solid var(--border, #e6e9e7)" }}
          />
        )}
        <p className="body-sm" style={{ margin: 0, padding: 20 }}>
          {activeTab.blurb}
        </p>
      </div>
    </div>
  )
}
