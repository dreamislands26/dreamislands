import Link from "@/lib/i18n-link"
import { outcomeLabel, type CatalogProgram, type Outcome } from "../_lib/catalog"
import { goalHue } from "../_lib/routes"
import GoalGlyph from "./GoalGlyph"
import s from "./goalTile.module.css"

/** Medical packages (China) are kept out of the wellness goals. */
export const isMedical = (p: CatalogProgram) => /medical|surgery|outpatient|bm-package/i.test(p.slug ?? "") || /medical|surgery|outpatient/i.test(p.name)

/** The home goals: curated goals that have wellness programmes, in taxonomy order. */
export function homeGoals(outcomes: Outcome[], programs: CatalogProgram[]) {
  const wellness = programs.filter((p) => !isMedical(p))
  return outcomes.map((o) => ({ ...o, n: wellness.filter((p) => p.outcomes.includes(o.slug)).length })).filter((o) => o.n > 0)
}

/** Arrow from the DS (Figma 150:24796). */
function Arrow() {
  return (
    <svg viewBox="0 0 11 12" fill="none" aria-hidden>
      <path opacity="0.8" d="M0 6.89189V5.12432H8.34429L4.22714 1.23243L5.40571 0L11 5.43243V6.56757L5.40571 12L4.21143 10.7514L8.31286 6.89189H0Z" fill="currentColor" />
    </svg>
  )
}

/** Home goal tile, the same on the phone and on desktop (Oleg 15.11.2026: desktop showed track cards instead). */
export default function GoalTile({ goal }: { goal: Outcome }) {
  return (
    <Link href={`/programs?goal=${goal.slug}`} className={s.tile} style={{ "--tile-h": goalHue(goal.slug) } as React.CSSProperties}>
      <span className={s.title}>{outcomeLabel(goal)}</span>
      <span className={s.hook}>{goal.hook}</span>
      <GoalGlyph slug={goal.slug} className={s.icon} />
      <span className={s.go} aria-hidden><Arrow /></span>
    </Link>
  )
}
