"use client"
// Price range (Figma "Price range"): histogram of program prices with the selected span in primary, a
// two-thumb slider and Minimum / Maximum fields. Prices are full trip prices in USD.
import { useMemo } from "react"
import s from "./priceRange.module.css"

const BINS = 32
const KERNEL = [1, 2, 3, 2, 1] // smooths a small catalogue into a readable shape
const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US")

export default function PriceRange({ prices, min, max, step = 50, value, onChange }: { prices: number[]; min: number; max: number; step?: number; value: [number, number]; onChange: (v: [number, number]) => void }) {
  const [lo, hi] = value
  const bins = useMemo(() => {
    const b = new Array(BINS).fill(0)
    for (const p of prices) b[Math.min(BINS - 1, Math.max(0, Math.floor(((p - min) / (max - min)) * BINS)))]++
    const sm = b.map((_, i) => KERNEL.reduce((acc, k, j) => acc + k * (b[i + j - 2] ?? 0), 0))
    const top = Math.max(1, ...sm)
    return sm.map((n) => n / top)
  }, [prices, min, max])
  const pct = (v: number) => ((v - min) / (max - min)) * 100
  const set = (i: 0 | 1, v: number) => {
    const next: [number, number] = [lo, hi]
    next[i] = v
    if (next[0] > next[1] - step) {
      if (i === 0) next[0] = next[1] - step
      else next[1] = next[0] + step
    }
    onChange([Math.max(min, next[0]), Math.min(max, next[1])])
  }
  return (
    <div className={s.root}>
      <p className={s.sub}>Trip price, all fees included</p>
      <div className={s.hist} aria-hidden>
        {bins.map((h, i) => {
          const at = min + ((i + 0.5) / BINS) * (max - min)
          return <span key={i} className={s.bar} data-on={at >= lo && at <= hi ? "1" : undefined} style={{ height: `${Math.max(6, h * 100)}%` }} />
        })}
      </div>
      <div className={s.slider}>
        <span className={s.track} />
        <span className={s.range} style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input type="range" aria-label="Minimum price" min={min} max={max} step={step} value={lo} onChange={(e) => set(0, +e.target.value)} />
        <input type="range" aria-label="Maximum price" min={min} max={max} step={step} value={hi} onChange={(e) => set(1, +e.target.value)} />
      </div>
      <div className={s.fields}>
        <label className={s.field}>
          <span className={s.label}>Minimum</span>
          <span className={s.value}>{usd(lo)}</span>
        </label>
        <label className={`${s.field} ${s.fieldEnd}`}>
          <span className={s.label}>Maximum</span>
          <span className={s.value}>{usd(hi)}{hi >= max ? "+" : ""}</span>
        </label>
      </div>
    </div>
  )
}
