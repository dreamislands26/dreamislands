#!/bin/bash
# Patch 1e: program summary in WS matched cards is clamped to 2 lines.
# Run on the EN VPS: bash /root/stage1_pack/patch_matched_clamp.sh   (edits one file + tsc; does NOT build)
cd /opt/dit-platform || exit 1
F=$(ls src/app/*/_components/MatchedPrograms.tsx | head -1)
[ -n "$F" ] || { echo "MatchedPrograms.tsx not found"; exit 1; }
cp -n "$F" /root/MatchedPrograms.tsx.bak_1e
F="$F" python3 - <<'PY'
import os
p = os.environ["F"]
s = open(p, encoding="utf-8").read()
if "WebkitLineClamp" in s:
    print("already patched"); raise SystemExit(0)
old = '{p.summary && <p className="body-sm" style={{ margin: 0, color: "var(--ink-2)" }}>{p.summary}</p>}'
new = ('{p.summary && (\n'
       '            <p\n'
       '              className="body-sm"\n'
       '              style={{ margin: 0, color: "var(--ink-2)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}\n'
       '            >\n'
       '              {p.summary}\n'
       '            </p>\n'
       '          )}')
assert s.count(old) == 1, "summary line anchor not found exactly once"
s = s.replace(old, new, 1)
open(p, "w", encoding="utf-8").write(s)
print("patched", p)
PY
echo "== diff"; diff -u /root/MatchedPrograms.tsx.bak_1e "$F"
echo "== type-check"; npx tsc --noEmit 2>&1 | head -20; echo "tsc exit: ${PIPESTATUS[0]}"
