"use client"
// CF3/CF2 mobile: full-bleed photo under the site header, back / share / save over it and page dots (PageDots) at the bottom centre.
import { useEffect, useRef, useState } from "react"
import { useSafeBack } from "./navHistory"
import { Photo } from "./cards"
import { Dialog } from "./overlay"
import { IconButton } from "./ui"
import { isSaved, toggleSaved, useSaved, type SavedItem } from "./saved"
import s from "./mobilePhoto.module.css"
import PageDots from "./PageDots"

export default function MobilePhoto({ images, title, fallback, save }: { images: { url: string; alt: string }[]; title: string; fallback: string; save?: SavedItem }) {
  const back = useSafeBack(fallback)
  const [open, setOpen] = useState(false)
  const track = useRef<HTMLDivElement>(null)
  const list = useSaved()
  const saved = save ? isSaved(list, save.kind, save.id) : false
  const box = useRef<HTMLDivElement>(null)
  // Full-screen photo (Oleg 07.11.2026): at the top of the page, pulling the content sheet down grows the
  // photo with the finger; let go far enough and the photo fills the screen, the sheet leaves it entirely and
  // the bottom bar floats (CSS on html[data-photo-full]). A swipe up on the photo, or Back, brings it back.
  const [full, setFull] = useState(false)
  const fullRef = useRef(false)
  useEffect(() => {
    fullRef.current = full
    const html = document.documentElement
    if (full) html.dataset.photoFull = "1"
    else delete html.dataset.photoFull
    return () => { delete html.dataset.photoFull }
  }, [full])
  useEffect(() => {
    const photo = box.current
    if (!photo || !window.matchMedia("(max-width: 767px)").matches) return
    const THRESHOLD = 90
    let x0 = 0, y0 = 0, dy = 0, decided = false, active = false, base = 0
    const start = (e: TouchEvent) => {
      if (e.touches.length !== 1 || (!fullRef.current && window.scrollY > 1)) { decided = true; active = false; return }
      const t = e.target as Element | null
      if (t?.closest("[data-own-bar], [role=dialog], input, textarea, select")) { decided = true; active = false; return }
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dy = 0; decided = false; active = false
      base = photo.offsetHeight
    }
    const move = (e: TouchEvent) => {
      if (decided && !active) return
      const dx = e.touches[0].clientX - x0
      dy = e.touches[0].clientY - y0
      if (!decided) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
        decided = true
        active = Math.abs(dy) > Math.abs(dx) && (fullRef.current ? dy < 0 : dy > 0)
        if (!active) return
        photo.style.transition = "none"
      }
      e.preventDefault()
      photo.style.height = `${Math.max(0, base + dy * (fullRef.current ? 1 : 0.9))}px`
    }
    const end = () => {
      if (!active) return
      active = false
      photo.style.transition = ""
      photo.style.height = ""
      if (!fullRef.current && dy > THRESHOLD) setFull(true)
      else if (fullRef.current && dy < -THRESHOLD) setFull(false)
    }
    document.addEventListener("touchstart", start, { passive: true })
    document.addEventListener("touchmove", move, { passive: false })
    document.addEventListener("touchend", end)
    document.addEventListener("touchcancel", end)
    return () => {
      document.removeEventListener("touchstart", start)
      document.removeEventListener("touchmove", move)
      document.removeEventListener("touchend", end)
      document.removeEventListener("touchcancel", end)
    }
  }, [])

  // How far the page's content sheet has risen over the photo towards the header, 0..1, as --photo-p on
  // the root: the sheet's corners unfold with it (program.module.css, place.module.css), like the home hero.
  useEffect(() => {
    const photo = box.current
    if (!photo) return
    const root = document.documentElement
    const update = () => {
      // The sheet overlaps the photo by 1.75rem and meets the header after scrolling the rest of it
      const overlap = 1.75 * parseFloat(getComputedStyle(root).fontSize)
      const range = photo.offsetHeight - overlap
      root.style.setProperty("--photo-p", range > 0 ? String(Math.min(1, Math.max(0, window.scrollY / range))) : "0")
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
      root.style.removeProperty("--photo-p")
    }
  }, [])

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title, url: window.location.href })
      else await navigator.clipboard.writeText(window.location.href)
    } catch {
      // dismissed
    }
  }

  return (
    <div ref={box} className={s.mPhoto}>
      <div
        ref={track}
        className={s.mPhotoTrack}
      >
        {(images.length ? images : [{ url: "", alt: title }]).slice(0, 12).map((im, k) => (
          <button key={im.url + k} type="button" className={s.mPhotoSlide} onClick={() => { if (!full) setOpen(true) }} aria-label="Open photos">
            <Photo src={im.url || null} alt={im.alt} sizes="100vw" priority={k === 0} />
          </button>
        ))}
      </div>
      <div className={s.mPhotoBar}>
        <IconButton icon="arrow_back" label="Back" variant="photo" onClick={() => (full ? setFull(false) : back())} />
        <div className={s.mPhotoActions}>
          <IconButton icon="ios_share" label="Share" variant="photo" onClick={share} />
          {save && <IconButton icon="favorite" fill={saved} label={saved ? "Remove from saved" : "Save"} variant="photo" onClick={() => toggleSaved(save)} />}
        </div>
      </div>
      <PageDots count={Math.min(images.length, 12)} scroller={track} className={s.mDots} />
      <Dialog open={open} onClose={() => setOpen(false)} title={title} wide>
        <div style={{ display: "grid", gap: 8 }}>
          {images.map((im, k) => <Photo key={im.url + k} src={im.url} alt={im.alt} sizes="640px" style={{ aspectRatio: "3 / 2" }} />)}
        </div>
      </Dialog>
    </div>
  )
}
