"use client"

import { useState } from "react"
import { track } from "../../_lib/track"

const TABS = [
  { key: "admin", label: "Admin", blurb: "Manages the full network — properties, programs, bookings and guest journeys in one place." },
  { key: "partner", label: "Partner", blurb: "What a property team sees — their guests, their programs, their delivery calendar." },
  { key: "user", label: "User", blurb: "The guest's own view of their journey, goals and progress." },
  { key: "consumer", label: "Consumer frontend", blurb: "The public dreamislands.org experience guests book through." },
] as const

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
        <div
          style={{
            aspectRatio: "16 / 9",
            background: "var(--card-2, #f4f6f5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid var(--border, #e6e9e7)",
          }}
        >
          <span className="body-sm" style={{ color: "var(--ink-3)" }}>
            Screenshot pending — {activeTab.label} view
          </span>
        </div>
        <p className="body-sm" style={{ margin: 0, padding: 20 }}>
          {activeTab.blurb}
        </p>
      </div>
    </div>
  )
}
