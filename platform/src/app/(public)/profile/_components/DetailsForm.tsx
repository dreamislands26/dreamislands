"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useAccount } from "../../_components/account/AuthProvider"

type Values = { name: string; whatsapp: string; country: string }

export default function DetailsForm({ email, initial }: { email: string; initial: Values }) {
  const router = useRouter()
  const { refresh, signOut } = useAccount()
  const [values, setValues] = useState<Values>(initial)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const dirty = JSON.stringify(values) !== JSON.stringify(initial)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setStatus(null)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.success) {
        setStatus({ ok: false, text: json.error ?? "Couldn't save. Please try again." })
        return
      }
      setStatus({ ok: true, text: "Saved" })
      await refresh()
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const field = (key: keyof Values, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <label style={{ display: "block" }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      <input
        className="field"
        value={values[key]}
        onChange={(e) => setValues({ ...values, [key]: e.target.value })}
        {...props}
      />
    </label>
  )

  return (
    <section className="card profile-card" style={{ maxWidth: 620 }}>
      <div className="eyebrow" style={{ marginBottom: 12 }}>Profile</div>
      <h2 className="display" style={{ fontSize: 32, margin: "0 0 20px", color: "var(--ink)" }}>How we reach you</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
        <label style={{ display: "block" }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Email · used to sign in</div>
          <input className="field" value={email} readOnly style={{ color: "var(--ink-3)" }} />
        </label>
        {field("name", "Name", { autoComplete: "name", placeholder: "Alex Carter" })}
        {field("whatsapp", "WhatsApp", { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "+65 9123 4567" })}
        {field("country", "Country", { autoComplete: "country-name", placeholder: "Singapore" })}
        {status && (
          <div className={status.ok ? "tag" : "acct-error"} role="status" style={{ justifySelf: "start" }}>
            {status.text}
          </div>
        )}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
          <button type="submit" className="btn btn-primary" disabled={busy || !dirty}>
            {busy ? "Saving…" : "Save changes"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </form>
    </section>
  )
}
