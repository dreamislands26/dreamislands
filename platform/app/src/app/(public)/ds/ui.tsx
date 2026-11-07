import Link from "@/lib/i18n-link"
import type { CSSProperties, ComponentProps, ReactNode } from "react"
import s from "./ui.module.css"

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ")

/** Material Symbols Rounded glyph (Light 300). */
/** Glyphs Material Symbols lacks, drawn on its 24 grid to match Rounded Light (names in icon-font.ts). */
const CUSTOM_ICONS: Record<string, ReactNode> = {
  dit_apple: (
    <>
      <path d="M12 7.6C10.2 6.4 7.6 6.6 6 8.2C4.4 9.8 4.2 12.6 4.9 15C5.7 17.8 7.6 20.5 9.7 20.5C10.8 20.5 11.3 20.2 12 20.2C12.7 20.2 13.2 20.5 14.3 20.5C16.4 20.5 18.3 17.8 19.1 15C19.8 12.6 19.6 9.8 18 8.2C16.4 6.6 13.8 6.4 12 7.6Z" />
      <path d="M12 7.6C12 5.9 11.5 4.6 10.6 3.7" />
      <path d="M12.7 5.9C13 4.1 14.5 3 16.7 3.1C16.5 5 14.9 6.1 12.7 5.9Z" />
    </>
  ),
  // Rooms (Oleg 07.11.2026): beds from the front (one, two singles, a double), a house with bedrooms, a villa
  // with its pool ladder, a Japanese house, a Singapore shophouse
  dit_bed_single: (
    <>
      <path d="M7 12.5V8.2C7 7.37 7.67 6.7 8.5 6.7H15.5C16.33 6.7 17 7.37 17 8.2V12.5" />
      <rect x="9.4" y="9.3" width="5.2" height="2.4" rx="1" />
      <rect x="5.5" y="12.5" width="13" height="4.5" rx="1.4" />
      <path d="M7 17V19.3" />
      <path d="M17 17V19.3" />
    </>
  ),
  dit_bed_twin: (
    <>
      <path d="M3.6 13V9.4C3.6 8.74 4.14 8.2 4.8 8.2H9.2C9.86 8.2 10.4 8.74 10.4 9.4V13" />
      <rect x="5" y="10.4" width="4" height="2" rx="0.9" />
      <rect x="2.5" y="13" width="9" height="3.8" rx="1.2" />
      <path d="M3.6 16.8V19" />
      <path d="M10.4 16.8V19" />
      <path d="M13.6 13V9.4C13.6 8.74 14.14 8.2 14.8 8.2H19.2C19.86 8.2 20.4 8.74 20.4 9.4V13" />
      <rect x="15" y="10.4" width="4" height="2" rx="0.9" />
      <rect x="12.5" y="13" width="9" height="3.8" rx="1.2" />
      <path d="M13.6 16.8V19" />
      <path d="M20.4 16.8V19" />
    </>
  ),
  dit_bed_double: (
    <>
      <path d="M4.25 12.5V7.9C4.25 7.07 4.92 6.4 5.75 6.4H18.25C19.08 6.4 19.75 7.07 19.75 7.9V12.5" />
      <rect x="6.2" y="9.3" width="5" height="2.4" rx="1" />
      <rect x="12.8" y="9.3" width="5" height="2.4" rx="1" />
      <rect x="2.75" y="12.5" width="18.5" height="4.5" rx="1.4" />
      <path d="M4.25 17V19.3" />
      <path d="M19.75 17V19.3" />
    </>
  ),
  dit_rooms: (
    <>
      <path d="M3 10.5L12 4.5L21 10.5" />
      <path d="M5 9.2V20H19V9.2" />
      <path d="M8.3 15.2V13C8.3 12.56 8.66 12.2 9.1 12.2H14.9C15.34 12.2 15.7 12.56 15.7 13V15.2" />
      <rect x="7.2" y="15.2" width="9.6" height="2.6" rx="0.9" />
      <path d="M8.3 17.8V20" />
      <path d="M15.7 17.8V20" />
      <rect x="10.6" y="7.6" width="2.8" height="2.4" rx="0.5" />
    </>
  ),
  dit_villa: (
    <>
      <path d="M2.75 10.6L8.6 5.6L14.45 10.6" />
      <path d="M4.3 9.4V15.5H12.9V9.4" />
      <path d="M7.4 15.5V12.7H9.8V15.5" />
      <path d="M16.4 17.2V8.3C16.4 7.42 17.12 6.7 18 6.7C18.88 6.7 19.6 7.42 19.6 8.3V17.2" />
      <path d="M16.4 11.6H19.6" />
      <path d="M16.4 14.4H19.6" />
      <path d="M2.75 19.4C3.9 18.6 5.1 18.6 6.25 19.4C7.4 20.2 8.6 20.2 9.75 19.4C10.9 18.6 12.1 18.6 13.25 19.4C14.4 20.2 15.6 20.2 16.75 19.4C17.9 18.6 19.1 18.6 20.25 19.4" />
      <path d="M5.5 22.2C6.65 21.4 7.85 21.4 9 22.2C10.15 23 11.35 23 12.5 22.2C13.65 21.4 14.85 21.4 16 22.2C17.15 23 18.35 23 18.5 22.2" />
    </>
  ),
  dit_house_japanese: (
    <>
      <path d="M2.5 10.2C5.6 10.2 9 8.4 12 5.2C15 8.4 18.4 10.2 21.5 10.2" />
      <path d="M10.6 6.6H13.4" />
      <path d="M5.25 10V18.75" />
      <path d="M18.75 10V18.75" />
      <path d="M3.25 18.75H20.75" />
      <rect x="8.25" y="12.25" width="7.5" height="6.5" rx="0.4" />
      <path d="M12 12.25V18.75" />
      <path d="M8.25 15.5H15.75" />
    </>
  ),
  dit_house_singapore: (
    <>
      <path d="M3 9L12 4.75L21 9" />
      <path d="M4.75 8.2V20H19.25V8.2" />
      <path d="M4.75 14H19.25" />
      <path d="M7.4 12.4V10.9C7.4 10.13 8.03 9.5 8.8 9.5C9.57 9.5 10.2 10.13 10.2 10.9V12.4" />
      <path d="M13.8 12.4V10.9C13.8 10.13 14.43 9.5 15.2 9.5C15.97 9.5 16.6 10.13 16.6 10.9V12.4" />
      <path d="M10.4 20V17.4C10.4 16.52 11.12 15.8 12 15.8C12.88 15.8 13.6 16.52 13.6 17.4V20" />
      <path d="M6.5 16.4V18" />
      <path d="M17.5 16.4V18" />
    </>
  ),
}

export function Icon({ name, size, fill, className, label }: { name: string; size?: number; fill?: boolean; className?: string; label?: string }) {
  const custom = CUSTOM_ICONS[name]
  return (
    <span
      className={cx("ds-icon", className)}
      data-fill={fill ? "1" : undefined}
      style={size ? { fontSize: `${size / 16}rem` } : undefined}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    >
      {custom ? (
        <svg viewBox="0.6 1.6 22.8 22.8" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">{custom}</svg>
      ) : name}
    </span>
  )
}

/** Thin vertical divider between inline facts. */
export function Sep() {
  return <span className="ds-sep" aria-hidden />
}

/** Joins facts with the vertical divider, skipping empty ones. */
export function Facts({ items, className }: { items: (ReactNode | null | undefined | false)[]; className?: string }) {
  const list = items.filter((x) => x !== null && x !== undefined && x !== false && x !== "")
  return (
    <span className={className}>
      {list.map((x, i) => (
        <span key={i}>
          {i > 0 && <Sep />}
          {x}
        </span>
      ))}
    </span>
  )
}

type BtnStyle = "filled" | "tonal" | "text"
type BtnSize = "m" | "l"
type BtnCommon = { variant?: BtnStyle; size?: BtnSize; icon?: string; trailingIcon?: string; block?: boolean; className?: string; children: ReactNode }

export function Button({ variant = "filled", size = "m", icon, trailingIcon, block, className, children, ...rest }: BtnCommon & Omit<ComponentProps<"button">, "children">) {
  return (
    <button type="button" className={cx(s.btn, s[size], s[variant], block && s.block, className)} {...rest}>
      {icon && <Icon name={icon} className={s.icon} />}
      {children}
      {trailingIcon && <Icon name={trailingIcon} className={s.icon} />}
    </button>
  )
}

export function ButtonLink({ variant = "filled", size = "m", icon, trailingIcon, block, className, children, href, ...rest }: BtnCommon & { href: string } & Omit<ComponentProps<typeof Link>, "children" | "href">) {
  return (
    <Link href={href} className={cx(s.btn, s[size], s[variant], block && s.block, className)} {...rest}>
      {icon && <Icon name={icon} className={s.icon} />}
      {children}
      {trailingIcon && <Icon name={trailingIcon} className={s.icon} />}
    </Link>
  )
}

type IbStyle = "standard" | "tonal" | "filled" | "photo"
const ibClass: Record<IbStyle, string | undefined> = { standard: undefined, tonal: s.ibTonal, filled: s.ibFilled, photo: s.ibPhoto }

export function IconButton({ icon, label, variant = "standard", className, fill, ...rest }: { icon: string; label: string; variant?: IbStyle; fill?: boolean } & Omit<ComponentProps<"button">, "children">) {
  return (
    <button type="button" aria-label={label} title={label} className={cx(s.iconBtn, ibClass[variant], className)} {...rest}>
      <Icon name={icon} className={s.icon} fill={fill} />
    </button>
  )
}

export function IconLink({ icon, label, href, variant = "standard", className }: { icon: string; label: string; href: string; variant?: IbStyle; className?: string }) {
  return (
    <Link href={href} aria-label={label} title={label} className={cx(s.iconBtn, ibClass[variant], className)}>
      <Icon name={icon} className={s.icon} />
    </Link>
  )
}

/** One chip for categories and filters (Figma Chip · Filter). `icon` adds the leading category plate (a Material
 *  Symbol name puts that icon in it); selected shows a check. */
export function Chip({ selected, icon, size, href, replace, onClick, children }: { selected?: boolean; icon?: boolean | string; size?: "s"; href?: string; replace?: boolean; onClick?: () => void; children: ReactNode }) {
  const cls = cx(s.chip, size === "s" && s.chipS, selected && s.chipSelected)
  const inner = (
    <>
      {selected ? <Icon name="check" className={s.icon} /> : icon && <span className={s.chipDot} aria-hidden>{typeof icon === "string" && <Icon name={icon} />}</span>}
      {children}
    </>
  )
  // `replace`: filter chips swap the URL instead of stacking history, so Back leaves the page
  if (href) return <Link href={href} replace={replace} scroll={replace ? false : undefined} className={cls} aria-current={selected ? "true" : undefined} onClick={onClick}>{inner}</Link>
  return <button type="button" className={cls} aria-pressed={!!selected} onClick={onClick}>{inner}</button>
}

export type TrackKey = "reset" | "performance" | "mind" | "immersion" | "sport"
export function TrackChip({ track, children }: { track: TrackKey; children: ReactNode }) {
  return (
    <span className={s.track} data-track={track}>
      {children}
    </span>
  )
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className={s.tag}>{children}</span>
}

export function UvpPill({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <span className={s.uvp}>
      <Icon name={icon} className={s.icon} />
      {children}
    </span>
  )
}

export function SeeAll({ href, count, label = "See All" }: { href: string; count?: number; label?: string }) {
  return (
    <Link href={href} className={s.seeAll}>
      {label}
      {typeof count === "number" && <span className={s.seeAllCount}>{count}</span>}
    </Link>
  )
}

export function SectionHead({ title, sub, action, level = 2, titleClass = "ds-headline-m", className }: { title: ReactNode; sub?: ReactNode; action?: ReactNode; level?: 2 | 3; titleClass?: string; className?: string }) {
  const H = level === 2 ? "h2" : "h3"
  return (
    <div className={cx(s.sectionHead, className)}>
      <div>
        <H className={titleClass}>{title}</H>
        {sub && <p className={cx("ds-body-m", s.sectionSub)}>{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function TextField({ label, error, className, ...rest }: { label: string; error?: boolean } & ComponentProps<"input">) {
  return (
    <label className={cx(s.field, error && s.fieldError, className)}>
      <span className={s.fieldLabel}>{label}</span>
      <input className={s.fieldInput} {...rest} />
    </label>
  )
}

export function Tabs({ items, active }: { items: { key: string; label: string; href: string }[]; active: string }) {
  return (
    <nav className={s.tabs}>
      {items.map((t) => (
        <Link key={t.key} href={t.href} className={cx(s.tab, t.key === active && s.tabActive)} aria-current={t.key === active ? "page" : undefined}>
          {t.label}
        </Link>
      ))}
    </nav>
  )
}

/** `card`: a tap anywhere on the row presses its trailing link (see CardClick). */
/** `hue` (OKLCH, 0–360) tints the icon plate: a pale plate and a deeper icon of one hue, the palette of the
 *  home goal tiles. Without it the plate is neutral. */
export function ListItem({ icon, headline, supporting, href, trailing, card, hue }: { icon: string; headline: ReactNode; supporting?: ReactNode; href?: string; trailing?: ReactNode; card?: boolean; hue?: number }) {
  const body = (
    <>
      <span className={cx(s.leading, hue !== undefined && s.leadingTint)} style={hue !== undefined ? { ["--hue" as string]: hue } : undefined}><Icon name={icon} className={s.icon} /></span>
      <span className={s.listText}>
        <span className={s.listHeadline}>{headline}</span>
        {supporting && <span className={s.listSupporting}>{supporting}</span>}
      </span>
      {trailing && <span className={s.trailing}>{trailing}</span>}
    </>
  )
  if (href) return <Link href={href} className={s.listItem}>{body}</Link>
  return <div className={s.listItem} data-card={card ? "" : undefined} style={card ? { cursor: "pointer" } : undefined}>{body}</div>
}

export function Radio({ on }: { on?: boolean }) {
  return <span className={cx(s.radio, on && s.radioOn)} aria-hidden />
}

export function Badge({ icon, size = "l", tone }: { icon: string; size?: "s" | "l"; tone?: "error" }) {
  return (
    <span className={cx(s.badge, size === "s" && s.badgeS, tone === "error" && s.badgeError)}>
      <Icon name={icon} className={s.icon} />
    </span>
  )
}

export function Notice({ title, children, icon = "info" }: { title: ReactNode; children?: ReactNode; icon?: string }) {
  return (
    <div className={s.notice} role="note">
      <Icon name={icon} className={s.icon} />
      <div>
        <p className={s.noticeTitle}>{title}</p>
        {children && <p className={s.noticeText}>{children}</p>}
      </div>
    </div>
  )
}

export function Stars({ value = 5 }: { value?: number }) {
  const full = Math.round(value)
  return (
    <span className={s.stars} aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Icon key={i} name="star" fill={i < full} />
      ))}
    </span>
  )
}

export { cx }

/** Questions that unfold. `openId` opens the item with that `id` (support centre: a tapped question card). */
export function Faq({ items, openId }: { items: { q: string; a: ReactNode; id?: string }[]; openId?: string }) {
  return (
    <div className={s.faq}>
      {items.map((it) => (
        <details key={it.q} id={it.id ? `faq-${it.id}` : undefined} open={!!it.id && it.id === openId} className={s.faqItem}>
          <summary>
            {it.q}
            <Icon name="expand_more" />
          </summary>
          <p className={s.faqBody}>{it.a}</p>
        </details>
      ))}
    </div>
  )
}

// The way a leg is travelled, from its words ("high-speed rail", "transfer", "speedboat")
const LEG_ICONS: [RegExp, string][] = [
  [/rail|train/i, "train"],
  [/fl(?:y|ight)|plane|air/i, "flight"],
  [/ferry|boat|catamaran|cruise/i, "directions_boat"],
  [/bus|coach/i, "directions_bus"],
  [/walk|hike|trek/i, "directions_walk"],
  [/transfer|car|drive|taxi|road|van/i, "directions_car"],
]

export function Route({ stops }: { stops: { name: string; leg?: string }[] }) {
  return (
    <div className={s.route}>
      {stops.map((st, i) => (
        <span key={st.name} style={{ display: "contents" }}>
          <span className={cx(s.stop, i === stops.length - 1 && s.stopLast)}>{st.name}</span>
          {st.leg && (
            <span className={s.leg}>
              {LEG_ICONS.find(([re]) => re.test(st.leg!)) && <Icon name={LEG_ICONS.find(([re]) => re.test(st.leg!))![1]} className={s.legMode} />}
              {st.leg}
              <Icon name="arrow_forward" />
            </span>
          )}
        </span>
      ))}
    </div>
  )
}

export function InfoCard({ icon, label, title, text, children }: { icon?: string; label?: string; title: ReactNode; text?: ReactNode; children?: ReactNode }) {
  return (
    <div className={s.infoCard}>
      {icon && <Icon name={icon} />}
      {label && <span className={s.infoLabel}>{label}</span>}
      <p className={s.infoTitle}>{title}</p>
      {text && <p className={s.infoText}>{text}</p>}
      {children}
    </div>
  )
}

/** Loading placeholder: a pulsing line (text) or block (photo, button). Size it with className. */
export function Skeleton({ shape = "line", className, style }: { shape?: "line" | "block"; className?: string; style?: CSSProperties }) {
  return <span className={cx(s.skeleton, shape === "block" && s.skeletonBlock, className)} style={style} aria-hidden />
}
