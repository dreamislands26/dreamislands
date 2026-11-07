// Gallery page dots (Oleg 07.11.2026): the current photo's dot sits in the middle, stretched into a pill;
// its neighbours are stretched a little, the rest are round and shrink towards the edges. The dots follow
// the swipe itself (`progress` is the fractional photo position), so while you swipe the next dot slides
// into the middle and grows as the current one shrinks away.
import s from "./pageDots.module.css"

const GAP = 4 // px between dots
const H = 6 // dot height, px
const WIDTH = 140 // the strip; dots further out fade away

/** Size and opacity of a dot `a` photos away from the current position (fractional while swiping) */
function look(a: number) {
  const w = a < 1 ? 18 - 8 * a : a < 2 ? 10 - 4 * (a - 1) : H // 18 → 10 → 6
  const scale = a <= 1.5 ? 1 : Math.max(0, 1 - (a - 1.5) * 0.22) // the round ones shrink outwards
  const opacity = (a < 1 ? 1 - 0.4 * a : 0.6) * Math.min(1, Math.max(0, 4.5 - a))
  return { w: w * scale, h: H * scale, opacity }
}

export default function PageDots({ count, progress, className }: { count: number; progress: number; className?: string }) {
  if (count < 2) return null
  const p = Math.min(count - 1, Math.max(0, progress))
  const dots = Array.from({ length: count }, (_, k) => look(Math.abs(k - p)))
  // Lay them out left to right, then shift so the position `p` lands in the middle of the strip
  const centres: number[] = []
  let x = 0
  for (const d of dots) { centres.push(x + d.w / 2); x += d.w + GAP }
  const lo = Math.floor(p), hi = Math.min(count - 1, lo + 1)
  const at = centres[lo] + (centres[hi] - centres[lo]) * (p - lo)
  const shift = WIDTH / 2 - at
  const current = Math.round(p)
  return (
    <span className={`${s.dots}${className ? ` ${className}` : ""}`} style={{ width: WIDTH }} role="img" aria-label={`Photo ${current + 1} of ${count}`}>
      {dots.map((d, k) => (
        <i key={k} className={s.dot} style={{ left: shift + centres[k] - d.w / 2, width: d.w, height: d.h, marginTop: -d.h / 2, opacity: d.opacity }} />
      ))}
    </span>
  )
}
