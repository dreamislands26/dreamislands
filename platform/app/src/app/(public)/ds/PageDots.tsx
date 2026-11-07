// Gallery page dots, Instagram style (Oleg 07.11.2026): at most five in view; the current one is full white
// and a little larger, the window of dots slides with it, and the dots at a window edge shrink when more lie
// beyond that edge. Everything animates (position, size, opacity), so a swipe reads as a smooth slide.
import s from "./pageDots.module.css"

const SHOWN = 5
const PITCH = 10 // px between dot centres (6px dot + 4px gap)

export default function PageDots({ count, index, className }: { count: number; index: number; className?: string }) {
  if (count < 2) return null
  const shown = Math.min(count, SHOWN)
  const start = Math.max(0, Math.min(index - Math.floor(SHOWN / 2), count - shown))
  return (
    <span className={`${s.dots}${className ? ` ${className}` : ""}`} style={{ width: shown * PITCH }} role="img" aria-label={`Photo ${index + 1} of ${count}`}>
      <span className={s.track} style={{ transform: `translateX(${-start * PITCH}px)` }}>
        {Array.from({ length: count }, (_, k) => {
          const pos = k - start
          const out = pos < 0 || pos >= shown
          const edge = (pos === 0 && start > 0) || (pos === shown - 1 && start + shown < count)
          const scale = k === index ? 1.2 : out ? 0 : edge ? 0.55 : 0.9
          return <i key={k} className={s.dot} data-on={k === index ? "" : undefined} style={{ left: k * PITCH, transform: `scale(${scale})` }} />
        })}
      </span>
    </span>
  )
}
