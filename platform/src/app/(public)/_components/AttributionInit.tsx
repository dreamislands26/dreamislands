"use client"
import { useEffect } from "react"
import { captureAttribution, getAttribution, getSessionId, getGaClientId } from "../_lib/track"

function detectDevice(): string {
  if (typeof navigator === "undefined") return "unknown"
  const ua = navigator.userAgent
  if (/Mobi|Android/i.test(ua)) return "mobile"
  if (/Tablet|iPad/i.test(ua)) return "tablet"
  return "desktop"
}

function detectBrowser(): string {
  if (typeof navigator === "undefined") return "unknown"
  const ua = navigator.userAgent
  if (ua.includes("Edg/")) return "Edge"
  if (ua.includes("Chrome/")) return "Chrome"
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari"
  if (ua.includes("Firefox/")) return "Firefox"
  return "Other"
}

export default function AttributionInit() {
  useEffect(() => {
    captureAttribution()
    const attribution = getAttribution()
    const sessionId = getSessionId()
    if (!sessionId) return
    fetch("/api/analytics/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        ga_client_id: getGaClientId() ?? undefined,
        market_country: attribution?.market_country,
        traffic_channel: attribution?.traffic_channel,
        utm_source: attribution?.utm_source ?? undefined,
        utm_medium: attribution?.utm_medium ?? undefined,
        utm_campaign: attribution?.utm_campaign ?? undefined,
        utm_content: attribution?.utm_content ?? undefined,
        utm_term: attribution?.utm_term ?? undefined,
        gclid: attribution?.gclid ?? undefined,
        fbclid: attribution?.fbclid ?? undefined,
        ttclid: attribution?.ttclid ?? undefined,
        msclkid: attribution?.msclkid ?? undefined,
        landing_page: attribution?.landing_page,
        referrer: attribution?.referrer,
        device: detectDevice(),
        browser: detectBrowser(),
      }),
      keepalive: true,
    }).catch(() => {})
  }, [])
  return null
}
