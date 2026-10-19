"use client"
// Muted looping background video for a hero. The source is attached only when `media` matches, so the
// hidden desktop/mobile copy never downloads. The poster is a CSS background (browsers skip backgrounds
// of hidden blocks), shows until playback starts, and stays when autoplay is blocked (iOS Low Power
// Mode) or the visitor prefers reduced motion.
import { useEffect, useRef } from "react"

export default function HeroVideo({ src, poster, media, className }: { src: string; poster: string; media: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = ref.current
    if (!v || !window.matchMedia(media).matches) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    v.src = src
    v.play().catch(() => {}) // blocked autoplay: keep the poster
  }, [src, media])
  return <video ref={ref} className={className} style={{ background: `center / cover no-repeat url(${poster})` }} muted loop playsInline autoPlay preload="none" aria-hidden />
}
