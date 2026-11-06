// Home goal tiles: our own fine-line nature set (Oleg 06.11.2026), one image per goal, drawn on a 48 grid.
// Stroke only, colour from currentColor, so each tile's hue tints it.
import type { ReactNode } from "react"

const GLYPHS: Record<string, ReactNode> = {
  "restore-sleep": <><path d="M29 7.5A16.5 16.5 0 1 0 40.5 31A13.5 13.5 0 1 1 29 7.5Z" /><path d="M36 9.5v4M34 11.5h4" /><path d="M41.5 17v2.6M40.2 18.3h2.6" /><circle cx="33" cy="20" r=".6" fill="currentColor" /></>, // crescent moon and stars
  "boost-energy": <><circle cx="24" cy="24" r="7" /><path d="M35.00 24.00L40.00 24.00" /><path d="M33.53 29.50L36.12 31.00" /><path d="M29.50 33.53L32.00 37.86" /><path d="M24.00 35.00L24.00 38.00" /><path d="M18.50 33.53L16.00 37.86" /><path d="M14.47 29.50L11.88 31.00" /><path d="M13.00 24.00L8.00 24.00" /><path d="M14.47 18.50L11.88 17.00" /><path d="M18.50 14.47L16.00 10.14" /><path d="M24.00 13.00L24.00 10.00" /><path d="M29.50 14.47L32.00 10.14" /><path d="M33.53 18.50L36.12 17.00" /></>, // sun
  "metabolic-health": <><path d="M24.0 16.3C20.9 14.5 16.1 14.5 13.0 17.2C9.4 20.3 8.6 25.9 9.8 30.8C11.3 36.7 15.2 41.8 19.6 41.8C21.6 41.8 22.5 41.1 24.0 41.1C25.5 41.1 26.4 41.8 28.4 41.8C32.8 41.8 36.7 36.7 38.2 30.8C39.4 25.9 38.6 20.3 35.0 17.2C31.9 14.5 27.1 14.5 24.0 16.3Z" /><path d="M24.0 16.3C24.0 12.8 23.3 9.8 21.6 7.4" /><path d="M23.3 11.3C24.7 7.2 28.9 5.1 33.8 5.7C32.2 9.8 28.0 11.9 23.3 11.3Z" /><path d="M15.0 23.7C14.1 26.2 14.4 28.7 15.5 30.9" opacity={0.6}/></>, // apple with a leaf
  "mental-clarity": <><path d="M21 7C22 15.5 25 18.5 33.5 19.5C25 20.5 22 23.5 21 32C20 23.5 17 20.5 8.5 19.5C17 18.5 20 15.5 21 7Z" /><path d="M35.5 28C36 31.6 37.4 33 41 33.5C37.4 34 36 35.4 35.5 39C35 35.4 33.6 34 30 33.5C33.6 33 35 31.6 35.5 28Z" /><path d="M12.5 32.5C12.8 35 13.7 35.9 16.2 36.2C13.7 36.5 12.8 37.4 12.5 39.9C12.2 37.4 11.3 36.5 8.8 36.2C11.3 35.9 12.2 35 12.5 32.5Z" /></>, // three four-point stars
  "stress-anxiety": <><path d="M24 11C20.5 15.5 20.5 24.5 24 30C27.5 24.5 27.5 15.5 24 11Z" /><path d="M24 30C19 29 14.2 24.6 13 17.5C17.8 18.4 21.6 22.6 24 30Z" /><path d="M24 30C29 29 33.8 24.6 35 17.5C30.2 18.4 26.4 22.6 24 30Z" /><path d="M24 31C17.5 32.2 10.5 30.2 6.5 25.5C11.8 23.8 18.8 25.6 24 31Z" /><path d="M24 31C30.5 32.2 37.5 30.2 41.5 25.5C36.2 23.8 29.2 25.6 24 31Z" /><path d="M11 36.5H37" /><path d="M17 40.5H31" /></>, // lotus over water
  "rebuild-your-body": <><path d="M20 42V7.5" /><path d="M23.5 42V7.5" /><path d="M20 17.5H23.5M20 28H23.5" /><path d="M23.5 17.5C28.5 13.5 34.5 12.2 40.5 13C35.6 16.6 29.6 18 23.5 17.5Z" /><path d="M23.5 28C27.8 25.6 32.8 25.6 36.8 28C32.6 29.8 27.8 29.8 23.5 28Z" /><path d="M20 22.5C15.6 19 10.2 18 5.5 19.2C9.6 22.6 15 23.6 20 22.5Z" /></>, // bamboo
  "healthy-ageing": <><path d="M24 42.5C24 38 23.6 33.5 24 30" /><path d="M24 30C18.5 28.6 10.5 23.4 6 15.5C10.5 10.5 17.5 8.6 22.3 10.4L24 15L25.7 10.4C30.5 8.6 37.5 10.5 42 15.5C37.5 23.4 29.5 28.6 24 30Z" /><path d="M24 30L11 17.5M24 30L15.5 13.5M24 30L20.5 11.6M24 30L27.5 11.6M24 30L32.5 13.5M24 30L37 17.5" opacity={0.4}/></>, // ginkgo leaf
}

export default function GoalGlyph({ slug, className }: { slug: string; className?: string }) {
  const g = GLYPHS[slug] ?? GLYPHS["healthy-ageing"]
  return (
    <svg className={className} viewBox="0 0 48 48" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {g}
    </svg>
  )
}
