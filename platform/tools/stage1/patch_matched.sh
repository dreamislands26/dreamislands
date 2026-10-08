#!/bin/bash
# Patch 1b: matched programs (after the WS assessment) use the same hero resolver.
# Run on the EN VPS: bash /root/stage1_pack/patch_matched.sh   (edits src only; then run repair_stage1.sh build to ship it)
cd /opt/dit-platform || exit 1
F=src/lib/matched-programs.ts
cp -n $F /root/matched-programs.ts.bak_stage1
python3 - <<'PY'
p = "/opt/dit-platform/src/lib/matched-programs.ts"
s = open(p, encoding="utf-8").read()
if "resolveHeroes" in s:
    print("already patched"); raise SystemExit(0)
s = s.replace('import { supabaseAdmin } from "./supabase-server"',
              'import { supabaseAdmin } from "./supabase-server"\nimport { resolveHeroes } from "@/app/(public)/_lib/programMappingResolved"', 1)
s = s.replace('"program_properties(role, properties(name, island, country, contact_wa)), "',
              '"program_properties(role, properties(id, name, island, country, contact_wa)), "', 1)
old = "  return data ?? []\n}"
new = ("  const rows = (data ?? []) as any[]\n"
       "  const heroes = await resolveHeroes(rows)\n"
       "  return rows.map((r, i) => ({ ...r, hero_image_url: heroes[i].url }))\n}")
assert old in s, "return anchor not found"
s = s.replace(old, new, 1)
open(p, "w", encoding="utf-8").write(s)
print("patched", p)
PY
echo "== diff"; diff -u /root/matched-programs.ts.bak_stage1 $F
echo "== type-check"; npx tsc --noEmit 2>&1 | head -20; echo "tsc exit: ${PIPESTATUS[0]}"
echo "== other producers of matched programs (must also use the resolver if they build their own query):"
grep -rnE 'matched_programs|fetchMatchedPrograms' src --include=*.ts --include=*.tsx | grep -v 'src/lib/matched-programs.ts' | cut -c1-170
