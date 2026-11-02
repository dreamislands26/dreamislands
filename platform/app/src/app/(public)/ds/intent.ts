/** Free-text search intent: "burnout, 10 days in Thailand from Moscow in November" -> filters.
 *  Pure, no I/O. v1 maps goal/country/length to existing filters; origin and month are kept as chips only
 *  (no availability or flight data yet). */
export type Intent = {
  track?: string
  country?: string
  length?: "short" | "week" | "long"
  days?: number
  from?: string
  when?: string
  recognized: boolean
}

const TRACK_WORDS: Array<[string, RegExp]> = [
  ["SportChill", /\b(active|hiking|surf\w*|dive|diving|swim\w*|cycl\w*|chill|активн\w*)\b/i],
  ["Performance", /\b(performance|athlet\w*|training|triathlon|productiv\w*|longevity|biohack\w*|результат\w*|тренировк\w*)\b/i],
  ["Mind", /\b(anxiety|calm|mind\w*|meditat\w*|mental|panic|тревог\w*|медитац\w*|спокойств\w*)\b/i],
  ["Immersion", /\b(immersion|culture|cultural|spiritual|ayurved\w*|tcm|культур\w*|погруж\w*)\b/i],
  ["Reset", /\b(burnout|sleep|insomnia|stress\w*|tired|fatigue|detox|recover\w*|reset|energy|exhaust\w*|выгоран\w*|сон|стресс\w*|усталост\w*|восстанов\w*|детокс)\b/i],
]

const COUNTRY_ALIASES: Record<string, string[]> = {
  Thailand: ["thailand", "samui", "phuket", "phangan", "chiang mai", "krabi", "таиланд", "тайланд", "самуи", "пхукет"],
  Indonesia: ["indonesia", "bali", "ubud", "lombok", "индонезия", "бали"],
  China: ["china", "wudang", "yunnan", "sanya", "xi'an", "xian", "mile", "китай", "ухань", "юньнань", "санья"],
  Singapore: ["singapore", "sentosa", "сингапур"],
  Philippines: ["philippines", "boracay", "cebu", "филиппины", "боракай"],
  Vietnam: ["vietnam", "da nang", "phu quoc", "вьетнам"],
  Malaysia: ["malaysia", "penang", "langkawi", "bintan", "малайзия", "пенанг"],
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
const MONTH_RU = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]
const MONTH_LABEL = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const WORD_NUM: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, ten: 10, fourteen: 14 }

function lengthKey(d: number): Intent["length"] {
  return d <= 5 ? "short" : d <= 9 ? "week" : "long"
}

export function parseIntent(raw: string, countries: string[]): Intent {
  let t = " " + raw.toLowerCase().replace(/\s+/g, " ").trim() + " "
  const out: Intent = { recognized: false }

  // Origin: "from Moscow" / "из Москвы" (kept as typed, capitalised)
  const fm = t.match(/\b(?:from|departing|flying from|из|вылет из)\s+([a-zа-яё' -]{2,30}?)(?=\s+(?:in|on|for|to|at|в|на|с)\b|[,.;]|\s*$)/i)
  if (fm) {
    out.from = fm[1].trim().replace(/\b\w/g, (c) => c.toUpperCase())
    t = t.replace(fm[0], " ")
  }

  // Length: "10 days", "2 weeks", "a week", "weekend"
  const dm = t.match(/\b(\d{1,2})\s*(?:-|to)?\s*(?:\d{1,2})?\s*(day|days|night|nights|дн\w*|ноч\w*)\b/)
  const wm = t.match(/\b(\d{1,2}|one|two|three|a)\s*(week|weeks|нед\w*)\b/)
  if (dm) out.days = parseInt(dm[1], 10)
  else if (wm) out.days = (WORD_NUM[wm[1]] ?? (wm[1] === "a" ? 1 : parseInt(wm[1], 10))) * 7
  else if (/\bweekend\b|выходные/.test(t)) out.days = 3
  else {
    const wd = t.match(/\b(one|two|three|four|five|six|seven|ten|fourteen)\s*(day|days|night|nights)\b/)
    if (wd) out.days = WORD_NUM[wd[1]]
  }
  if (out.days) out.length = lengthKey(out.days)

  // Month
  for (let i = 0; i < 12; i++) {
    const re = new RegExp("\\b" + MONTHS[i] + "[a-z]*\\b|" + MONTH_RU[i] + "[а-я]*")
    if (re.test(t)) { out.when = MONTH_LABEL[i]; break }
  }

  // Country (use only countries that exist in the catalogue)
  for (const c of countries) {
    const aliases = COUNTRY_ALIASES[c] ?? [c.toLowerCase()]
    if (aliases.some((a) => t.includes(" " + a) || t.includes(a + " "))) { out.country = c; break }
  }

  // Goal -> track (first matching rule in priority order)
  for (const [track, re] of TRACK_WORDS) {
    if (re.test(t)) { out.track = track; break }
  }

  out.recognized = !!(out.track || out.country || out.length)
  return out
}
