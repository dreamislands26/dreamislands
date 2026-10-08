#!/usr/bin/env python3
# Run ON the main VPS from /opt/dit-platform. Aligns the EN hub copy with the Better Migrate service guide
# (Package A inclusions, included / not included, add-on tariffs, confirmed remote second opinion; removes "report translation").
import os, shutil, sys, time
P = "/opt/dit-platform/src/app/(public)/medical/china/page.tsx"
BK = "/tmp/medical_en_copy_backup_" + time.strftime("%Y%m%d%H%M%S")
os.makedirs(BK, exist_ok=True)
shutil.copy(P, BK + "/page.tsx")
s = open(P, encoding="utf-8").read()

def rep(old, new, name):
    global s
    if s.count(old) != 1:
        print("ANCHOR FAIL (%s): found %d" % (name, s.count(old))); sys.exit(1)
    s = s.replace(old, new)

if "30-minute online pre-consultation" in s:
    print("already patched"); sys.exit(0)

rep("Specialist consultation, examination pathway or second opinion without inpatient treatment.</p>",
    "Specialist consultation or examination pathway without inpatient treatment. Includes a 30-minute online pre-consultation (a preliminary assessment and routing, not a second medical opinion), hospital, department and specialist matching, bilingual hospital accompaniment, priority examination arrangement, one complimentary airport or railway station pickup and basic insurance document support.</p>",
    "package A")

rep("Specialist arrangement, pre-operative examinations, scheduling, admission, inpatient support and post-operative communication. Oncology",
    "Includes the basic package, specialist arrangement, pre-operative examination support, surgery scheduling, inpatient assistance, post-operative guidance and medication service support. Oncology",
    "package B")

rep("""          Included in the service fee: appointment coordination, bilingual accompaniment, registration and identity verification, check-in and triage guidance,
          examination coordination, case follow-up. Not included: hospital and medical charges, medication, flights, visa fees, hotel (hotel booking assistance is an add-on).
""",
"""          Included in the service fee: 30-minute online pre-consultation (preliminary assessment and routing), hospital, department and specialist matching,
          specialist appointment coordination, registration and identity verification, bilingual hospital accompaniment, support with payment, examinations and pharmacy,
          one complimentary citywide airport or railway station pickup, basic insurance communication and claim-document organization, case follow-up.
          The exact scope is confirmed in your quotation. Not included: hospital and medical charges (consultations, diagnostics, surgery, medication), flights, visa fees, accommodation.
          For companies: official VAT invoices and corporate bank transfer.
""", "included")

rep("<h2>Optional services, quoted per case</h2>", "<h2>Optional services and partner tariffs</h2>", "optional h2")

rep("""          Interpreter, airport pickup, hotel near the hospital, insurance-document support, 24h emergency access coordination, named specialist appointment, report translation.
""",
"""          Partner tariffs; the final amount is confirmed in your quotation. Additional airport or railway pickup: RMB 300 per trip. Hotel booking assistance near the hospital: RMB 100.
          Interpretation: RMB 200 per hour. Insurance claim document organization: RMB 300 per set. 24-hour emergency medical access coordination: RMB 1,500 per time.
          Travel itinerary assistance: quoted on request. Bilingual hospital accompaniment: outpatient visit up to 4 hours RMB 600, full day (8 hours) RMB 800, inpatient or surgery RMB 1,000 per day.
""", "optional text")

rep('{ q: "Can I get a second opinion before travelling?", a: "Submit your case. The review determines which format is suitable for your situation." },',
    '{ q: "Can I get a second opinion before travelling?", a: "Yes. A remote second opinion is available: your medical documents are reviewed directly by a suitable hospital in China, before you decide whether to travel. Dream Islands and Better Migrate coordinate the case and do not provide the medical opinion. Submit your case and we will confirm the next steps, including how to send your documents. Timing, fee and format of the response are confirmed per case." },',
    "faq second opinion")

open(P, "w", encoding="utf-8").write(s)
print("EN hub copy patched. NEXT: npm run build && pm2 restart dit. Backup:", BK)
