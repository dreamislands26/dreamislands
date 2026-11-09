"use client"
// Support chat sheet (Oleg 09.11.2026): the Cura chat, framed inside our BottomSheet, so a guest never leaves
// the site. Cura confirmed the chat page embeds as it is, with no extra settings (its own look stays inside
// the frame). One sheet for the whole site, mounted in the public layout: the floating support button and
// "Chat with us" on /support open it through openSupportChat(). Opened anywhere but /support, the sheet
// links to the Support centre below the chat.
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useT } from "@/lib/i18n-client"
import { BottomSheet } from "./overlay"
import { ButtonLink } from "./ui"
import s from "./supportCentre.module.css"

export const CURA_CHAT = "https://app.cura.so/chat/kn70gxkd9bph2tb4gvff3h710586z991"
const OPEN = "dit:support-chat"

export function openSupportChat() {
  window.dispatchEvent(new Event(OPEN))
}

export default function SupportChat() {
  const t = useT()
  const path = usePathname()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const on = () => setOpen(true)
    window.addEventListener(OPEN, on)
    return () => window.removeEventListener(OPEN, on)
  }, [])
  const close = () => setOpen(false)
  const onSupport = /\/support\/?$/.test(path ?? "")
  return (
    <BottomSheet
      open={open}
      onClose={close}
      title={t("Support chat")}
      tall
      footer={
        onSupport ? undefined : (
          <ButtonLink href="/support" variant="tonal" size="l" icon="help" block className={s.chatFootBtn} onClick={close}>{t("Support centre")}</ButtonLink>
        )
      }
    >
      <iframe className={s.frame} src={CURA_CHAT} title={t("Support chat")} allow="clipboard-write" />
    </BottomSheet>
  )
}
