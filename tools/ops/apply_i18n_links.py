#!/usr/bin/env python3
"""Make internal links locale-aware: in app/(public) replace `import Link from "next/link"` with the
locale-aware wrapper (lib/i18n-link). Needs apply_i18n_core.py first. Idempotent, with backup.
Usage: python3 apply_i18n_links.py /opt/dit-platform/src"""
import pathlib, shutil, sys, time

src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/opt/dit-platform/src")
pub = src / "app/(public)"
if not (src / "lib/i18n-link.tsx").exists():
    sys.exit("Apply apply_i18n_core.py first")

OLD = ('import Link from "next/link"', "import Link from 'next/link'")
NEW = 'import Link from "@/lib/i18n-link"'
bak = pathlib.Path(f"/root/i18n_links_bak_{time.strftime('%Y%m%d_%H%M%S')}")
changed = []
for f in sorted(pub.rglob("*.tsx")):
    t = f.read_text(encoding="utf-8")
    hit = next((o for o in OLD if o in t), None)
    if not hit:
        continue
    dest = bak / f.relative_to(src)
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(f, dest)
    f.write_text(t.replace(hit, NEW), encoding="utf-8")
    changed.append(str(f.relative_to(src)))
print(f"patched {len(changed)} files; backup in {bak}" if changed else "skip (nothing to patch)")
for c in changed:
    print(" ", c)
