"use client"
// Support chat sheet (Oleg 09.11.2026): the Cura chat inside our BottomSheet, in our look.
//
// Cura's widget script (loaded in the public layout) draws its chat into the page itself, as plain DOM in
// #cura-chat-root, with its own launcher and floating panel. We hide both and, while our sheet is open, move
// that root into the sheet body and open it there. supportCentre.module.css restyles it: no Cura header (our
// sheet head shows the title and the real connection status read from the widget), our background, bubbles,
// chips, input and send button. "Powered by Cura" stays, the agent requires it. On close the root goes back
// to <body> (hidden, see landing.css) and the widget is closed, so it stops polling.
//
// One sheet for the whole site: the floating support button and "Chat with us" on /support open it through
// openSupportChat(). Opened anywhere but /support, it links to the Support centre below the chat.
//
// The widget only talks to its server from https://dreamislands.org (the agent's allowed origin), so on
// localhost the sheet shows "Chat unavailable"; to try it locally, serve the dev site under that origin.
import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { useT } from "@/lib/i18n-client"
import { BottomSheet } from "./overlay"
import { ButtonLink } from "./ui"
import s from "./supportCentre.module.css"

const OPEN = "dit:support-chat"

export function openSupportChat() {
  window.dispatchEvent(new Event(OPEN))
}

type Status = "connecting" | "online" | "reconnecting" | "unavailable"
const LABEL: Record<Status, string> = { connecting: "Connecting…", online: "Online", reconnecting: "Reconnecting…", unavailable: "Chat unavailable" }

/** The parts of Cura's widget controller we use. Not a documented API, so every read is guarded. */
type CuraController = { openPanel?: () => unknown; closePanel?: () => unknown; isOpen?: () => boolean; session?: unknown; phase?: string; stopped?: boolean }
const controller = () => (window as unknown as { cura?: { __controller?: CuraController } }).cura?.__controller

export default function SupportChat() {
  const t = useT()
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status>("connecting")
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
      title={
        <>
          {t("Support chat")}
          <span className={s.status} data-status={status} role="status">
            <span className={s.statusDot} aria-hidden />
            {t(LABEL[status])}
          </span>
        </>
      }
      tall
      footer={
        onSupport ? undefined : (
          <ButtonLink href="/support" variant="tonal" size="l" icon="help" block className={s.chatFootBtn} onClick={close}>{t("Support centre")}</ButtonLink>
        )
      }
    >
      {open && <CuraSlot onStatus={setStatus} />}
    </BottomSheet>
  )
}

/** Hosts Cura's chat while the sheet is open and reports its connection state. */
function CuraSlot({ onStatus }: { onStatus: (s: Status) => void }) {
  const slot = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const here = slot.current
    if (!here) return
    let root: HTMLElement | null = null
    const started = Date.now()
    const tick = () => {
      if (!root) {
        root = document.getElementById("cura-chat-root")
        const c = controller()
        if (!root || !c) {
          // The script is late or failed (blocked, offline, wrong origin): give up after 12 seconds
          onStatus(Date.now() - started > 12000 ? "unavailable" : "connecting")
          return
        }
        here.appendChild(root)
        if (!c.isOpen?.()) c.openPanel?.()
      }
      // Quick replies as a keyboard over the input, as in Telegram (Oleg 09.11.2026): the widget keeps
      // filling the same #cura-chat-suggestions node, and inserts messages without it once it has left
      // the thread, so moving it once is enough.
      const sug = root.querySelector("#cura-chat-suggestions"), composer = root.querySelector("#cura-chat-composer")
      if (sug && composer && sug.nextElementSibling !== composer) composer.before(sug)
      const c = controller()
      const banner = root.querySelector("#cura-chat-banner")?.textContent ?? ""
      if (!c || c.stopped || c.phase === "error") onStatus("unavailable")
      else if (/reconnect/i.test(banner)) onStatus("reconnecting")
      else if (c.session) onStatus("online")
      else onStatus(Date.now() - started > 12000 ? "unavailable" : "connecting")
    }
    tick()
    const timer = window.setInterval(tick, 500)
    return () => {
      window.clearInterval(timer)
      const c = controller()
      if (c?.isOpen?.()) c.closePanel?.()
      if (root && root.parentElement === here) document.body.appendChild(root)
    }
  }, [onStatus])
  return <div ref={slot} className={s.cura} translate="no" />
}
