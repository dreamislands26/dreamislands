import Image from "next/image"
import { Icon } from "./Icon"

const COHORT_GRADIENT: Record<number, string> = {
  1: "linear-gradient(135deg, #2C3336 0%, #1B5A45 100%)",
  2: "linear-gradient(135deg, #0F1A16 0%, #5FBE8C 100%)",
  3: "linear-gradient(135deg, #2C3336 0%, #6B3F52 100%)",
  4: "linear-gradient(135deg, #2C3336 0%, #2F4A66 100%)",
}

export default function ProgramImage({
  url,
  cohort,
  alt,
  aspect = "4 / 3",
  rounded,
  priority,
}: {
  url: string | null | undefined
  cohort: number
  alt: string
  aspect?: string
  rounded?: number
  priority?: boolean
}) {
  const wrapStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    aspectRatio: aspect,
    overflow: "hidden",
    borderRadius: rounded,
  }
  if (url) {
    return (
      <div style={wrapStyle}>
        <Image
          src={url}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 480px"
          style={{ objectFit: "cover" }}
          priority={priority}
        />
      </div>
    )
  }
  return (
    <div
      aria-hidden="true"
      style={{
        ...wrapStyle,
        background: COHORT_GRADIENT[cohort] ?? COHORT_GRADIENT[1],
        display: "grid",
        placeItems: "center",
        color: "rgba(174,225,192,0.55)",
      }}
    >
      <Icon.flower width="42%" height="42%" />
    </div>
  )
}
