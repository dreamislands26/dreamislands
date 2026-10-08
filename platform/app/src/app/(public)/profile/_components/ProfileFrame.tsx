"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { initialsOf, useAccount } from "../../_components/account/AuthProvider"
import type { ProfileState } from "./load"

const TABS = [
  { href: "/profile", label: "Wellness Intelligence" },
  { href: "/profile/programs", label: "Programs" },
  { href: "/profile/messages", label: "Messages" },
  { href: "/profile/details", label: "Profile" },
]

function memberSince(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })
}

/** Profile chrome: sign-in gate for visitors, hero + tabs for guests. */
export default function ProfileFrame({ data, children }: { data: ProfileState; children: React.ReactNode }) {
  const pathname = usePathname()
  const { openAuth, signOut } = useAccount()

  if (data.state === "anon") {
    return (
      <main className="page">
        <section className="shell" style={{ padding: "72px var(--pad) 96px", textAlign: "center" }}>
          <div className="acct-avatar acct-avatar-lg rise" style={{ margin: "0 auto 26px", cursor: "default" }} aria-hidden>
            <svg viewBox="0 0 24 24" width={34} height={34} fill="none" stroke="currentColor" strokeWidth={1.6}>
              <circle cx="12" cy="8.5" r="3.6" />
              <path d="M4.8 19.5c1.4-3.2 4-4.8 7.2-4.8s5.8 1.6 7.2 4.8" strokeLinecap="round" />
            </svg>
          </div>
          <div className="eyebrow rise rise-1" style={{ marginBottom: 12 }}>Dream Islands — Wellness Intelligence</div>
          <h1 className="display rise rise-2" style={{ fontSize: "clamp(36px, 6vw, 56px)", margin: "0 0 14px", color: "var(--ink)" }}>
            My Wellness Journey
          </h1>
          <p className="body-lg rise rise-3" style={{ maxWidth: 520, margin: "0 auto 30px" }}>
            Your Wellbeing &amp; Wellness Score, how it changes before, during and after each journey, and your
            programs — all in one place.
          </p>
          <div className="rise rise-4" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button type="button" className="btn btn-primary" onClick={() => openAuth({ reason: "login" })}>
              Log in with email
            </button>
            <Link href="/start" className="btn btn-ghost">Take the assessment</Link>
          </div>
          <p className="body-sm" style={{ marginTop: 18 }}>No password — we email you a one-time code.</p>
        </section>
      </main>
    )
  }

  if (data.state === "staff") {
    return (
      <main className="page">
        <section className="shell" style={{ padding: "80px var(--pad)", textAlign: "center" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Staff account</div>
          <h1 className="display" style={{ fontSize: 40, margin: "0 0 14px", color: "var(--ink)" }}>
            You&apos;re signed in as {data.role}
          </h1>
          <p className="body" style={{ margin: "0 auto 26px", maxWidth: 460 }}>
            {data.email} is a team account. Guest profiles live here; your tools are in the panel.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={data.role === "admin" ? "/admin" : "/partner"} className="btn btn-primary">Open the panel</Link>
            <button type="button" className="btn btn-ghost" onClick={() => void signOut()}>Sign out</button>
          </div>
        </section>
      </main>
    )
  }

  const { profile } = data.cabinet
  const since = memberSince(profile.member_since)
  return (
    <main className="page">
      <div className="shell">
        <section className="profile-hero">
          <div className="acct-avatar acct-avatar-lg" style={{ cursor: "default" }} aria-hidden>
            {initialsOf(profile.name, data.email)}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Dream Islands — Wellness Intelligence</div>
            <h1 className="display" style={{ fontSize: "clamp(32px, 5vw, 48px)", margin: "0 0 6px", color: "var(--ink)" }}>
              {profile.name ? `Hello, ${profile.name.split(/\s+/)[0]}` : "My Wellness Journey"}
            </h1>
            <div className="body-sm" style={{ color: "var(--ink-2)" }}>
              {data.email}
              {since ? ` · with us since ${since}` : ""}
            </div>
          </div>
        </section>
        <nav className="profile-tabs" aria-label="Profile sections">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className={pathname === t.href ? "active" : ""}>
              {t.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </main>
  )
}
