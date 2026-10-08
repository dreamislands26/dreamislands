"use client"

import { useState, useRef, type FormEvent } from "react"
import { track } from "../../_lib/track"

type Status = "idle" | "submitting" | "success" | "error"

export default function DemoForm() {
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const startedRef = useRef(false)

  function onFormInteract() {
    if (!startedRef.current) {
      startedRef.current = true
      track("platform_form_start")
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    if (String(data.get("company_confirm") || "").trim() !== "") {
      setStatus("success")
      return
    }

    const payload = {
      full_name: String(data.get("full_name") || ""),
      business_email: String(data.get("business_email") || ""),
      role: String(data.get("role") || ""),
      property_or_group: String(data.get("property_or_group") || ""),
      country_city: String(data.get("country_city") || ""),
      website: String(data.get("website") || ""),
      program_to_review: String(data.get("program_to_review") || ""),
      bottleneck: String(data.get("bottleneck") || ""),
      consent: data.get("consent") === "on",
      company_confirm: String(data.get("company_confirm") || ""),
    }

    if (!payload.consent) {
      setStatus("error")
      setErrorMsg("Please confirm consent to continue.")
      track("platform_form_error", { reason: "consent_missing" })
      return
    }

    setStatus("submitting")
    setErrorMsg("")
    try {
      const res = await fetch("/api/for-properties-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Something went wrong")
      }
      setStatus("success")
      track("platform_form_submit")
      form.reset()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      setStatus("error")
      setErrorMsg(message)
      track("platform_form_error", { reason: message })
    }
  }

  if (status === "success") {
    return (
      <div className="card" style={{ padding: 32, textAlign: "center" }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Request received</div>
        <h2 style={{ marginBottom: 12 }}>We&apos;ll be in touch shortly.</h2>
        <p className="body-sm">In the meantime, message us directly on WhatsApp if it&apos;s urgent.</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} onFocus={onFormInteract} className="card" style={{ padding: 28, display: "grid", gap: 14 }}>
      <div style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }} aria-hidden="true">
        <label htmlFor="company_confirm">Company</label>
        <input type="text" id="company_confirm" name="company_confirm" tabIndex={-1} autoComplete="off" />
      </div>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <Field label="Full name" name="full_name" required />
        <Field label="Business email" name="business_email" type="email" required />
        <Field label="Role" name="role" />
        <Field label="Property or group" name="property_or_group" required />
        <Field label="Country and city / region" name="country_city" />
        <Field label="Website" name="website" />
      </div>
      <Field label="Program you want to improve" name="program_to_review" textarea />
      <Field label="Operational bottleneck" name="bottleneck" textarea />

      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "var(--ink-2)" }}>
        <input type="checkbox" name="consent" required style={{ marginTop: 3 }} />
        I agree to be contacted about the Dream Islands platform.
      </label>

      {status === "error" && (
        <p className="body-sm" style={{ color: "#c0392b", margin: 0 }}>{errorMsg}</p>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
        <button type="submit" className="btn btn-primary btn-lg" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending…" : "Request a platform demo"}
        </button>
          <a
          href="https://wa.me/message/HOF2AFIBDYY5J1"
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost btn-lg"
          onClick={() => track("platform_whatsapp_click")}
        >
          Message on WhatsApp instead
        </a>
      </div>
    </form>
  )
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  textarea = false,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  textarea?: boolean
}) {
  const style = {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--border, #e6e9e7)",
    fontFamily: "var(--font-body)",
    fontSize: 14,
  }
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 13, color: "var(--ink-2)" }}>
      {label}
      {textarea ? (
        <textarea name={name} required={required} rows={3} style={{ ...style, resize: "vertical" as const }} />
      ) : (
        <input type={type} name={name} required={required} style={style} />
      )}
    </label>
  )
}
