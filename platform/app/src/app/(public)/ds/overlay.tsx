"use client"
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { IconButton, cx } from "./ui"
import s from "./overlay.module.css"

const noopSubscribe = () => () => {}

/** Dialog on desktop, bottom sheet on mobile. Radius 36, elevation (popups only). */
export function Dialog({ open, onClose, title, wide, children, labelledBy = "ds-dialog-title" }: { open: boolean; onClose: () => void; title?: ReactNode; wide?: boolean; children: ReactNode; labelledBy?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    ref.current?.focus()
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener("keydown", onKey)
    }
  }, [open, onClose, mounted])
  if (!open || !mounted) return null
  return createPortal(
    <div className={s.scrim} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={title ? labelledBy : undefined} className={cx(s.dialog, wide && s.dialogWide)}>
        <span className={s.handle} aria-hidden />
        {title && (
          <div className={s.head}>
            <h2 id={labelledBy} className="ds-headline-s">{title}</h2>
            <IconButton icon="close" label="Close" onClick={onClose} />
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}

/** Sticky bottom bar on mobile detail pages: price left, main action right. */
export function BottomActionBar({ price, sub, children }: { price: ReactNode; sub?: ReactNode; children: ReactNode }) {
  return (
    <>
      <div className={s.actionBarSpacer} aria-hidden />
      <div className={s.actionBar}>
        <div className={s.actionPrice}>
          <strong>{price}</strong>
          {sub && <span>{sub}</span>}
        </div>
        {children}
      </div>
    </>
  )
}

export const overlayStyles = s

/** Bottom sheet (Figma "Bottom sheet", fixed DS pattern): top corners 36, handle, centred title, close
 *  12px from the edges, scrolling body, sticky footer whose shadow shows only while content runs under
 *  it. Swipe down on the head, tap the scrim or press Escape to close. */
export function BottomSheet({ open, onClose, title, footer, children }: { open: boolean; onClose: () => void; title: ReactNode; footer?: ReactNode; children: ReactNode }) {
  const sheet = useRef<HTMLDivElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    // Footer shadow only while there is more content below
    const b = body.current, sh = sheet.current
    const sync = () => { if (b && sh) sh.dataset.more = b.scrollTop + b.clientHeight < b.scrollHeight - 2 ? "1" : "" }
    sync()
    b?.addEventListener("scroll", sync, { passive: true })
    const ro = typeof ResizeObserver !== "undefined" && b ? new ResizeObserver(sync) : null
    if (ro && b) { ro.observe(b); if (b.firstElementChild) ro.observe(b.firstElementChild) }
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener("keydown", onKey)
      b?.removeEventListener("scroll", sync)
      ro?.disconnect()
    }
  }, [open, onClose, mounted])
  // Swipe down on the head to close
  const drag = useRef<{ y: number; dy: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => { drag.current = { y: e.touches[0].clientY, dy: 0 } }
  const onTouchMove = (e: React.TouchEvent) => {
    if (!drag.current || !sheet.current) return
    drag.current.dy = Math.max(0, e.touches[0].clientY - drag.current.y)
    sheet.current.style.transition = "none"
    sheet.current.style.transform = `translateY(${drag.current.dy}px)`
  }
  const onTouchEnd = () => {
    const d = drag.current; drag.current = null
    if (!sheet.current) return
    sheet.current.style.transition = ""
    sheet.current.style.transform = ""
    if (d && d.dy > 90) onClose()
  }
  if (!open || !mounted) return null
  return createPortal(
    <div className={s.sheetScrim} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={sheet} role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined} className={s.bs}>
        <div className={s.bsHead} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <span className={s.bsHandle} aria-hidden />
          <h2 className={cx("ds-headline-s", s.bsTitle)}>{title}</h2>
          <IconButton icon="close" label="Close" className={s.bsClose} onClick={onClose} />
        </div>
        <div ref={body} className={s.bsBody}>{children}</div>
        {footer && <div className={s.bsFoot}>{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
