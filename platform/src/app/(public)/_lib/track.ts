export function dataLayerScript(event: string, params: Record<string, unknown> = {}): string {
  const payload = { event, ...params }
  return "window.dataLayer=window.dataLayer||[];window.dataLayer.push(" + JSON.stringify(payload) + ");"
}

export function track(event: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return
  const w = window as unknown as { dataLayer?: Record<string, unknown>[] }
  w.dataLayer = w.dataLayer || []
  w.dataLayer.push({ event, ...params })
}

export function getGaClientId(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(?:^|;\s*)_ga=([^;]+)/)
  if (!match) return null
  const parts = match[1].split(".")
  if (parts.length < 4) return null
  return parts[2] + "." + parts[3]
}

const ATTR_COOKIE = "di_attr"
const ATTR_MAX_AGE = 60 * 60 * 24 * 180

type Attribution = {
  market_country: string
  traffic_channel: string
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  gclid: string | null
  fbclid: string | null
  ttclid: string | null
  msclkid: string | null
  landing_page: string
  referrer: string
}

const MARKET_BY_CAMPAIGN: Record<string, string> = {
  sg: "Singapore",
  th: "Thailand",
  id: "Indonesia",
  my: "Malaysia",
  ph: "Philippines",
  vn: "Vietnam",
  cn: "China",
}

function deriveTrafficChannel(params: URLSearchParams, referrer: string): string {
  const gclid = params.get("gclid")
  const fbclid = params.get("fbclid")
  const ttclid = params.get("ttclid")
  const msclkid = params.get("msclkid")
  const utmSource = (params.get("utm_source") || "").toLowerCase()
  const utmMedium = (params.get("utm_medium") || "").toLowerCase()
  if (gclid || (utmSource === "google" && utmMedium === "cpc")) return "Google Ads"
  if (fbclid || ((utmSource === "facebook" || utmSource === "meta") && utmMedium.includes("paid"))) return "Meta Ads"
  if (ttclid) return "TikTok Ads"
  if (msclkid) return "Microsoft Ads"
  if (utmSource === "instagram") return "Instagram"
  if (utmMedium === "email") return "Email"
  if (utmSource === "whatsapp") return "WhatsApp"
  if (utmSource || utmMedium) return "Referral"
  if (referrer) {
    try {
      const host = new URL(referrer).hostname.replace(/^www\./, "")
      if (host.includes("google.")) return "Organic Search"
      if (host.includes("instagram.com")) return "Instagram"
      if (host.includes("facebook.com")) return "Referral"
      if (host && !host.includes("dreamislands.org")) return "Referral"
    } catch {
      /* ignore invalid referrer URL */
    }
  }
  return "Direct"
}

function deriveMarketCountry(params: URLSearchParams): string {
  const explicit = params.get("market")
  if (explicit) return explicit.length <= 3 ? explicit.toUpperCase() : explicit
  const campaign = (params.get("utm_campaign") || "").toLowerCase()
  for (const key of Object.keys(MARKET_BY_CAMPAIGN)) {
    if (campaign.includes(key)) return MARKET_BY_CAMPAIGN[key]
  }
  return "Unknown"
}

export function captureAttribution(): void {
  if (typeof window === "undefined") return
  const existing = document.cookie.match(new RegExp("(?:^|; )" + ATTR_COOKIE + "=([^;]*)"))
  if (existing) return
  const params = new URLSearchParams(window.location.search)
  const referrer = document.referrer || ""
  const attribution: Attribution = {
    market_country: deriveMarketCountry(params),
    traffic_channel: deriveTrafficChannel(params, referrer),
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
    utm_term: params.get("utm_term"),
    gclid: params.get("gclid"),
    fbclid: params.get("fbclid"),
    ttclid: params.get("ttclid"),
    msclkid: params.get("msclkid"),
    landing_page: window.location.pathname,
    referrer,
  }
  document.cookie =
    ATTR_COOKIE + "=" + encodeURIComponent(JSON.stringify(attribution)) + "; path=/; max-age=" + ATTR_MAX_AGE + "; SameSite=Lax"
}

export function getAttribution(): Attribution | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp("(?:^|; )" + ATTR_COOKIE + "=([^;]*)"))
  if (!match) return null
  try {
    return JSON.parse(decodeURIComponent(match[1])) as Attribution
  } catch {
    return null
  }
}

export function getSessionId(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(?:^|;\s*)(_ga_[A-Z0-9]+)=([^;]+)/)
  if (!match) return null
  const value = decodeURIComponent(match[2])
  const parts = value.split(".")
  if (parts.length >= 3) return parts[2]
  return null
}
