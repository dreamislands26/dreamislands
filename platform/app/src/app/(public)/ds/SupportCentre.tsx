"use client"
// Support centre page /support (Oleg 06.11.2026; the footer links here): the most asked questions as
// cards, an FAQ button and a support chat button, other contacts. FAQ and chat open in the DS
// BottomSheet (a centred dialog on desktop). A card opens the FAQ on its question.
//
// "Chat with us" opens the site-wide support chat sheet (SupportChat.tsx, the Cura chat in our sheet).
import { useEffect, useState } from "react"
import { useT } from "@/lib/i18n-client"
import { BottomSheet } from "./overlay"
import { Badge, Button, Faq, Icon, SectionHead } from "./ui"
import { openSupportChat } from "./SupportChat"
import { POPULAR_IDS, SUPPORT_TOPICS, findQuestion } from "../_lib/supportFaq"
import s from "./supportCentre.module.css"
import x from "./sections.module.css"

type Sheet = { kind: "faq"; id?: string } | null

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
          <Button variant="filled" size="l" icon="forum" onClick={openSupportChat}>{t("Chat with us")}</Button>
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
            <Button variant="filled" size="l" icon="forum" onClick={() => { close(); openSupportChat() }}>{t("Chat with us")}</Button>
          </>
        }
      >
        {sheet?.kind === "faq" && <FaqBody openId={sheet.id} />}
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

