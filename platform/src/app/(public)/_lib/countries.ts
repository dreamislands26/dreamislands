export const COUNTRY_FLAGS: Record<string, string> = {
  Thailand: "🇹🇭",
  China: "🇨🇳",
  Indonesia: "🇮🇩",
  Singapore: "🇸🇬",
  Philippines: "🇵🇭",
  Vietnam: "🇻🇳",
  Malaysia: "🇲🇾",
}

export const COUNTRIES = Object.keys(COUNTRY_FLAGS)

export function countrySlug(country: string): string {
  return country.toLowerCase()
}

export function countryFromSlug(slug: string): string | null {
  const match = COUNTRIES.find((c) => countrySlug(c) === slug.toLowerCase())
  return match ?? null
}
