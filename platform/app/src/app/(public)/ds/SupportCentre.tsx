"use client"
// Support centre page /support (Oleg 06.11.2026; the footer links here): the most asked questions as
// cards, an FAQ button and a support chat button, other contacts. FAQ and chat open in the DS
// BottomSheet (a centred dialog on desktop). A card opens the FAQ on its question.
//
// The chat is UI only for now. When Cura goes live its widget mounts into [data-support-chat] instead of
// the local thread below (see the brief for Cura), and the sheet stays ours.
import { useEffect, useRef, useState, type FormEvent } from "react"
import { useT } from "@/lib/i18n-client"
import { BottomSheet } from "./overlay"
import { Badge, Button, Chip, Faq, Icon, IconButton, SectionHead } from "./ui"
import { CHAT_STARTERS, POPULAR_IDS, SUPPORT_TOPICS, findQuestion } from "../_lib/supportFaq"
import s from "./supportCentre.module.css"
import x from "./sections.module.css"

type Sheet = { kind: "faq"; id?: string } | { kind: "chat" } | null

const WHATSAPP = "https://wa.me/66811612662"

export default function SupportCentre() {
  const t = useT()
  const [sheet, setSheet] = useState<Sheet>(null)
  const close = () => setSheet(null)
  const popular = POPULAR_IDS.map(findQuestion).filter((q) => !!q)

  return (
    <div className="ds-container">
      <header className={x.pageHead}>
        <h1 className="ds-display-s">{t("Support centre")}</h1>
        <p className="ds-body-l ds-muted">{t("Quick answers to common questions, or chat with us. A coordinator takes over when you need a person.")}</p>
        <div className={s.actions}>
          <Button variant="tonal" size="l" icon="help" onClick={() => setSheet({ kind: "faq" })}>FAQ</Button>
          <Button variant="filled" size="l" icon="forum" onClick={() => setSheet({ kind: "chat" })}>{t("Chat with us")}</Button>
        </div>
      </header>

      <section className={x.section}>
        <SectionHead title={t("Common questions")} action={<button type="button" className={s.allLink} onClick={() => setSheet({ kind: "faq" })}>{t("See All")}</button>} />
        <div className={s.cards}>
          {popular.map((q) => (
            <button key={q.id} type="button" className={s.card} onClick={() => setSheet({ kind: "faq", id: q.id })}>
              <Badge icon={q.icon} size="s" />
              <span className={s.cardQ}>{t(q.q)}</span>
              <Icon name="arrow_forward" className={s.cardGo} />
            </button>
          ))}
        </div>
      </section>

      <section className={`${x.section} ${x.last}`}>
        <SectionHead title={t("Other ways to reach us")} />
        <div className={s.contacts}>
          <a className={s.contact} href={WHATSAPP} target="_blank" rel="noreferrer">
            <Badge icon="chat" size="s" />
            <span><span className="ds-title-m">WhatsApp</span><span className="ds-body-m ds-muted">+66 81 161 2662</span></span>
          </a>
          <a className={s.contact} href="mailto:hello@dreamislands.org">
            <Badge icon="email" size="s" />
            <span><span className="ds-title-m">{t("Email")}</span><span className="ds-body-m ds-muted">hello@dreamislands.org</span></span>
          </a>
        </div>
      </section>

      <BottomSheet
        open={sheet?.kind === "faq"}
        onClose={close}
        title="FAQ"
        footer={
          <>
            <span className={s.footNote}>{t("Didn’t find your answer?")}</span>
            <Button variant="filled" size="l" icon="forum" onClick={() => setSheet({ kind: "chat" })}>{t("Chat with us")}</Button>
          </>
        }
      >
        {sheet?.kind === "faq" && <FaqBody openId={sheet.id} />}
      </BottomSheet>

      <BottomSheet open={sheet?.kind === "chat"} onClose={close} title={t("Support chat")} tall footer={<Composer />}>
        {sheet?.kind === "chat" && <ChatThread />}
      </BottomSheet>
    </div>
  )
}

function FaqBody({ openId }: { openId?: string }) {
  // Bring the tapped question into view once the sheet is drawn
  useEffect(() => {
    if (openId) requestAnimationFrame(() => document.getElementById(`faq-${openId}`)?.scrollIntoView({ block: "start" }))
  }, [openId])
  return (
    <div className={s.topics}>
      {SUPPORT_TOPICS.map((topic) => (
        <section key={topic.id} className={s.topic}>
          <h3 className="ds-title-l">{topic.title}</h3>
          <Faq items={topic.items} openId={openId} />
        </section>
      ))}
    </div>
  )
}

type Msg = { from: "agent" | "me"; text: string; whatsapp?: boolean }

// Thread and composer share state through a tiny store: the composer sits in the sheet's sticky footer.
let push: ((m: Msg) => void) | null = null

function ChatThread() {
  const t = useT()
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "agent", text: "Hi! I can help you choose a programme, check dates and prices, or explain how booking works. What would you like to know?" },
  ])
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    push = (m) => {
      setMsgs((list) => [...list, m])
      // UI only until the chat is connected: an honest holding reply
      if (m.from === "me") setTimeout(() => setMsgs((list) => [...list, { from: "agent", text: "Thanks! The chat is being connected right now. For a quick answer, message us on WhatsApp and a coordinator will reply.", whatsapp: true }]), 600)
    }
    return () => { push = null }
  }, [])
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }) }, [msgs])
  const started = msgs.some((m) => m.from === "me")
  return (
    <div className={s.chat} data-support-chat>
      <div className={s.agent}>
        <Badge icon="support_agent" size="s" />
        <div>
          <p className="ds-title-m">Dream Islands</p>
          <p className="ds-body-s ds-muted">{t("AI assistant, a coordinator joins when needed")}</p>
        </div>
      </div>
      <div className={s.thread} aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={m.from === "me" ? s.me : s.them}>
            <p>{m.from === "me" ? m.text : t(m.text)}</p>
            {m.whatsapp && <a className={s.wa} href={WHATSAPP} target="_blank" rel="noreferrer">WhatsApp <Icon name="arrow_forward" /></a>}
          </div>
        ))}
        {!started && (
          <div className={s.starters}>
            {CHAT_STARTERS.map((q) => <Chip key={q} size="s" onClick={() => push?.({ from: "me", text: q })}>{t(q)}</Chip>)}
          </div>
        )}
        <div ref={end} />
      </div>
    </div>
  )
}

function Composer() {
  const t = useT()
  const [text, setText] = useState("")
  const send = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    push?.({ from: "me", text: text.trim() })
    setText("")
  }
  return (
    <form className={s.composer} onSubmit={send}>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t("Type a message")} aria-label={t("Message")} enterKeyHint="send" />
      <IconButton type="submit" icon="send" label={t("Send")} variant="filled" disabled={!text.trim()} />
    </form>
  )
}
