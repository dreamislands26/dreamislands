"use client"
// Shown once per language when a visitor switches to Chinese or Indonesian (Oleg 07.11.2026): the translation is
// automatic for now while specialists prepare a proper one. Written in the chosen language itself.
import { useEffect, useState } from "react"
import { useLocale } from "@/lib/i18n-client"
import { BottomSheet } from "../ds/overlay"
import { Button } from "../ds/ui"

const COPY = {
  zh: { title: "当前为自动翻译", body: "我们正在与专业译者合作，打造更准确的中文版本。如发现错误，敬请谅解。", ok: "知道了" },
  id: { title: "Terjemahan ini masih otomatis", body: "Kami sedang bekerja sama dengan penerjemah profesional untuk menyiapkan terjemahan yang lebih baik. Mohon maklum jika ada kesalahan.", ok: "Mengerti" },
} as const

export default function LocaleNotice() {
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const key = `di_autotr_seen_${locale}`
  useEffect(() => {
    if (locale === "en") return
    let seen = false
    try { seen = localStorage.getItem(key) === "1" } catch {}
    if (seen) return
    // After the first paint, so the page shows under the sheet
    const t = window.setTimeout(() => setOpen(true), 300)
    return () => window.clearTimeout(t)
  }, [locale, key])
  if (locale === "en") return null
  const c = COPY[locale]
  const close = () => { setOpen(false); try { localStorage.setItem(key, "1") } catch {} }
  return (
    <BottomSheet open={open} onClose={close} title={<span translate="no">{c.title}</span>} footer={<Button variant="filled" size="l" block onClick={close}><span translate="no">{c.ok}</span></Button>}>
      <p className="ds-body-l" style={{ margin: 0, padding: "0 0.75rem" }} translate="no">{c.body}</p>
    </BottomSheet>
  )
}
