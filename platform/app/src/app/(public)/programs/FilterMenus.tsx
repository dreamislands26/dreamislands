"use client"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Button, Icon } from "../ds/ui"
import c from "./catalog.module.css"

export type FilterMenu = { key: string; label: string; value?: string; options: { label: string; href: string; on: boolean }[] }

/** S5 "More filters": tonal M buttons with a trailing arrow. Each opens a menu (desktop) or a sheet (mobile). */
export default function FilterMenus({ menus }: { menus: FilterMenu[] }) {
  const [open, setOpen] = useState<string | null>(null)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(null) }
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null) }
    document.addEventListener("mousedown", close)
    document.addEventListener("keydown", esc)
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc) }
  }, [open])
  return (
    <div className={c.more} ref={root}>
      {menus.map((m) => (
        <div key={m.key} className={c.menuWrap}>
          <Button variant="tonal" trailingIcon="arrow_forward" aria-expanded={open === m.key} onClick={() => setOpen(open === m.key ? null : m.key)}>
            {m.value ? `${m.label}: ${m.value}` : m.label}
          </Button>
          {open === m.key && (
            <>
              <div className={c.menuScrim} onClick={() => setOpen(null)} aria-hidden />
              <div className={c.menu} role="menu" aria-label={m.label}>
                <p className={c.menuTitle}>{m.label}</p>
                {m.options.map((o) => (
                  <Link key={o.label} href={o.href} role="menuitemradio" aria-checked={o.on} className={c.menuItem} onClick={() => setOpen(null)} scroll={false}>
                    <span>{o.label}</span>
                    {o.on && <Icon name="check" />}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
