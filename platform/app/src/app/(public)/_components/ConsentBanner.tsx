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
    <div className="ds-consent" role="dialog" aria-label="Cookies">
      <p className="ds-body-m" style={{ margin: 0 }}>
        We use cookies to understand how you use Dream Islands and to show relevant offers. You can accept all cookies or reject non-essential ones.
      </p>
      <div className="ds-consent-actions">
        <button type="button" className="ds-consent-btn" onClick={() => choose(false)}>
          Reject non-essential
        </button>
        <button type="button" className="ds-consent-btn ds-consent-primary" onClick={() => choose(true)}>
          Accept all
        </button>
      </div>
    </div>
  )
}
