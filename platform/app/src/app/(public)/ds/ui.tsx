import Link from "next/link"
import type { ComponentProps, ReactNode } from "react"
import s from "./ui.module.css"

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ")

/** Material Symbols Rounded glyph (Light 300). */
export function Icon({ name, size, fill, className, label }: { name: string; size?: number; fill?: boolean; className?: string; label?: string }) {
  return (
    <span
      className={cx("ds-icon", className)}
      data-fill={fill ? "1" : undefined}
      style={size ? { fontSize: `${size / 16}rem` } : undefined}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    >
      {name}
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
  if (href) return <Link href={href} replace={replace} scroll={replace ? false : undefined} className={cls} aria-current={selected ? "true" : undefined}>{inner}</Link>
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

export function SectionHead({ title, sub, action, level = 2, titleClass = "ds-headline-m" }: { title: ReactNode; sub?: ReactNode; action?: ReactNode; level?: 2 | 3; titleClass?: string }) {
  const H = level === 2 ? "h2" : "h3"
  return (
    <div className={s.sectionHead}>
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

export function ListItem({ icon, headline, supporting, href, trailing }: { icon: string; headline: ReactNode; supporting?: ReactNode; href?: string; trailing?: ReactNode }) {
  const body = (
    <>
      <span className={s.leading}><Icon name={icon} className={s.icon} /></span>
      <span className={s.listText}>
        <span className={s.listHeadline}>{headline}</span>
        {supporting && <span className={s.listSupporting}>{supporting}</span>}
      </span>
      {trailing && <span className={s.trailing}>{trailing}</span>}
    </>
  )
  if (href) return <Link href={href} className={s.listItem}>{body}</Link>
  return <div className={s.listItem}>{body}</div>
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

export function Faq({ items }: { items: { q: string; a: ReactNode }[] }) {
  return (
    <div className={s.faq}>
      {items.map((it) => (
        <details key={it.q} className={s.faqItem}>
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

export function Route({ stops }: { stops: { name: string; leg?: string }[] }) {
  return (
    <div className={s.route}>
      {stops.map((st, i) => (
        <span key={st.name} style={{ display: "contents" }}>
          <span className={cx(s.stop, i === stops.length - 1 && s.stopLast)}>{st.name}</span>
          {st.leg && (
            <span className={s.leg}>
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
