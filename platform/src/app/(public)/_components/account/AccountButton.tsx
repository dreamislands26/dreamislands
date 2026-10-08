"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { initialsOf, useAccount } from "./AuthProvider"

/** Header slot: "Log in" for visitors, avatar + menu once signed in. */
export default function AccountButton() {
  const { session, openAuth, signOut } = useAccount()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  // Reserve the slot while the session loads so the header doesn't jump.
  if (!session) return <span style={{ width: 36, height: 36, display: "inline-block" }} aria-hidden />

  if (!session.signedIn) {
    return (
      <button type="button" className="acct-login" onClick={() => openAuth({ reason: "login" })}>
        Log in
      </button>
    )
  }

  const staff = session.role !== "user"
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="acct-avatar"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
      >
        {initialsOf(session.name, session.email)}
      </button>
      {open && (
        <div className="acct-menu" role="menu">
          <Link
            href={staff ? (session.role === "admin" ? "/admin" : "/partner") : "/profile"}
            className="acct-menu-head"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            <span className="acct-avatar" style={{ "--size": "40px", cursor: "inherit" } as React.CSSProperties} aria-hidden>
              {initialsOf(session.name, session.email)}
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", color: "var(--ink)", fontSize: 14 }}>{session.name ?? "Your profile"}</span>
              <span className="body-sm" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>
                {session.email}
              </span>
            </span>
          </Link>
          {staff ? (
            <Link href={session.role === "admin" ? "/admin" : "/partner"} onClick={() => setOpen(false)} role="menuitem">
              Open the panel
            </Link>
          ) : (
            <>
              <Link href="/profile" onClick={() => setOpen(false)} role="menuitem">My Wellness Journey</Link>
              <Link href="/profile/programs" onClick={() => setOpen(false)} role="menuitem">My programs</Link>
              <Link href="/profile/details" onClick={() => setOpen(false)} role="menuitem">Profile details</Link>
            </>
          )}
          <button type="button" role="menuitem" onClick={() => { setOpen(false); void signOut() }}>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
