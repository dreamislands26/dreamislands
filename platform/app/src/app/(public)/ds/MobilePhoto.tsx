"use client"
// CF3/CF2 mobile: full-bleed photo with back / share / save over it and a "1 / N" counter.
import { useState } from "react"
import { useSafeBack } from "./navHistory"
import { Photo } from "./cards"
import { Dialog } from "./overlay"
import { IconButton } from "./ui"
import { isSaved, toggleSaved, useSaved, type SavedItem } from "./saved"
import s from "./mobilePhoto.module.css"

export default function MobilePhoto({ images, title, fallback, save }: { images: { url: string; alt: string }[]; title: string; fallback: string; save?: SavedItem }) {
  const back = useSafeBack(fallback)
  const [open, setOpen] = useState(false)
  const [i, setI] = useState(0)
  const list = useSaved()
  const saved = save ? isSaved(list, save.kind, save.id) : false

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title, url: window.location.href })
      else await navigator.clipboard.writeText(window.location.href)
    } catch {
      // dismissed
    }
  }

  return (
    <div className={s.mPhoto}>
      <div
        className={s.mPhotoTrack}
        onScroll={(e) => {
          const el = e.currentTarget
          setI(Math.round(el.scrollLeft / el.clientWidth))
        }}
      >
        {(images.length ? images : [{ url: "", alt: title }]).slice(0, 12).map((im, k) => (
          <button key={im.url + k} type="button" className={s.mPhotoSlide} onClick={() => setOpen(true)} aria-label="Open photos">
            <Photo src={im.url || null} alt={im.alt} sizes="100vw" priority={k === 0} />
          </button>
        ))}
      </div>
      <div className={s.mPhotoBar}>
        <IconButton icon="arrow_back" label="Back" variant="photo" onClick={back} />
        <div className={s.mPhotoActions}>
          <IconButton icon="ios_share" label="Share" variant="photo" onClick={share} />
          {save && <IconButton icon="favorite" fill={saved} label={saved ? "Remove from saved" : "Save"} variant="photo" onClick={() => toggleSaved(save)} />}
        </div>
      </div>
      {images.length > 1 && <span className={s.mCounter}>{i + 1} / {Math.min(images.length, 12)}</span>}
      <Dialog open={open} onClose={() => setOpen(false)} title={title} wide>
        <div style={{ display: "grid", gap: 8 }}>
          {images.map((im, k) => <Photo key={im.url + k} src={im.url} alt={im.alt} sizes="640px" style={{ aspectRatio: "3 / 2" }} />)}
        </div>
      </Dialog>
    </div>
  )
}
