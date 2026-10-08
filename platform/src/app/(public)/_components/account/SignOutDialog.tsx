"use client"

import { useEffect, useState } from "react"

/** "Sign out?" confirmation — on confirm the guest lands on the home page. */
export default function SignOutDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onCancel])

  return (
    <div className="acct-overlay" role="alertdialog" aria-modal="true" aria-labelledby="signout-title" onClick={onCancel}>
      <div className="acct-sheet" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="acct-pane" style={{ textAlign: "center" }}>
          <h2 id="signout-title" className="display" style={{ fontSize: 28, margin: "0 0 10px", color: "var(--ink)" }}>
            Sign out?
          </h2>
          <p className="body" style={{ margin: "0 0 24px" }}>
            Your profile stays saved. To come back, log in with your email — we&apos;ll send a new code.
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                await onConfirm()
              }}
            >
              {busy ? "Signing out…" : "Sign out"}
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={onCancel} autoFocus>
              Stay signed in
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
