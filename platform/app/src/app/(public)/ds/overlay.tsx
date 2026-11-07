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
    sheet.current?.focus({ preventScroll: true }) // no scroll: the sheet is still sliding in from below
    // Footer shadow only while there is more content below, and not on open: it shows once the body has
    // been scrolled (Oleg 07.11.2026, the shadow on a just-opened sheet read as a glitch)
    const b = body.current, sh = sheet.current
    let scrolled = false
    const sync = () => { if (b && sh) sh.dataset.more = scrolled && b.scrollTop + b.clientHeight < b.scrollHeight - 2 ? "1" : "" }
    const onScroll = () => { scrolled = true; sync() }
    sync()
    b?.addEventListener("scroll", onScroll, { passive: true })
    const ro = typeof ResizeObserver !== "undefined" && b ? new ResizeObserver(sync) : null
    if (ro && b) { ro.observe(b); if (b.firstElementChild) ro.observe(b.firstElementChild) }
    // Phones: two resting points, switched by a swipe (Oleg 07.11.2026). Under the header (open) and full
    // screen over it, reached with the site's unfold (--fp 0..1, as the programme sheet over its photo: the
    // sheet rises over the header, its corners grow and it widens past both edges until the arc is gone).
    // Swipe up unfolds (when the content does not fit); full, a swipe down from the head or from the top of
    // the content folds it back; folded, a swipe down closes. Scrolling the content never changes the point.
    const header = () => document.querySelector("[class*=mtop]")?.getBoundingClientRect().bottom || 56
    const EASE = "cubic-bezier(0.2, 0, 0, 1)"
    let full = false
    const setFp = (p: number) => sh?.style.setProperty("--fp", p.toFixed(3))
    let startY: number | null = null, startX = 0, dy = 0, mode: "unfold" | "fold" | "close" | "none" | null = null
    let inHead = false, atTop = true, canUnfold = false, H = 56
    const onStart = (e: TouchEvent) => {
      if (!sh || window.innerWidth >= 768) return
      startY = e.touches[0].clientY; startX = e.touches[0].clientX; dy = 0; mode = null
      inHead = !!(e.target as Element).closest(`.${s.bsHead}`)
      atTop = !b || b.scrollTop <= 0
      canUnfold = !!b && (b.scrollHeight > b.clientHeight + 2 || sh.classList.contains(s.bsTall))
      H = header()
    }
    const onMove = (e: TouchEvent) => {
      if (!sh || startY === null || mode === "none") return
      const d = e.touches[0].clientY - startY, dx = e.touches[0].clientX - startX
      if (mode === null) {
        if (Math.max(Math.abs(d), Math.abs(dx)) < 6) return
        if (Math.abs(dx) > Math.abs(d)) { mode = "none"; return }
        if (d < 0) mode = !full && canUnfold ? "unfold" : "none"
        else mode = inHead || atTop ? (full ? "fold" : "close") : "none"
        if (mode === "none") return
        sh.style.transition = "none"
      }
      if (e.cancelable) e.preventDefault()
      dy = d
      if (mode === "unfold") setFp(Math.min(1, Math.max(0, -d / H)))
      else if (mode === "fold") setFp(Math.min(1, Math.max(0, 1 - d / H)))
      else if (mode === "close") sh.style.transform = d > 0 ? `translateY(${d}px)` : ""
    }
    const onEnd = () => {
      if (!sh || startY === null) return
      startY = null
      const m = mode
      mode = null
      if (!m || m === "none") return
      sh.style.transition = `transform 0.2s ${EASE}, --fp 0.3s ${EASE}`
      // Folding stops at the open point; closing takes a swipe of its own
      const closing = m === "close" && dy > 90
      if (closing) { sh.style.transform = "translateY(100%)"; window.setTimeout(onClose, 180); return }
      sh.style.transform = ""
      if (m === "unfold") full = -dy > H * 0.3
      if (m === "fold") full = dy < H * 0.3
      setFp(full ? 1 : 0)
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
