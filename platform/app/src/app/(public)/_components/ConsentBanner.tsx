"use client"

import { useEffect, useState } from "react"

type ConsentState = {
  ad_storage: "granted" | "denied"
  ad_user_data: "granted" | "denied"
  ad_personalization: "granted" | "denied"
  analytics_storage: "granted" | "denied"
}

const STORAGE_KEY = "di_consent"

function applyConsent(consent: ConsentState) {
  const w = window as any
  w.dataLayer = w.dataLayer || []
  function gtag(...args: unknown[]) {
    w.dataLayer.push(args)
  }
  gtag("consent", "update", consent)
  w.dataLayer.push({ event: "consent_updated", ...consent })
}

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  function choose(granted: boolean) {
    const consent: ConsentState = {
      ad_storage: granted ? "granted" : "denied",
      ad_user_data: granted ? "granted" : "denied",
      ad_personalization: granted ? "granted" : "denied",
      analytics_storage: granted ? "granted" : "denied",
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
    } catch {}
    applyConsent(consent)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: "#111",
        color: "#fff",
        padding: "16px 20px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
      }}
    >
      <p style={{ margin: 0, fontSize: "14px", maxWidth: "640px" }}>
        We use cookies to understand how you use Dream Islands and to show relevant offers. You can accept all cookies or reject non-essential ones.
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => choose(false)}
          style={{
            background: "transparent",
            border: "1px solid #fff",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Reject non-essential
        </button>
        <button
          onClick={() => choose(true)}
          style={{
            background: "#fff",
            border: "1px solid #fff",
            color: "#111",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Accept all
        </button>
      </div>
    </div>
  )
}
