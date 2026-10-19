import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import type { LandingProgram } from "../_lib/programMapping"
import { Facts, Icon, Stars, TrackChip, ButtonLink, cx, type TrackKey } from "./ui"
import SaveButton from "./SaveButton"
import s from "./cards.module.css"
import Flag from "./Flag"

const SUPABASE_HOST = "xbzrtofanbrahasxbisf.supabase.co"

/** Photo with a calm art fallback. Optimised through next/image when the host allows it. */
export function Photo({ src, alt, className, sizes = "(max-width: 768px) 90vw, 400px", priority, children, style }: { src: string | null | undefined; alt: string; className?: string; sizes?: string; priority?: boolean; children?: ReactNode; style?: React.CSSProperties }) {
  let optimised = false
  if (src) {
    try {
      optimised = new URL(src).hostname === SUPABASE_HOST
    } catch {
      optimised = src.startsWith("/")
    }
  }
  return (
    <div className={cx(s.photo, className)} style={style}>
      {src ? (
        optimised ? (
          <Image src={src} alt={alt} fill sizes={sizes} priority={priority} style={{ objectFit: "cover" }} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className={s.photoImg} loading={priority ? "eager" : "lazy"} />
        )
      ) : (
        <div className={s.photoArt} aria-hidden>
          <Icon name="spa" />
        </div>
      )}
      {children}
    </div>
  )
}

export const COHORT_TRACK: Record<number, TrackKey> = { 1: "reset", 2: "performance", 3: "mind", 4: "immersion", 7: "sport" }

/** DS "Program card": square photo with track chip and Favorite, title, place · rating, price · duration. */
/** Program card. `wide` is the full-width list card (Figma Program card · Full width): 4:3 photo, rating
 *  on the title row. */
export function ProgramCard({ program: p, showTrack = true, rating, priority, wide }: { program: LandingProgram; showTrack?: boolean; rating?: number | null; priority?: boolean; wide?: boolean }) {
  const href = p.slug ? `/programs/${p.slug}` : "/programs"
  // Resort name; when there is none, the country (Oleg, 17.10.2026)
  const place = p.place?.length ? p.place : p.country ? [p.country] : []
  const stars = rating ?? p.rating
  return (
    <article className={cx(s.program, wide && s.programWide)}>
      <Photo src={p.hero_image_url} alt={p.name} priority={priority} sizes={wide ? "100vw" : "(max-width: 768px) 45vw, 240px"}>
        <div className={s.overlayRow}>
          {showTrack ? <TrackChip track={COHORT_TRACK[p.cohort] ?? "reset"}>{p.trackFull}</TrackChip> : <span />}
          <SaveButton item={{ kind: "program", id: p.id, title: p.name, href, image: p.hero_image_url, meta: [p.flag, place[0]].filter(Boolean).join(" "), price: p.price }} />
        </div>
      </Photo>
      <div className={s.text}>
        <div className={s.titleRow}>
          <h3 className={s.title}>
            <Link href={href} className={s.cardLink}>{p.name}</Link>
          </h3>
          {wide && stars ? (
            <span className={cx(s.line, s.rating)}>
              <span className={s.star} aria-hidden>★</span>
              {stars.toFixed(1)}
            </span>
          ) : null}
        </div>
        <span className={s.line}>
          <span className={s.ellipsis}>
            {p.flag ? <Flag of={p.flag} className={s.flag} /> : null}
            <Facts items={place} />
          </span>
          {!wide && stars ? (
            <>
              {place.length > 0 && <span className={s.dot} aria-hidden />}
              <span className={s.rating}>
                <span className={s.star} aria-hidden>★</span>
                {stars.toFixed(1)}
              </span>
            </>
          ) : null}
        </span>
        <span className={s.line}>
          <span>{p.price}</span>
          {p.duration && (
            <>
              <span className={s.dot} aria-hidden />
              <span>{p.duration}</span>
            </>
          )}
        </span>
      </div>
    </article>
  )
}

/** DS "Place card": photo, name, region, from-price + count. No heart in the component. */
export function PlaceCard({ href, name, region, from, count, image, priority, className }: { id?: string; href: string; name: string; region?: ReactNode; from?: string | null; count?: string | null; image: string | null; priority?: boolean; className?: string }) {
  return (
    <article className={cx(s.place, className)}>
      <Photo src={image} alt={name} priority={priority} />
      <div className={s.text}>
        <h3 className={s.title}>
          <Link href={href} className={s.cardLink}>{name}</Link>
        </h3>
        {region && <span className={s.meta}>{region}</span>}
        {(from || count) && (
          <span className={s.price}>
            <Facts items={[from ? <strong key="f">{from}</strong> : null, count]} />
          </span>
        )}
      </div>
    </article>
  )
}

export function CountryCard({ href, name, flag, meta, from, image }: { href: string; name: string; flag?: string; meta?: ReactNode; from?: string | null; image: string | null }) {
  return (
    <Link href={href} className={s.country}>
      <Photo src={image} alt={name} sizes="(max-width: 768px) 200px, 280px">
        <div className={s.countryScrim} />
        <p className={s.countryName}>{flag ? <><Flag of={flag} /> {name}</> : name}</p>
      </Photo>
      {meta && <span className={s.meta}>{meta}</span>}
      {from && <span className={cx(s.price)} style={{ paddingTop: 0 }}><strong>{from}</strong></span>}
    </Link>
  )
}

export function OutcomeTile({ icon, title, hook, count, href }: { icon: string; title: string; hook: string; count?: string; href: string }) {
  return (
    <Link href={href} className={s.outcome}>
      <Icon name={icon} />
      <span className={s.outcomeSpacer} />
      <h3 className={s.outcomeTitle}>{title}</h3>
      <p className={s.outcomeHook}>{hook}</p>
      {count && <span className={s.outcomeCount}>{count}</span>}
    </Link>
  )
}

export function ReviewCard({ rating = 5, text, name, meta }: { rating?: number; text: string; name: string; meta?: string }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  return (
    <figure className={s.review} style={{ margin: 0 }}>
      <Stars value={rating} />
      <blockquote className={s.reviewText} style={{ margin: 0 }}>{text}</blockquote>
      <figcaption className={s.reviewer}>
        <span className={s.avatar}>{initials}</span>
        <span>
          <span className={s.reviewName} style={{ display: "block" }}>{name}</span>
          {meta && <span className={s.reviewMeta}>{meta}</span>}
        </span>
      </figcaption>
    </figure>
  )
}

export function ScoreCard({ score, label = "Wellness Score", title, focus, bars }: { score: number; label?: string; title: string; focus?: string; bars: { name: string; value: number }[] }) {
  const r = 52
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, score)) / 100
  const low = Math.min(...bars.map((b) => b.value))
  return (
    <div className={s.score}>
      <div className={s.scoreHead}>
        <div className={s.ring} role="img" aria-label={`${label} ${score} of 100`}>
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={r} fill="none" stroke="var(--ds-surface-container-highest)" strokeWidth="10" />
            <circle cx="60" cy="60" r={r} fill="none" stroke="var(--ds-primary)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} />
          </svg>
          <span className={s.ringValue}>{score}</span>
        </div>
        <div>
          <div className={s.scoreLabel}>{label}</div>
          <div className={s.scoreTitle}>{title}</div>
          {focus && <div className={s.scoreFocus}>{focus}</div>}
        </div>
      </div>
      {bars.map((b) => (
        <div key={b.name} className={s.bar}>
          <div className={s.barHead}>
            <span>{b.name}</span>
            <span>{b.value}</span>
          </div>
          <div className={s.track}>
            <div className={cx(s.fill, b.value === low && s.fillLow)} style={{ width: `${b.value}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function JourneyPrompt({ title = "Not sure which goal fits?", sub = "Take your Wellness Journey: 2 minutes, your Wellness Score and three matched programmes.", cta = "Start your Wellness Journey", href = "/start" }: { title?: string; sub?: string; cta?: string; href?: string }) {
  return (
    <aside className={s.prompt}>
      <Icon name="spa" />
      <div className={s.promptText}>
        <p className={s.promptTitle}>{title}</p>
        <p className={s.promptSub}>{sub}</p>
      </div>
      <ButtonLink href={href} variant="tonal" size="m">{cta}</ButtonLink>
    </aside>
  )
}

export const cardStyles = s
