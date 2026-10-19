// Country flag (circle-flags, MIT; public/flags). Replaces emoji flags, which Windows never draws (it
// shows "TH", "CN") and other systems draw differently. Accepts a country name or its emoji flag.
import Image from "next/image"
import { COUNTRY_FLAGS } from "../_lib/countries"

const CODES: Record<string, string> = { Thailand: "th", China: "cn", Indonesia: "id", Singapore: "sg", Philippines: "ph", Vietnam: "vn", Malaysia: "my" }
const BY_EMOJI = Object.fromEntries(Object.entries(COUNTRY_FLAGS).map(([country, emoji]) => [emoji, CODES[country]]))

export function flagCode(of: string | null | undefined): string | null {
  if (!of) return null
  return CODES[of] ?? BY_EMOJI[of.trim()] ?? null
}

export default function Flag({ of, size = "1em", className }: { of: string | null | undefined; size?: string; className?: string }) {
  const code = flagCode(of)
  if (!code) return null
  return (
    <Image
      src={`/flags/${code}.svg`}
      alt=""
      aria-hidden
      width={16}
      height={16}
      unoptimized
      className={className}
      style={{ width: size, height: size, borderRadius: "50%", flex: "none", display: "inline-block", verticalAlign: "-0.125em" }}
    />
  )
}
