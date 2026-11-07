"use client"
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { IconButton, cx } from "./ui"
import s from "./overlay.module.css"

const noopSubscribe = () => () => {}

/** Kept for existing callers: the site's one sheet is BottomSheet (Oleg 07.11.2026), this only stacks the
 *  content with the dialog spacing. A centred dialog on desktop, the bottom sheet on phones. */
export function Dialog({ open, onClose, title, wide, back, children }: { open: boolean; onClose: () => void; title?: ReactNode; wide?: boolean; back?: () => void; children: ReactNode }) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title} wide={wide} back={back}>
      <div className={s.stack}>{children}</div>
    </BottomSheet>
  )
}

/** Sticky bottom bar on mobile detail pages: price left, main action right. */
export function BottomActionBar({ price, sub, children }: { price: ReactNode; sub?: ReactNode; children: ReactNode }) {
  return (
    <>
      <div className={s.actionBarSpacer} aria-hidden />
      <div className={s.actionBar} data-own-bar="action">
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

/** Bottom sheet (Figma "Bottom sheet", fixed DS pattern), THE sheet of the site: every sheet and dialog uses
 *  it (Oleg 07.11.2026). Top corners 36, handle, centred title, close 12px from the edges (optional back on
 *  the left), scrolling body, sticky footer whose shadow shows only while content runs under it. Swipe down
 *  on the head, or on the body once it is scrolled to the top; tap the scrim or press Escape to close.
 *  On desktop it is a centred dialog. `tall` keeps it at full height (support chat), `wide` widens the
 *  desktop dialog (photos). */
export function BottomSheet({ open, onClose, title, footer, tall, wide, back, children }: { open: boolean; onClose: () => void; title?: ReactNode; footer?: ReactNode; tall?: boolean; wide?: boolean; back?: () => void; children: ReactNode }) {
  const sheet = useRef<HTMLDivElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    // Keyboard users land inside the sheet (it shows no ring itself, see overlay.module.css)
    sheet.current?.focus()
    // Footer shadow only while there is more content below, and not on open: it shows once the body has
    // been scrolled (Oleg 07.11.2026, the shadow on a just-opened sheet read as a glitch)
    const b = body.current, sh = sheet.current
    let scrolled = false
    const sync = () => { if (b && sh) sh.dataset.more = scrolled && b.scrollTop + b.clientHeight < b.scrollHeight - 2 ? "1" : "" }
    // Phones: scrolling the body takes the sheet full screen over the header with the site's unfold (as the
    // programme sheet over its photo): over the header's height of scroll, --fp goes 0..1, the sheet rises
    // over the header, its corners grow and it widens past both edges until the arc is gone (Oleg 07.11.2026)
    const header = () => document.querySelector("[class*=mtop]")?.getBoundingClientRect().bottom || 56
    let raf = 0
    const unfold = () => {
      raf = 0
      if (!sh || !b) return
      const p = window.innerWidth >= 768 ? 0 : Math.min(1, Math.max(0, b.scrollTop / header()))
      sh.style.setProperty("--fp", p.toFixed(3))
    }
    const onScroll = () => {
      scrolled = true
      sync()
      if (!raf) raf = requestAnimationFrame(unfold)
    }
    sync()
    b?.addEventListener("scroll", onScroll, { passive: true })
    const ro = typeof ResizeObserver !== "undefined" && b ? new ResizeObserver(sync) : null
    if (ro && b) { ro.observe(b); if (b.firstElementChild) ro.observe(b.firstElementChild) }
    // Swipe down to close (phones): from the head always, from the body only at its top so it still scrolls
    let startY: number | null = null, dy = 0, dragging = false
    const onStart = (e: TouchEvent) => {
      if (!sh || window.innerWidth >= 768) return
      startY = e.touches[0].clientY; dy = 0
      const inHead = !!(e.target as Element).closest(`.${s.bsHead}`)
      dragging = inHead || !b || b.scrollTop <= 0
    }
    const onMove = (e: TouchEvent) => {
      if (!sh || startY === null || !dragging) return
      const d = e.touches[0].clientY - startY
      if (d <= 0) { if (dy > 0) { dy = 0; sh.style.transform = "" } return }
      if (e.cancelable) e.preventDefault()
      dy = d
      sh.style.transition = "none"
      sh.style.transform = `translateY(${d}px)`
    }
    const onEnd = () => {
      if (!sh || startY === null) return
      startY = null
      sh.style.transition = "transform 0.2s cubic-bezier(0.2, 0, 0, 1)"
      if (dy > 90) { sh.style.transform = "translateY(100%)"; window.setTimeout(onClose, 180) }
      else sh.style.transform = ""
      dy = 0
    }
    sh?.addEventListener("touchstart", onStart, { passive: true })
    sh?.addEventListener("touchmove", onMove, { passive: false })
    sh?.addEventListener("touchend", onEnd)
    sh?.addEventListener("touchcancel", onEnd)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener("keydown", onKey)
      b?.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(raf)
      ro?.disconnect()
      sh?.removeEventListener("touchstart", onStart)
      sh?.removeEventListener("touchmove", onMove)
      sh?.removeEventListener("touchend", onEnd)
      sh?.removeEventListener("touchcancel", onEnd)
    }
  }, [open, onClose, mounted])
  if (!open || !mounted) return null
  return createPortal(
    <div className={s.sheetScrim} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={sheet} tabIndex={-1} role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined} className={cx(s.bs, tall && s.bsTall, wide && s.bsWide)}>
        <div className={s.bsHead}>
          <span className={s.bsHandle} aria-hidden />
          {back && <IconButton icon="arrow_back" label="Back" className={s.bsBack} onClick={back} />}
          {title && <h2 className={cx("ds-headline-s", s.bsTitle)}>{title}</h2>}
          <IconButton icon="close" label="Close" className={s.bsClose} onClick={onClose} />
        </div>
        <div ref={body} className={s.bsBody}>{children}</div>
        {footer && <div className={s.bsFoot}>{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
