#!/usr/bin/env python3
"""Locale-aware navigation hooks. In app/(public): `usePathname` / `useRouter` from next/navigation are replaced by
lib/i18n-nav (usePathname returns the path WITHOUT /zh|/id so route checks keep working; router.push/replace/prefetch
add the locale prefix). Needs apply_i18n_core.py first. Idempotent, with backup.
Usage: python3 apply_i18n_nav.py /opt/dit-platform/src"""
import pathlib, re, shutil, sys, time

src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/opt/dit-platform/src")
pub = src / "app/(public)"
if not (src / "lib/i18n.ts").exists():
    sys.exit("Apply apply_i18n_core.py first")

NAV = r'''"use client"
import { useMemo } from "react"
import { usePathname as useNextPathname, useRouter as useNextRouter } from "next/navigation"
import { localizeHref, stripLocale } from "./i18n"
import { useLocale } from "./i18n-client"

/** Current path without the /zh or /id prefix, so route checks (startsWith("/programs") ...) work in every locale. */
export function usePathname(): string {
  return stripLocale(useNextPathname() || "/").path
}

/** next/navigation router that keeps the visitor inside the current locale. */
export function useRouter() {
  const r = useNextRouter()
  const locale = useLocale()
  return useMemo(
    () => ({
      ...r,
      push: (href: string, o?: Parameters<typeof r.push>[1]) => r.push(localizeHref(href, locale), o),
      replace: (href: string, o?: Parameters<typeof r.replace>[1]) => r.replace(localizeHref(href, locale), o),
      prefetch: (href: string, o?: Parameters<typeof r.prefetch>[1]) => r.prefetch(localizeHref(href, locale), o),
    }),
    [r, locale],
  )
}
'''

imp = re.compile(r'import\s*\{([^}]*)\}\s*from\s*"next/navigation"[ \t]*\n')
bak = pathlib.Path(f"/root/i18n_nav_bak_{time.strftime('%Y%m%d_%H%M%S')}")
changed = []
for f in sorted(list(pub.rglob("*.tsx")) + list(pub.rglob("*.ts"))):
    t = f.read_text(encoding="utf-8")
    if "@/lib/i18n-nav" in t:
        continue
    m = imp.search(t)
    if not m:
        continue
    names = [n.strip() for n in m.group(1).split(",") if n.strip()]
    moved = [n for n in names if n in ("usePathname", "useRouter")]
    if not moved:
        continue
    rest = [n for n in names if n not in moved]
    new = (f'import {{ {", ".join(rest)} }} from "next/navigation"\n' if rest else "") + f'import {{ {", ".join(moved)} }} from "@/lib/i18n-nav"\n'
    dest = bak / f.relative_to(src)
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(f, dest)
    f.write_text(t[: m.start()] + new + t[m.end():], encoding="utf-8")
    changed.append(str(f.relative_to(src)))

nav = src / "lib/i18n-nav.ts"
if not nav.exists():
    nav.write_text(NAV, encoding="utf-8")
print(f"patched {len(changed)} files; backup in {bak}" if changed else "nothing to patch")
for c in changed:
    print(" ", c)
