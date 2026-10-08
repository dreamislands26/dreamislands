"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import AuthModal, { type AuthRequest } from "./AuthModal"
import SignOutDialog from "./SignOutDialog"

export type Session =
  | { signedIn: false }
  | { signedIn: true; role: "user" | "admin" | "partner"; email: string; name: string | null }

type Ctx = {
  session: Session | null
  refresh: () => Promise<Session>
  openAuth: (req?: AuthRequest) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<Ctx | null>(null)

export function useAccount(): Ctx {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAccount must be used inside <AuthProvider>")
  return ctx
}

export function initialsOf(name: string | null, email: string): string {
  const src = (name ?? "").trim()
  if (src) {
    const parts = src.split(/\s+/).filter(Boolean)
    return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase()
  }
  return (email[0] ?? "·").toUpperCase()
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [request, setRequest] = useState<AuthRequest | null>(null)

  const refresh = useCallback(async (): Promise<Session> => {
    try {
      const res = await fetch("/api/profile/session", { cache: "no-store" })
      const s = (await res.json()) as Session
      setSession(s)
      return s
    } catch {
      const s: Session = { signedIn: false }
      setSession(s)
      return s
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch("/api/profile/session", { cache: "no-store" })
      .then((res) => res.json() as Promise<Session>)
      .then((s) => !cancelled && setSession(s))
      .catch(() => !cancelled && setSession({ signedIn: false }))
    return () => {
      cancelled = true
    }
  }, [])

  const openAuth = useCallback((req?: AuthRequest) => setRequest(req ?? { reason: "login" }), [])

  const [confirmOut, setConfirmOut] = useState(false)
  // Callers ask to sign out; the confirmation dialog does the actual sign-out.
  const signOut = useCallback(async () => setConfirmOut(true), [])
  const doSignOut = useCallback(async () => {
    await fetch("/api/auth/signout", { method: "POST" })
    setSession({ signedIn: false })
    window.location.href = "/"
  }, [])

  return (
    <AuthContext.Provider value={{ session, refresh, openAuth, signOut }}>
      {children}
      {request && <AuthModal request={request} onClose={() => setRequest(null)} />}
      {confirmOut && <SignOutDialog onCancel={() => setConfirmOut(false)} onConfirm={doSignOut} />}
    </AuthContext.Provider>
  )
}
