"use client"

import { useEffect, useRef, useState } from "react"
import { Icon } from "../Icon"
import { useAccount } from "./AuthProvider"

export type AuthReason = "login" | "save"

const COPY = {
  login: {
    eyebrow: "Your profile",
    title: "Log in to Dream Islands",
    text: "Your score, how it changes, and your programs — in one place. We'll email you a one-time code, no password.",
    cta: "Send code",
  },
  save: {
    eyebrow: "Save your report",
    title: "Create an account to save your result",
    text: "Keep your score and see how it changes before, during and after your journey. We'll email you a one-time code — no password.",
    cta: "Save my report",
  },
} as const

export function authTitle(reason: AuthReason): string {
  return COPY[reason].title
}

/**
 * Email → one-time code → signed in. Used in the header modal and inline on
 * the assessment result. `onDone` runs after a successful sign-in.
 */
export default function AuthForm({
  reason,
  initialEmail,
  onDone,
  onCancel,
  titleSize = 30,
}: {
  reason: AuthReason
  initialEmail?: string
  onDone: () => void
  onCancel?: () => void
  titleSize?: number
}) {
  const { refresh } = useAccount()
  const [step, setStep] = useState<"email" | "code">("email")
  const [email, setEmail] = useState(initialEmail ?? "")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const codeRef = useRef<HTMLInputElement>(null)
  const copy = COPY[reason]

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await fetch("/api/auth/guest-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const json = await res.json().catch(() => ({}))
      if (typeof json.retryIn === "number") setCooldown(json.retryIn)
      if (!res.ok || !json.success) {
        // A code already on its way still lets the guest continue to the code step.
        if (res.status === 429) setStep("code")
        setError(json.error ?? "Couldn't send the code. Please try again.")
        return
      }
      setStep("code")
      setCode("")
      setTimeout(() => codeRef.current?.focus(), 50)
    } finally {
      setBusy(false)
    }
  }

  async function verify(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.success) {
        setError(json.error ?? "That code didn't work.")
        return
      }
      await refresh()
      onDone()
    } finally {
      setBusy(false)
    }
  }

  const title = (text: string) => (
    <h2 className="display" style={{ fontSize: titleSize, margin: "0 0 10px", color: "var(--ink)" }}>{text}</h2>
  )

  if (step === "email") {
    return (
      <form onSubmit={sendCode}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>{copy.eyebrow}</div>
        {title(copy.title)}
        <p className="body" style={{ margin: "0 0 22px" }}>{copy.text}</p>
        <label style={{ display: "block", marginBottom: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Email</div>
          <input
            className="field"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="alex@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        {error && <div className="acct-error" role="alert" style={{ marginBottom: 14 }}>{error}</div>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Sending…" : copy.cta} {!busy && <Icon.arrow width={16} height={16} />}
        </button>
        {onCancel && (
          <button type="button" className="acct-link" style={{ display: "block", margin: "16px auto 0", color: "var(--ink-3)" }} onClick={onCancel}>
            Not now
          </button>
        )}
      </form>
    )
  }

  return (
    <form onSubmit={verify}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>Check your inbox</div>
      {title("Enter your code")}
      <p className="body" style={{ margin: "0 0 22px" }}>
        We sent a one-time code to <span style={{ color: "var(--ink)" }}>{email}</span>. It expires in one hour.
      </p>
      <input
        ref={codeRef}
        className="field acct-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={10}
        placeholder="••••••"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        aria-label="One-time code"
        required
      />
      {error && <div className="acct-error" role="alert" style={{ marginTop: 14 }}>{error}</div>}
      <button type="submit" className="btn btn-primary btn-block" disabled={busy || code.length < 6} style={{ marginTop: 16 }}>
        {busy ? "Checking…" : "Continue"} {!busy && <Icon.arrow width={16} height={16} />}
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, gap: 12 }}>
        <button type="button" className="acct-link" onClick={() => { setStep("email"); setError(null) }}>
          Change email
        </button>
        <button type="button" className="acct-link" disabled={cooldown > 0 || busy} onClick={() => sendCode()}>
          {cooldown > 0 ? `Resend code in ${cooldown} s` : "Resend code"}
        </button>
      </div>
    </form>
  )
}
