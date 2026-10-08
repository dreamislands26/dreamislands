#!/bin/bash
# Patch 1d: WS top-3 = wellness programs only. Medical pathway programs (linked to a network_coordinator / hospital_clinic
# property) stay in the system but never compete with wellness programs on price for the top-3.
# Medical pathway as a separate, intent-driven block = next matching layer (not done here).
# Run on the EN VPS: bash /root/stage1_pack/patch_matched_wellness.sh   (edits src/lib/matched-programs.ts + tsc; does NOT build)
cd /opt/dit-platform || exit 1
F=src/lib/matched-programs.ts
cp -n $F /root/matched-programs.ts.bak_1d
python3 - <<'PY'
p = "/opt/dit-platform/src/lib/matched-programs.ts"
s = open(p, encoding="utf-8").read()
if "MEDICAL_ENTITY_TYPES" in s:
    print("already patched"); raise SystemExit(0)

a = 'properties(id, name, island, country, contact_wa)'
assert a in s, "select anchor not found"
s = s.replace(a, 'properties(id, name, island, country, contact_wa, entity_type)', 1)

b = "    .limit(3)\n"
assert b in s, "limit anchor not found"
s = s.replace(b, "    .limit(40)\n", 1)

c = "  const rows = (data ?? []) as any[]\n"
assert c in s, "rows anchor not found"
s = s.replace(c, "  // Wellness top-3 only. Medical pathway programs are surfaced by a separate, intent-driven layer (not by price).\n"
              "  const rows = ((data ?? []) as any[]).filter((r) => !isMedicalPathway(r)).slice(0, 3)\n", 1)

d = "/** Top published programs"
assert d in s, "doc anchor not found"
s = s.replace(d, 'const MEDICAL_ENTITY_TYPES = new Set(["network_coordinator", "hospital_clinic"])\n\n'
              "/** A program is a medical pathway if any linked property is a medical network/clinic. */\n"
              "export function isMedicalPathway(row: any): boolean {\n"
              "  return (row?.program_properties ?? []).some((pp: any) => MEDICAL_ENTITY_TYPES.has(pp?.properties?.entity_type))\n"
              "}\n\n" + d, 1)
open(p, "w", encoding="utf-8").write(s)
print("patched", p)
PY
echo "== diff"; diff -u /root/matched-programs.ts.bak_1d $F
echo "== type-check"; npx tsc --noEmit 2>&1 | head -20; echo "tsc exit: ${PIPESTATUS[0]}"
echo "== where the program summary is rendered in matched cards (for the 2-line clamp):"
grep -rn 'summary' src/app/\(public\)/start/AssessmentView.tsx src/app/\(public\)/matched | cut -c1-200
