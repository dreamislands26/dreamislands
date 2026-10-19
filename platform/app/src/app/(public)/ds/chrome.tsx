"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { initialsOf, useAccount } from "../_components/account/AuthProvider"
import { COUNTRIES, countrySlug } from "../_lib/countries"
import { Icon, IconLink, ButtonLink, cx } from "./ui"
import { useSafeBack, useTrackNav } from "./navHistory"
import s from "./chrome.module.css"
import Flag from "./Flag"

export function Logo({ size = "m", href = "/" }: { size?: "s" | "m"; href?: string }) {
  return (
    <Link href={href} className={cx(s.logo, size === "s" && s.logoS)} aria-label="Dream Islands, home">
      <span className={s.mark} aria-hidden />
      <span className={s.word}>Dream Islands</span>
    </Link>
  )
}


const TRACK_LINKS = [
  { href: "/tracks/reset-recovery", label: "Reset & Recovery" },
  { href: "/tracks/performance", label: "Performance" },
  { href: "/tracks/mind-balance", label: "Mind Balance" },
  { href: "/tracks/island-immersion", label: "Island Immersion" },
  { href: "/tracks/sport-chill", label: "Sport & Chill" },
]

function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close()
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open, close])
  return ref
}

function NavMenu({ label, active, children }: { label: string; active: boolean; children: (close: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const ref = useOutside(open, close)
  return (
    <div className={s.menuWrap} ref={ref}>
      <button type="button" className={cx(s.link, active && s.linkActive)} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {label}
        <Icon name="expand_more" />
      </button>
      {open && <div className={s.menu} role="menu">{children(close)}</div>}
    </div>
  )
}

/** Account slot as on production: "Log in" for visitors, avatar + menu once signed in. */
export function Account({ variant, loginLabel = "Log in" }: { variant?: "photo"; loginLabel?: string }) {
  const { session, openAuth, signOut } = useAccount()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const ref = useOutside(open, close)
  if (!session) return <span className={s.slot} aria-hidden />
  if (!session.signedIn) {
    return (
      <button type="button" className={cx(s.loginBtn, variant === "photo" && s.loginPhoto)} onClick={() => openAuth({ reason: "login" })}>
        {loginLabel}
      </button>
    )
  }
  const staff = session.role !== "user"
  const panel = session.role === "admin" ? "/admin" : "/partner"
  const initials = initialsOf(session.name, session.email)
  return (
    <div className={s.menuWrap} ref={ref}>
      <button type="button" className={s.avatarBtn} aria-haspopup="menu" aria-expanded={open} aria-label="Account menu" onClick={() => setOpen((v) => !v)}>
        {initials}
      </button>
      {open && (
        <div className={cx(s.menu, s.menuRight)} role="menu">
          <Link href={staff ? panel : "/profile"} className={s.menuHead} onClick={close} role="menuitem">
            <span className={cx(s.avatarBtn, s.avatarLg)} aria-hidden>{initials}</span>
            <span className={s.menuHeadText}>
              <span className="ds-title-s">{session.name ?? "Your profile"}</span>
              <span className="ds-body-s ds-muted">{session.email}</span>
            </span>
          </Link>
          {staff ? (
            <Link href={panel} className={s.menuItem} onClick={close} role="menuitem"><Icon name="dashboard" />Open the panel</Link>
          ) : (
            <>
              <Link href="/profile" className={s.menuItem} onClick={close} role="menuitem"><Icon name="monitoring" />My Wellness Journey</Link>
              <Link href="/profile/programs" className={s.menuItem} onClick={close} role="menuitem"><Icon name="spa" />My programmes</Link>
              <Link href="/profile/details" className={s.menuItem} onClick={close} role="menuitem"><Icon name="person" />Profile details</Link>
            </>
          )}
          <div className={s.menuDivider} />
          <button type="button" className={s.menuItem} role="menuitem" onClick={() => { close(); void signOut() }}>
            <Icon name="logout" />Sign out
          </button>
        </div>
      )}
    </div>
  )
}

/** Production navigation: Outcomes, Programs, Destinations (all, properties, countries), How it works, About. */
const NAV_BEFORE = [
  { href: "/#outcomes", label: "Outcomes" },
  { href: "/programs", label: "Programmes" },
]
const NAV_AFTER = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
]

/** Mobile menu (hamburger) with the production links; the destinations list unfolds in place. */
export function MobileMenu({ variant }: { variant?: "photo" }) {
  const [open, setOpen] = useState(false)
  const [dest, setDest] = useState(false)
  const close = () => { setOpen(false); setDest(false) }
  return (
    <>
      <button type="button" className={cx(s.burger, variant === "photo" && s.burgerPhoto)} aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Icon name={open ? "close" : "menu"} />
      </button>
      {open && (
        <div className={s.sheetScrim} onClick={close}>
          <nav className={s.sheet} aria-label="Menu" onClick={(e) => e.stopPropagation()}>
            {NAV_BEFORE.map((l) => <Link key={l.label} href={l.href} className={s.sheetLink} onClick={close}>{l.label}</Link>)}
            <button type="button" className={s.sheetLink} aria-expanded={dest} onClick={() => setDest((v) => !v)}>
              Destinations<Icon name={dest ? "remove" : "add"} />
            </button>
            {dest && (
              <div className={s.sheetSub}>
                <Link href="/destinations" onClick={close}>All destinations</Link>
                <Link href="/properties" onClick={close}>All properties</Link>
                <div className={s.menuDivider} />
                {COUNTRIES.map((c) => <Link key={c} href={"/destinations/" + countrySlug(c)} onClick={close}><Flag of={c} /> {c}</Link>)}
              </div>
            )}
            {NAV_AFTER.map((l) => <Link key={l.label} href={l.href} className={s.sheetLink} onClick={close}>{l.label}</Link>)}
          </nav>
        </div>
      )}
    </>
  )
}

/** Desktop top app bar (≥768), production navigation and the Take Assessment action. */
export function TopAppBar() {
  const pathname = usePathname()
  const is = (p: string) => pathname === p || pathname.startsWith(p + "/")
  if (FOCUS.test(pathname)) return null
  return (
    <header className={s.topbar}>
      <div className={s.topbarInner}>
        <Logo />
        <nav className={s.links} aria-label="Main">
          {NAV_BEFORE.map((l) => (
            <Link key={l.label} href={l.href} className={cx(s.link, !l.href.startsWith("/#") && is(l.href) && s.linkActive)}>{l.label}</Link>
          ))}
          <NavMenu label="Destinations" active={is("/destinations") || is("/properties")}>
            {(close) => (
              <>
                <Link href="/destinations" className={s.menuItem} onClick={close} role="menuitem"><Icon name="public" />All destinations</Link>
                <Link href="/properties" className={s.menuItem} onClick={close} role="menuitem"><Icon name="apartment" />All properties</Link>
                <div className={s.menuDivider} />
                {COUNTRIES.map((c) => (
                  <Link key={c} href={"/destinations/" + countrySlug(c)} className={s.menuItem} onClick={close} role="menuitem">
                    <Flag of={c} />{c}
                  </Link>
                ))}
              </>
            )}
          </NavMenu>
          {NAV_AFTER.map((l) => (
            <Link key={l.label} href={l.href} className={cx(s.link, !l.href.startsWith("/#") && is(l.href) && s.linkActive)}>{l.label}</Link>
          ))}
        </nav>
        <div className={s.actions}>
          <IconLink icon="favorite" label="Saved" href="/saved" />
          <Account />
          <ButtonLink href="/start" variant="filled" size="m">Take Assessment</ButtonLink>
        </div>
      </div>
    </header>
  )
}

/** Focus mode: the Wellness Journey hides the site chrome. */
const FOCUS = /^\/start(\/|$)/

/** Routes that draw their own mobile top bar (photo-first detail pages). */
const OWN_MOBILE_BAR = [/^\/programs$/, /^\/programs\/[^/]+$/, /^\/properties\/[^/]+$/, /^\/destinations\/[^/]+\/medical$/, /^\/start/]

export function MobileTopBar() {
  const pathname = usePathname()
  // Home draws the logo inside its hero (Figma S1 mobile).
  if (pathname === "/" || OWN_MOBILE_BAR.some((r) => r.test(pathname))) return null
  return (
    <div className={s.mtop}>
      <div className={s.mtopRow}>
        <Logo size="s" />
        <div className={s.mtopActions}>
          <Account />
          <ButtonLink href="/start" variant="filled" size="m" className={s.mtopCta}>Take Assessment</ButtonLink>
          <MobileMenu />
        </div>
      </div>
    </div>
  )
}

/** Back bar for nested mobile pages. */
export function MobileBackBar({ title, fallback = "/", action }: { title?: string; fallback?: string; action?: React.ReactNode }) {
  const back = useSafeBack(fallback)
  return (
    <div className={s.mtop}>
      <div className={s.mtopBack}>
        <button
          type="button"
          className="ds-icon-btn"
          aria-label="Back"
          onClick={back}
          style={{ width: 40, height: 40, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--ds-on-surface-variant)" }}
        >
          <Icon name="arrow_back" size={20} />
        </button>
        <span className={s.mtopTitle}>{title}</span>
        {action ?? <span style={{ width: 40 }} />}
      </div>
    </div>
  )
}

const TABS = [
  { href: "/", icon: "travel_explore", label: "Explore", match: (p: string) => p === "/" || p.startsWith("/destinations") || p.startsWith("/properties") || p.startsWith("/guides") || p.startsWith("/about") },
  { href: "/programs", icon: "spa", label: "Programmes", match: (p: string) => p.startsWith("/programs") || p.startsWith("/tracks") },
  { href: "/profile", icon: "monitoring", label: "My Journey", match: (p: string) => p.startsWith("/profile") || p.startsWith("/matched") || p.startsWith("/start") },
  { href: "/saved", icon: "favorite", label: "Saved", match: (p: string) => p.startsWith("/saved") },
]

/** Mobile tab bar (<768): capsule with 4 tabs + a separate search circle, App Store style. */
/** Labels show at rest and while scrolling up; scrolling down folds the bar to icons only. */
function useCollapsedOnScroll() {
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (y < 80) setCollapsed(false)
      else if (y > last + 6) setCollapsed(true)
      else if (y < last - 6) setCollapsed(false)
      if (Math.abs(y - last) > 6) last = y
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  return collapsed
}

/** Records in-site navigation for the on-page back arrows (see navHistory.ts). */
export function NavTracker() {
  useTrackNav()
  return null
}

export function NavigationBar() {
  const pathname = usePathname()
  const collapsed = useCollapsedOnScroll()
  // Detail pages and the Wellness Journey own the bottom edge (action bar / focus mode).
  if (OWN_MOBILE_BAR.some((r) => r.test(pathname)) && !/\/medical$/.test(pathname)) return null
  return (
    <>
      <div className={s.tabbarSpacer} aria-hidden />
      <nav className={cx(s.tabbar, collapsed && s.tabbarMin)} aria-label="Tabs" data-tabbar>
        <div className={s.tabsCap}>
          {TABS.map((t) => {
            const active = t.match(pathname)
            return (
              <Link key={t.href} href={t.href} className={cx(s.tab, active && s.tabActive)} aria-label={t.label} aria-current={active ? "page" : undefined}>
                <Icon name={t.icon} fill={active && t.icon === "favorite"} />
                <span className={s.tabLabel} aria-hidden>{t.label}</span>
              </Link>
            )
          })}
        </div>
        <Link href="/programs" className={s.searchCircle} aria-label="Search">
          <Icon name="search" />
        </Link>
      </nav>
    </>
  )
}

const PANEL_LOGIN_URL = `${(process.env.NEXT_PUBLIC_PANEL_SITE_URL || "https://panel.dreamislands.org").replace(/\/$/, "")}/login`

export function Footer() {
  const pathname = usePathname()
  if (FOCUS.test(pathname)) return null
  return (
    <footer className={s.footer}>
      <div className={s.footerInner}>
        <div className={s.footerTop}>
          <div className={s.footerAbout}>
            <Logo />
            <p className="ds-body-m ds-muted" style={{ margin: 0, maxWidth: 360 }}>
              The wellness intelligence and travel platform for Asia. Baseline first. Match intelligently. Measure what changed.
            </p>
          </div>
          <div className={s.footerCol}>
            <h3>Explore</h3>
            <Link href="/programs" className={s.footerLink}>Programmes</Link>
            <Link href="/destinations" className={s.footerLink}>Destinations</Link>
            <Link href="/start" className={s.footerLink}>Wellness Journey</Link>
            <Link href="/guides/sleep-reset-retreats-asia" className={s.footerLink}>Guides</Link>
          </div>
          <div className={cx(s.footerCol, s.footerColTracks)}>
            <h3>Tracks</h3>
            {TRACK_LINKS.slice(0, 4).map((t) => (
              <Link key={t.href} href={t.href} className={s.footerLink}>{t.label}</Link>
            ))}
          </div>
          <div className={s.footerCol}>
            <h3>Company</h3>
            <Link href="/about" className={s.footerLink}>About</Link>
            <Link href="/how-wbs-works" className={s.footerLink}>How it works</Link>
            <Link href="/reviews" className={s.footerLink}>Reviews</Link>
            <Link href="/for-properties" className={s.footerLink}>For properties</Link>
            <a href={PANEL_LOGIN_URL} className={s.footerLink} target="_blank" rel="noreferrer">Partner login</a>
          </div>
        </div>
        <div className={s.footerBottom}>
          <span className={s.footerFlags}>{COUNTRIES.map((c) => <Flag key={c} of={c} />)}<span>&nbsp;We host in {COUNTRIES.length} countries</span></span>
          <span>
            © {new Date().getFullYear()} Dream Islands<span className="ds-sep" />
            <a href="mailto:hello@dreamislands.org">Contact</a><span className="ds-sep" />
            <a href="https://wa.me/66811612662" target="_blank" rel="noreferrer">WhatsApp</a>
          </span>
        </div>
      </div>
    </footer>
  )
}
