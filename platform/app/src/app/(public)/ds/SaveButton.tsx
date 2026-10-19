"use client"
import { useState } from "react"
import { Icon } from "./ui"
import FavoriteIcon from "./Favorite"
import { isSaved, toggleSaved, useSaved, type SavedItem } from "./saved"
import s from "./cards.module.css"

/** Favorite heart on photos (DS "Favorite"), or an inline "Save" text button. localStorage only. */
export default function SaveButton({ item, variant = "photo" }: { item: SavedItem; variant?: "photo" | "inline" }) {
  const list = useSaved()
  const saved = isSaved(list, item.kind, item.id)
  const [toast, setToast] = useState<string | null>(null)

  function onClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const now = toggleSaved(item)
    setToast(now ? "Saved to your list" : "Removed from saved")
    window.setTimeout(() => setToast(null), 2200)
  }

  return (
    <>
      <button
        type="button"
        className={variant === "photo" ? s.save : s.saveInline}
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved" : "Save"}
        onClick={onClick}
      >
        {variant === "photo" ? (
          <FavoriteIcon saved={saved} />
        ) : (
          <>
            <Icon name="favorite" fill={saved} className={saved ? s.saveOn : undefined} />
            <span>{saved ? "Saved" : "Save"}</span>
          </>
        )}
      </button>
      {toast && (
        <div className={s.toast} role="status">
          <Icon name={saved ? "favorite" : "heart_broken"} fill={saved} />
          <span>{toast}</span>
          {saved && <a href="/saved" className={s.toastLink}>View</a>}
        </div>
      )}
    </>
  )
}
