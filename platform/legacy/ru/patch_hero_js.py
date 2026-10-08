#!/usr/bin/env python3
# Run on RU VPS: python3 /root/patch_hero_js.py [--dry]
# Makes the client-rendered pages use the resolved hero chain (program -> property -> destination -> global),
# read from /data/program-heroes.json (written by build_ru_all.py). Own hero_image_url always wins. Idempotent, backups made.
import os, shutil, sys
R = "/var/www/dreamislands"
DRY = "--dry" in sys.argv
BK = "/root/backup_hero_js_20261006"
os.makedirs(BK, exist_ok=True)

LOADER = """// hero chain: resolved at generation time by build_ru_all.py (program -> property -> destination -> global)
var DI_HEROES = window.DI_HEROES || null;
async function diHeroes() {
  if (DI_HEROES) return DI_HEROES;
  try { DI_HEROES = await (await fetch('/data/program-heroes.json', { cache: 'no-cache' })).json(); } catch (e) { DI_HEROES = {}; }
  return DI_HEROES;
}
"""

def patch(fn, pairs, add_loader=True):
    path = R + "/js/" + fn
    s = open(path, encoding="utf-8").read()
    if "DI_HEROES" in s:
        print(fn, "already patched"); return
    for old, new in pairs:
        if s.count(old) != 1:
            print("ANCHOR FAIL", fn, repr(old[:60]), s.count(old)); return
        s = s.replace(old, new)
    if add_loader: s = LOADER + "\n" + s
    if not DRY:
        shutil.copy(path, BK + "/" + fn)
        open(path, "w", encoding="utf-8").write(s)
    print(("WOULD PATCH " if DRY else "patched ") + fn)

# program-detail.js: await map in bootstrap, use it in the hero
patch("program-detail.js", [
    ("    const program = await TanyaAPI.getProgramBySlug(slug);\n    if (!program) { pdRenderNotFound(); return; }",
     "    const program = await TanyaAPI.getProgramBySlug(slug);\n    if (!program) { pdRenderNotFound(); return; }\n    await diHeroes();"),
    ("  const bg = p.hero_image_url || '/assets/img/prog-standard.webp';",
     "  const bg = p.hero_image_url || (DI_HEROES && DI_HEROES[p.slug]) || '/assets/img/prog-standard.webp';"),
])

# programs.js: await map before rendering cards, use it in the card
patch("programs.js", [
    ("    const { programs, variants, reviews, faq, services } = await TanyaAPI.loadAll();",
     "    await diHeroes();\n    const { programs, variants, reviews, faq, services } = await TanyaAPI.loadAll();"),
    ('<img src="${p.hero_image_url || meta.img}"',
     '<img src="${p.hero_image_url || (DI_HEROES && DI_HEROES[p.slug]) || meta.img}"'),
])
