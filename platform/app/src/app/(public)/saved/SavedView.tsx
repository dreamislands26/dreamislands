"use client"
import Link from "next/link"
import { useState } from "react"
import { useAccount } from "../_components/account/AuthProvider"
import { useSaved, type SavedItem } from "../ds/saved"
import SaveButton from "../ds/SaveButton"
import { Badge, Button, ButtonLink, Chip, Icon } from "../ds/ui"
import { JourneyPrompt, Photo, cardStyles as cs } from "../ds/cards"
import x from "../ds/sections.module.css"
import v from "./saved.module.css"

function SavedCard({ item }: { item: SavedItem }) {
  return (
    <article className={cs.program}>
      <Photo src={item.image} alt={item.title}>
        <div className={cs.overlay}>
          <div className={cs.overlayTop}>
            <span />
            <SaveButton item={item} />
          </div>
        </div>
      </Photo>
      <div className={cs.text}>
        <h3 className={cs.title}>
          <Link href={item.href} className={cs.cardLink}>{item.title}</Link>
        </h3>
        {item.meta && <span className={cs.meta}>{item.meta}</span>}
        {item.price && <span className={cs.price}><strong>{item.price}</strong></span>}
      </div>
    </article>
  )
}

export default function SavedView() {
  const list = useSaved()
  const { session, openAuth } = useAccount()
  const [tab, setTab] = useState<"all" | "program" | "place">("all")
  const programs = list.filter((i) => i.kind === "program")
  const places = list.filter((i) => i.kind === "place")
  const shown = tab === "all" ? list : list.filter((i) => i.kind === tab)

  return (
    <div className="ds-container">
      <header className={x.pageHead}>
        <h1 className="ds-display-s">Saved</h1>
      </header>

      {list.length === 0 ? (
        <section className={x.empty}>
          <Badge icon="favorite" />
          <h2 className="ds-headline-m">Nothing saved yet</h2>
          <p className="ds-body-l ds-muted">Tap the heart on any programme or place to keep it here. No sign-up needed.</p>
          <div className={x.emptyActions}>
            <ButtonLink href="/programs" variant="filled" size="l">Explore programmes</ButtonLink>
          </div>
        </section>
      ) : (
        <>
          <div className={v.tabs}>
            <Chip selected={tab === "all"} onClick={() => setTab("all")}>All {list.length}</Chip>
            {programs.length > 0 && <Chip selected={tab === "program"} onClick={() => setTab("program")}>Programmes {programs.length}</Chip>}
            {places.length > 0 && <Chip selected={tab === "place"} onClick={() => setTab("place")}>Places {places.length}</Chip>}
          </div>

          {!(session && session.signedIn) && (
            <div className={v.device}>
              <Icon name="devices" />
              <div>
                <p className="ds-title-m" style={{ margin: 0 }}>Saved on this device</p>
                <p className="ds-body-m ds-muted" style={{ margin: "2px 0 0" }}>Log in with your email to keep your list on every device and share it with someone you travel with.</p>
              </div>
              <Button variant="tonal" onClick={() => openAuth({ reason: "login" })}>Log in</Button>
            </div>
          )}

          <section className={x.section}>
            <div className={cs.gridCards}>
              {shown.map((i) => <SavedCard key={`${i.kind}-${i.id}`} item={i} />)}
            </div>
          </section>

          <section className={`${x.sectionLoose} ${x.last}`}>
            <JourneyPrompt title="Not sure which one to pick?" sub="Take your Wellness Journey: we rank your saved programmes by how well they fit." cta="Start your Wellness Journey" />
          </section>
        </>
      )}
    </div>
  )
}
