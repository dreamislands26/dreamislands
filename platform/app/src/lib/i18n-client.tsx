"use client"
import { createContext, useContext } from "react"
import { format, type Locale } from "./i18n"

const Ctx = createContext<{ locale: Locale; messages: Record<string, string> }>({ locale: "en", messages: {} })

export function LocaleProvider({ locale, messages, children }: { locale: Locale; messages: Record<string, string>; children: React.ReactNode }) {
  return <Ctx.Provider value={{ locale, messages }}>{children}</Ctx.Provider>
}

export function useLocale(): Locale {
  return useContext(Ctx).locale
}

export function useT() {
  const { messages } = useContext(Ctx)
  return (key: string, vars?: Record<string, string | number>) => format(messages[key] ?? key, vars)
}
