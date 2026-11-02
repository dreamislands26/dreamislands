import { headers } from "next/headers"
import en from "@/messages/en.json"
import zh from "@/messages/zh.json"
import id from "@/messages/id.json"
import { format, isLocale, type Locale } from "./i18n"

const ALL: Record<Locale, Record<string, string>> = { en, zh, id }

export async function getLocale(): Promise<Locale> {
  const v = (await headers()).get("x-locale")
  return isLocale(v) ? v : "en"
}

/** Clean path (no locale prefix) of the current request, set by proxy.ts. */
export async function getPathname(): Promise<string> {
  return (await headers()).get("x-pathname") || "/"
}

/** English fills any key a locale has not translated yet. */
export function getMessages(locale: Locale): Record<string, string> {
  return { ...ALL.en, ...ALL[locale] }
}

export async function getT(locale?: Locale) {
  const m = getMessages(locale ?? (await getLocale()))
  return (key: string, vars?: Record<string, string | number>) => format(m[key] ?? key, vars)
}
