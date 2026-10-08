"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Icon } from "../_components/Icon"
import AuthForm from "../_components/account/AuthForm"

function Check({ size = 26 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}

/**
 * Right under the score: "sent" confirmation + the account push, inline
 * (what used to be the post-assessment popup). Entering the code opens the
 * new profile straight away.
 */
export default function SaveResultBlock({
  initialEmail,
  alreadySaved,
}: {
  initialEmail?: string
  alreadySaved: boolean
}) {
  const router = useRouter()

  return (
    <section className="card save-block rise rise-1" aria-label="Save your result">
      <div className="acct-pane acct-success">
        <div className="acct-check"><Check /></div>
        <h2 className="display" style={{ fontSize: 28, margin: "0 0 8px", color: "var(--ink)" }}>Sent successfully</h2>
        <p className="body" style={{ margin: 0 }}>
          Your baseline is ready. We&apos;ll send your score and matched programmes to WhatsApp.
        </p>
      </div>
      <div className="acct-pane">
        {alreadySaved ? (
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Saved</div>
            <h2 className="display" style={{ fontSize: 28, margin: "0 0 10px", color: "var(--ink)" }}>
              It&apos;s in your profile
            </h2>
            <p className="body" style={{ margin: "0 0 22px" }}>
              Your score is the first point of your WS trend. We&apos;ll add every check-in before, during and
              after your journey.
            </p>
            <Link href="/profile" className="btn btn-primary btn-block">
              Open my profile <Icon.arrow width={16} height={16} />
            </Link>
          </div>
        ) : (
          <AuthForm reason="save" initialEmail={initialEmail} onDone={() => router.push("/profile")} titleSize={28} />
        )}
      </div>
    </section>
  )
}
