#!/usr/bin/env python3
# Medical UI on program detail pages: replaces resort-template wording when the program belongs to a
# hospital_clinic / network_coordinator property (isMedical flag, added by patch_medical_cta.py).
# Claims/texts coming from the database are NOT touched. Backup: /tmp/ProgramDetailView.tsx.medui.bak. Does NOT build.
import re, shutil

VIEW = "/opt/dit-platform/src/app/(public)/programs/[slug]/ProgramDetailView.tsx"

def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()

def rep(s, old, new, label, count=1):
    n = s.count(old)
    if n != count:
        raise SystemExit("ANCHOR PROBLEM (%s): expected %d, found %d. Nothing written." % (label, count, n))
    return s.replace(old, new)

def rx(s, pattern, repl, label, count=1):
    n = len(re.findall(pattern, s, re.S))
    if n != count:
        raise SystemExit("REGEX PROBLEM (%s): expected %d, found %d. Nothing written." % (label, count, n))
    return re.sub(pattern, repl, s, flags=re.S)

s = read(VIEW)
if "isMedical" not in s:
    raise SystemExit("Run patch_medical_cta.py first (isMedical flag missing).")
if "MEDUI" in s:
    raise SystemExit("Already patched (MEDUI marker found).")

# 1) hero tag: "Reset & Recovery" cohort chip -> medical label
s = rx(s, r'(<span className="tag" style=\{\{ background: cohort\.color, color: "white" \}\}>\s*\{cohort\.fullName\}\s*</span>)',
       r'{isMedical ? (<span className="tag" style={{ background: "var(--accent-deep)", color: "white" }}>Medical coordination</span>) : (\1)}',
       "cohort chip")

# 2) WhatsApp: secondary channel, not a booking CTA (message text + label)
s = rep(s, 'encodeURIComponent(`Hi! I\'d like to book "${program.name}".`)',
           'encodeURIComponent(isMedical ? `Hi! I have a question about "${program.name}" before submitting my case.` : `Hi! I\'d like to book "${program.name}".`)',
        "wa message")
s = rx(s, r'(<Icon\.wa width=\{16\} height=\{16\} />) Book on WhatsApp',
       r'\1 {isMedical ? "Ask a coordinator on WhatsApp" : "Book on WhatsApp"}', "wa label")

# 3) footer CTA block
s = rep(s, "            Ready to book?\n", "            {isMedical ? \"Submit Your Case for Review\" : \"Ready to book?\"}\n", "ready to book")
s = rx(s, r'(<span className="display-italic">Talk to a human\.</span> We&apos;ll lock in dates and pre-arrival prep\.)',
       r'{isMedical ? (<><span className="display-italic">Case review first.</span> We confirm the provider, scope and price with you before any booking.</>) : (<>\1</>)}',
       "footer heading")

# 4) optional services block (MEDUI marker lives in the first replacement)
s = rep(s, "              Optional upgrades\n", "              {isMedical ? \"Optional medical services & add-ons\" : \"Optional upgrades\"}{/* MEDUI */}\n", "optional heading")
s = rx(s, r'(Available .{1,4}-la-carte during your stay\.)',
       r'{isMedical ? "Quoted per case after case review." : "\1"}', "alacarte text")
s = rep(s, "{l.services.price_usd != null && (",
           "{l.services.price_usd == null && isMedical && (\n"
           "                    <div style={{ fontWeight: 600, color: \"var(--ink-3)\", fontSize: 13 }}>Quoted per case</div>\n"
           "                  )}\n"
           "                  {l.services.price_usd != null && (", "price null")

shutil.copy(VIEW, "/tmp/ProgramDetailView.tsx.medui.bak")
with open(VIEW, "w", encoding="utf-8") as f:
    f.write(s)
print("ProgramDetailView medical UI patched")
print("DONE. Next: cd /opt/dit-platform && rm -rf .next && npm run build   then   pm2 restart dit")
