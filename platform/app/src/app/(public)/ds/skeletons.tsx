import { Skeleton } from "./ui"
import s from "./skeletons.module.css"

function Screen({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div className={`${className} ${s.screen}`} role="status" aria-busy="true">
      <span className="ds-visually-hidden">Loading</span>
      {children}
    </div>
  )
}

/** Loading screen for list pages: home, catalogues, destinations, guides. */
export function ListSkeleton() {
  return (
    <Screen className={`ds-container ${s.list}`}>
      <Skeleton className={s.title} />
      <Skeleton className={s.text} />
      <Skeleton className={s.textShort} />
      <div className={s.grid}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={s.card}>
            <Skeleton shape="block" className={s.photo} />
            <Skeleton className={s.cardLine} />
            <Skeleton className={s.cardLineShort} />
          </div>
        ))}
      </div>
    </Screen>
  )
}

/** Loading screen for a programme or property page: gallery next to the info column. */
export function DetailSkeleton() {
  return (
    <Screen className={`ds-container-narrow ${s.detail}`}>
      <Skeleton shape="block" className={s.gallery} />
      <div className={s.info}>
        <Skeleton className={s.crumb} />
        <Skeleton className={s.detailTitle} />
        <Skeleton className={s.line} />
        <Skeleton className={s.line} />
        <Skeleton className={s.lineShort} />
        <Skeleton shape="block" className={s.button} />
      </div>
    </Screen>
  )
}
