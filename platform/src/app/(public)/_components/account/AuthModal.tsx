"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Icon } from "../Icon"
import AuthForm, { authTitle, type AuthReason } from "./AuthForm"

export type AuthRequest = {
  /** "save": keep an assessment result. "login": header / profile. */
  reason: AuthReason
  email?: string
}

export default function AuthModal({ request, onClose }: { request: AuthRequest; onClose: () => void }) {
  const router = useRouter()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  function done() {
    onClose()
    if (window.location.pathname.startsWith("/profile")) router.refresh()
    else router.push("/profile")
  }

  return (
    <div className="acct-overlay" role="dialog" aria-modal="true" aria-label={authTitle(request.reason)} onClick={onClose}>
      <div className="acct-sheet" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="acct-close" onClick={onClose} aria-label="Close">
          <Icon.close width={16} height={16} />
        </button>
        <div className="acct-pane">
          <AuthForm
            reason={request.reason}
            initialEmail={request.email}
            onDone={done}
            onCancel={request.reason === "save" ? onClose : undefined}
          />
        </div>
      </div>
    </div>
  )
}
