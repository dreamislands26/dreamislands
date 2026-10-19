"use client"
import { useState } from "react"
import { Photo } from "./cards"
import { Dialog } from "./overlay"
import { Icon } from "./ui"
import s from "./gallery.module.css"

/** Airbnb-style grid: one large photo, four small, "Show all photos" opens the full set. */
export default function Gallery({ images, title }: { images: { url: string; alt: string }[]; title: string }) {
  const [open, setOpen] = useState(false)
  const shown = images.slice(0, 5)
  if (shown.length === 0) return <Photo src={null} alt={title} className={s.single} />
  return (
    <div className={s.wrap}>
      <div className={shown.length >= 5 ? s.grid : s.gridSmall}>
        {shown.map((im, i) => (
          <button key={im.url + i} type="button" className={s.cell} onClick={() => setOpen(true)} aria-label={`Open photo ${i + 1}`}>
            <Photo src={im.url} alt={im.alt} priority={i === 0} sizes={i === 0 ? "(max-width: 768px) 100vw, 600px" : "300px"} />
          </button>
        ))}
      </div>
      {images.length > 1 && (
        <button type="button" className={s.all} onClick={() => setOpen(true)}>
          <Icon name="grid_view" />
          Show all photos
        </button>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title={title} wide>
        <div className={s.list}>
          {images.map((im, i) => (
            <Photo key={im.url + i} src={im.url} alt={im.alt} sizes="640px" className={s.listItem} />
          ))}
        </div>
      </Dialog>
    </div>
  )
}
