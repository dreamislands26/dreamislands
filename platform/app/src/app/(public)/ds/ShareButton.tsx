"use client"
import { useState } from "react"
import { IconButton } from "./ui"

/** Native share sheet where available, otherwise copies the link. */
export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)
  async function onClick() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // dismissed share sheet: nothing to do
    }
  }
  return <IconButton icon={copied ? "check" : "ios_share"} label={copied ? "Link copied" : "Share"} onClick={onClick} />
}
