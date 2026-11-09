"use client"
/** Floating Support button (headset): opens the support chat sheet (the Cura chat inside the site, SupportChat.tsx).
 *  Links to the Support centre before the page is interactive. Sits above the WhatsApp button. */
import { openSupportChat } from "../ds/SupportChat"

export default function SupportFab() {
  return (
    <a
      className="fab-support"
      href="/support"
      aria-label="Support"
      title="Support"
      onClick={(e) => { e.preventDefault(); openSupportChat() }}
    >
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
        <rect x="3" y="14" width="4" height="6" rx="1.5" />
        <rect x="17" y="14" width="4" height="6" rx="1.5" />
        <path d="M19 20c0 1.500-1.500 2-4 2h-1.500" />
      </svg>
    </a>
  )
}
