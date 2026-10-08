#!/bin/bash
# Patch 1c: country page "Properties" shows only wellness_property; clinics are not listed as properties.
# Run on the EN VPS: bash /root/stage1_pack/patch_country_entity.sh   (edits one src file + tsc; does NOT build)
cd /opt/dit-platform || exit 1
F=$(ls src/app/*/destinations/*/page.tsx | head -1)
[ -n "$F" ] || { echo "page not found"; exit 1; }
cp -n "$F" /root/country-page.tsx.bak_stage1
F="$F" python3 - <<'PY'
import os
p = os.environ["F"]
s = open(p, encoding="utf-8").read()
if 'entity_type", "wellness_property"' in s:
    print("already patched"); raise SystemExit(0)

old1 = '''  const { data: propRows } = await supabaseAdmin
    .from("properties")
    .select("id, name, slug, island, description, certified")
    .eq("active", true)
    .eq("country", country)'''
new1 = '''  // Properties block = wellness properties only. Clinics (hospital_clinic) are a separate entity type.
  const { data: propRows } = await supabasePublic
    .from("properties")
    .select("id, name, slug, island, description, certified")
    .eq("active", true)
    .eq("entity_type", "wellness_property")
    .eq("country", country)'''
assert old1 in s, "properties query anchor not found"
s = s.replace(old1, new1, 1)

old2 = '''  const properties = (propRows ?? []) as PropertyRow[]
'''
new2 = '''  const properties = (propRows ?? []) as PropertyRow[]

  const { count: clinicCountRaw } = await supabasePublic
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("active", true)
    .eq("entity_type", "hospital_clinic")
    .eq("country", country)
  const clinicCount = clinicCountRaw ?? 0
'''
assert old2 in s, "properties const anchor not found"
s = s.replace(old2, new2, 1)

old3 = '''        {programs.length > 0 && (
          <>'''
new3 = '''        {country === "China" && clinicCount > 0 && (
          <p className="body-sm" style={{ marginBottom: 48 }}>
            {clinicCount} partner {clinicCount === 1 ? "hospital" : "hospitals"} in China:{" "}
            <Link href="/medical/china" style={{ color: "inherit", textDecoration: "underline" }}>Medical in China</Link>
          </p>
        )}

        {programs.length > 0 && (
          <>'''
assert s.count(old3) == 1, "programs block anchor not unique/found"
s = s.replace(old3, new3, 1)
open(p, "w", encoding="utf-8").write(s)
print("patched", p)
PY
echo "== diff"; diff -u /root/country-page.tsx.bak_stage1 "$F"
echo "== type-check"; npx tsc --noEmit 2>&1 | head -20; echo "tsc exit: ${PIPESTATUS[0]}"
