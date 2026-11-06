"use client"
// Whole-card taps (Oleg 06.11.2026): a tap anywhere on a [data-card] that misses its own links and buttons
// presses the card's main action: the element marked [data-card-primary], else the card's first link.
// One delegated listener for the public site, so cards stay server components and keep their layout.
import { useEffect } from "react"

const OWN_CONTROL = "a[href],button,input,select,textarea,label,summary,[role=button],[data-card-skip]"

export default function CardClick() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return
      const target = e.target instanceof Element ? e.target : null
      const card = target?.closest("[data-card]")
      if (!target || !card) return
      const control = target.closest(OWN_CONTROL)
      if (control && card.contains(control)) return
      if (String(window.getSelection?.() ?? "").length > 0) return // selecting text, not tapping
      const go = card.querySelector<HTMLElement>("[data-card-primary]") ?? card.querySelector<HTMLElement>("a[href]")
      if (!go) return
      go.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window, metaKey: e.metaKey, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey }))
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [])
  return null
}
