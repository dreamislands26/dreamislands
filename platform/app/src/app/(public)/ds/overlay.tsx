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
    // Phones: swipe the sheet down to close (Oleg 07.11.2026). From the handle or head it always drags;
    // from the body only once the content is scrolled to the top, so scrolling inside still works.
    const el = ref.current
    let startY: number | null = null, dy = 0, dragging = false
    const onStart = (e: TouchEvent) => {
      if (!el || window.innerWidth >= 768) return
      startY = e.touches[0].clientY; dy = 0
      dragging = !!(e.target as Element).closest(`.${s.handle}, .${s.head}`) || el.scrollTop <= 0
    }
    const onMove = (e: TouchEvent) => {
      if (!el || startY === null || !dragging) return
      const d = e.touches[0].clientY - startY
      if (d <= 0) { if (dy > 0) { dy = 0; el.style.transform = "" } return }
      if (e.cancelable) e.preventDefault()
      dy = d
      el.style.transition = "none"
      el.style.transform = `translateY(${d}px)`
    }
    const onEnd = () => {
      if (!el || startY === null) return
      startY = null
      el.style.transition = "transform 0.2s cubic-bezier(0.2, 0, 0, 1)"
      if (dy > 90) { el.style.transform = "translateY(100%)"; window.setTimeout(onClose, 180) }
      else el.style.transform = ""
      dy = 0
    }
    el?.addEventListener("touchstart", onStart, { passive: true })
    el?.addEventListener("touchmove", onMove, { passive: false })
    el?.addEventListener("touchend", onEnd)
    el?.addEventListener("touchcancel", onEnd)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener("keydown", onKey)
      el?.removeEventListener("touchstart", onStart)
      el?.removeEventListener("touchmove", onMove)
      el?.removeEventListener("touchend", onEnd)
      el?.removeEventListener("touchcancel", onEnd)
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
 *  it. Swipe down on the head, tap the scrim or press Escape to close. `tall` keeps it at full height
 *  whatever the content (support chat). */
export function BottomSheet({ open, onClose, title, footer, tall, children }: { open: boolean; onClose: () => void; title: ReactNode; footer?: ReactNode; tall?: boolean; children: ReactNode }) {
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
      <div ref={sheet} role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined} className={cx(s.bs, tall && s.bsTall)}>
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
