"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Brand from "./Brand"
import AccountButton from "./account/AccountButton"
import { COUNTRIES, COUNTRY_FLAGS, countrySlug } from "../_lib/countries"

// Trimmed to the product architecture a first-time visitor needs, in order:
// Outcomes -> Programs -> Destinations -> How it works -> About, with a
// single right-side action. "Partnership" lives in the footer only; "Book
// now" is dropped from the global nav (program/property pages already carry
// their own booking CTA independent of this nav).
const LINKS_BEFORE_DEST = [
  { href: "/#outcomes", label: "Outcomes" },
  { href: "/programs", label: "Programs" },
]
const LINKS_AFTER_DEST = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
]

export default function TopNav({ programs = [] }: { programs?: { id: string; name: string }[] }) {
  const pathname = usePathname()
  const [destOpen, setDestOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileDestOpen, setMobileDestOpen] = useState(false)
  const destActive = pathname.startsWith("/destinations") || pathname.startsWith("/properties")

  function closeMobileMenu() {
    setMobileOpen(false)
    setMobileDestOpen(false)
  }

  function renderLink(l: { href: string; label: string }) {
    const active = l.href.startsWith("/#") ? false : pathname.startsWith(l.href)
    return (
      <Link key={l.label} href={l.href} className={active ? "active" : ""}>
        {l.label}
      </Link>
    )
  }

  const destDropdown = (
    <div
      className="topnav-dropdown"
      onMouseEnter={() => setDestOpen(true)}
      onMouseLeave={() => setDestOpen(false)}
    >
      <button
        type="button"
        className={"topnav-dropdown-trigger" + (destActive ? " active" : "")}
        onClick={() => setDestOpen((v) => !v)}
        aria-expanded={destOpen}
      >
        Destinations
      </button>
      {destOpen && (
        <div className="topnav-dropdown-menu">
          <Link href="/destinations" onClick={() => setDestOpen(false)}>
            All destinations
          </Link>
          <Link href="/properties" onClick={() => setDestOpen(false)}>
            All properties
          </Link>
          <div className="topnav-dropdown-divider" />
          {COUNTRIES.map((c) => (
            <Link key={c} href={"/destinations/" + countrySlug(c)} onClick={() => setDestOpen(false)}>
              {(COUNTRY_FLAGS[c] ?? "") + " " + c}
            </Link>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Brand size={36} />
        <nav className="topnav-links">
          {LINKS_BEFORE_DEST.map(renderLink)}
          {destDropdown}
          {LINKS_AFTER_DEST.map(renderLink)}
        </nav>
        <button
          type="button"
          className="topnav-menu-btn"
          aria-label="Menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <AccountButton />
          <Link href="/start" className="btn btn-primary topnav-cta">
            Take Assessment
          </Link>
        </div>
      </div>
      {mobileOpen && (
        <div className="topnav-mobile-menu">
          {LINKS_BEFORE_DEST.map((l) => (
            <Link key={l.label} href={l.href} className="topnav-mobile-link" onClick={closeMobileMenu}>
              {l.label}
            </Link>
          ))}
          <div className="topnav-mobile-dropdown">
            <button
              type="button"
              className="topnav-mobile-dropdown-trigger"
              onClick={() => setMobileDestOpen((v) => !v)}
              aria-expanded={mobileDestOpen}
            >
              Destinations
              <span className="topnav-mobile-caret">{mobileDestOpen ? "−" : "+"}</span>
            </button>
            {mobileDestOpen && (
              <div className="topnav-mobile-submenu">
                <Link href="/destinations" onClick={closeMobileMenu}>
                  All destinations
                </Link>
                <Link href="/properties" onClick={closeMobileMenu}>
                  All properties
                </Link>
                <div className="topnav-dropdown-divider" />
                {COUNTRIES.map((c) => (
                  <Link key={c} href={"/destinations/" + countrySlug(c)} onClick={closeMobileMenu}>
                    {(COUNTRY_FLAGS[c] ?? "") + " " + c}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {LINKS_AFTER_DEST.map((l) => (
            <Link key={l.label} href={l.href} className="topnav-mobile-link" onClick={closeMobileMenu}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
