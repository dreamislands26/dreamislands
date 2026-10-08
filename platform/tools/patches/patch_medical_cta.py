#!/usr/bin/env python3
# "Submit Your Case" mode for medical programs (properties with entity_type hospital_clinic / network_coordinator).
# - ReserveModal: case_mode -> never goes to checkout, case-review wording, button "Submit Your Case"
# - ProgramDetailView: CTA label, hides "N days / N nights" for medical, hides empty Contraindications
# - programs/[slug]/page.tsx and properties/[slug]/page.tsx: pass entity_type
# Backups: /tmp/*.medcta.bak. Does NOT build.
import re, shutil, os

ROOT = "/opt/dit-platform/src/app/(public)"
MODAL = ROOT + "/_components/ReserveModal.tsx"
VIEW = ROOT + "/programs/[slug]/ProgramDetailView.tsx"
PPAGE = ROOT + "/programs/[slug]/page.tsx"
PROP = ROOT + "/properties/[slug]/page.tsx"

def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()

def write(p, s):
    with open(p, "w", encoding="utf-8") as f:
        f.write(s)

def backup(p):
    shutil.copy(p, "/tmp/" + os.path.basename(p) + ".medcta.bak")

def rep(s, old, new, label, count=1):
    n = s.count(old)
    if n != count:
        raise SystemExit("ANCHOR PROBLEM (%s): expected %d, found %d. Nothing written for this file." % (label, count, n))
    return s.replace(old, new)

def rx(s, pattern, repl, label, count=1, flags=0):
    m = re.findall(pattern, s, flags)
    if len(m) != count:
        raise SystemExit("REGEX PROBLEM (%s): expected %d, found %d. Nothing written for this file." % (label, count, len(m)))
    return re.sub(pattern, repl, s, flags=flags)

# ---------------- ReserveModal ----------------
s = read(MODAL)
if "case_mode" in s:
    print("ReserveModal already patched")
else:
    s = rep(s, "  destination_country?: string\n}\ntype Variant = {",
               "  destination_country?: string\n  case_mode?: boolean\n}\ntype Variant = {", "modal type")
    s = rep(s, "  const isPriced = variantsLoaded && variants.length > 0\n  const isUnpriced = variantsLoaded && variants.length === 0",
               "  const caseMode = !!selectedProgramMeta?.case_mode\n"
               "  const isPriced = !caseMode && variantsLoaded && variants.length > 0\n"
               "  const isUnpriced = caseMode || (variantsLoaded && variants.length === 0)", "modal flags")
    s = rep(s, '{isUnpriced ? "Request availability" : "Reserve dates"}',
               '{caseMode ? "Submit your case" : isUnpriced ? "Request availability" : "Reserve dates"}', "modal eyebrow")
    s = rx(s, r"We don't have live pricing for these dates yet;\s+our team will follow up by email or WhatsApp with availability and pricing shortly\.",
           lambda m: '{caseMode ? "Our case-review team will contact you by email or WhatsApp to confirm a suitable programme and its cost before any booking. No payment is taken now." : "' + re.sub(r"\s+", " ", m.group(0)) + '"}',
           "modal success text")
    s = rx(s, r"We don't have live pricing for this program yet\. Tell us your dates and we'll get back\s+to you with availability and pricing .{1,6} no payment needed now\.",
           lambda m: '{caseMode ? "Tell us briefly about your case. Our team reviews it, confirms a suitable programme and cost, and only then proceeds to booking. No payment is taken now." : "' + re.sub(r"\s+", " ", m.group(0)) + '"}',
           "modal unpriced text")
    s = rep(s, '"Request availability and pricing"', '(caseMode ? "Submit Your Case" : "Request availability and pricing")', "modal button")
    backup(MODAL)
    write(MODAL, s)
    print("ReserveModal patched")

# ---------------- ProgramDetailView ----------------
s = read(VIEW)
if "isMedical" in s:
    print("ProgramDetailView already patched")
else:
    s = rep(s, "  contact_wa: string | null\n}", "  contact_wa: string | null\n  entity_type?: string | null\n}", "view Property type")
    s = rep(s, "  const primaryProperty = properties[0] ?? null\n",
               "  const primaryProperty = properties[0] ?? null\n"
               "  const isMedical = properties.some(\n"
               "    (p) => !!p && (p.entity_type === \"hospital_clinic\" || p.entity_type === \"network_coordinator\"),\n"
               "  )\n", "view isMedical")
    s = rep(s, "destination_country: primaryProperty?.country ?? undefined,",
               "destination_country: primaryProperty?.country ?? undefined,\n                case_mode: isMedical,", "view case_mode", count=2)
    s = rep(s, 'triggerLabel="Reserve dates"', 'triggerLabel={isMedical ? "Submit Your Case" : "Reserve dates"}', "view trigger", count=2)
    s = rx(s, r'(<div className="body-sm">\{v\.duration_days\} days .{1,6} \{v\.duration_nights\} nights</div>)',
           r"{!isMedical && (\1)}", "view duration")
    s = rep(s, "{program.contraindications && (", "{program.contraindications && program.contraindications.trim() !== \"\" && (", "view contra")
    backup(VIEW)
    write(VIEW, s)
    print("ProgramDetailView patched")

# ---------------- programs/[slug]/page.tsx ----------------
s = read(PPAGE)
if "contact_wa, entity_type" in s:
    print("program page already patched")
else:
    s = rep(s, "properties(id, name, slug, island, country, contact_wa)", "properties(id, name, slug, island, country, contact_wa, entity_type)", "ppage select")
    backup(PPAGE)
    write(PPAGE, s)
    print("program page patched")

# ---------------- properties/[slug]/page.tsx ----------------
s = read(PROP)
if "isMedicalProp" in s:
    print("property page already patched")
else:
    s = rep(s, "contact_wa, active, translations\")", "contact_wa, active, translations, entity_type\")", "prop select")
    s = rep(s, "  const flag = property.country ?", "  const isMedicalProp = ((property as any).entity_type === \"hospital_clinic\") || ((property as any).entity_type === \"network_coordinator\")\n  const flag = property.country ?", "prop flag")
    s = rep(s, "destination_country: property.country ?? undefined,", "destination_country: property.country ?? undefined,\n                case_mode: isMedicalProp,", "prop case_mode")
    s = rep(s, 'triggerLabel="Reserve a program here"', 'triggerLabel={isMedicalProp ? "Submit Your Case" : "Reserve a program here"}', "prop trigger")
    backup(PROP)
    write(PROP, s)
    print("property page patched")

print("DONE. Next: cd /opt/dit-platform && rm -rf .next && npm run build   then   pm2 restart dit")
