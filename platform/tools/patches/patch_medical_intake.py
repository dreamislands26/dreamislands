#!/usr/bin/env python3
# Medical case intake ("Submit Your Case"): no program_id, no payment, no checkout.
#  - api/bookings/public/route.ts : request_type="medical_case" branch -> users + bookings(status inquiry, program_id optional,
#                                   inquiry_context.kind="medical_case", case text stored in DB only, e-mail notification WITHOUT case text)
#  - ReserveModal.tsx             : in case mode: case textarea (required), arrival optional, no program required
#  - properties/[slug]/page.tsx   : hospital/network pages without programs get the Submit Your Case button
#  - ProgramDetailView.tsx        : hides tier chip (e.g. RESET) on medical programs
# Backups: /tmp/*.medintake.bak. Does NOT build.
import shutil, os

APP = "/opt/dit-platform/src/app"
ROUTE = APP + "/api/bookings/public/route.ts"
MODAL = APP + "/(public)/_components/ReserveModal.tsx"
PROP = APP + "/(public)/properties/[slug]/page.tsx"
VIEW = APP + "/(public)/programs/[slug]/ProgramDetailView.tsx"

def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()

def save(p, s):
    shutil.copy(p, "/tmp/" + os.path.basename(p) + ".medintake.bak")
    with open(p, "w", encoding="utf-8") as f:
        f.write(s)

def rep(s, old, new, label, count=1):
    n = s.count(old)
    if n != count:
        raise SystemExit("ANCHOR PROBLEM (%s): expected %d, found %d. Nothing written for this file." % (label, count, n))
    return s.replace(old, new)

# ================= route.ts =================
s = read(ROUTE)
if "handleMedicalCase" in s:
    print("route already patched")
else:
    s = rep(s, "  source_page?: string\n}\n\nconst cors",
               "  source_page?: string\n  // Medical case intake (ReserveModal case mode): no checkout, no program required\n  request_type?: string\n  case_summary?: string\n}\n\nconst cors", "route type")
    s = rep(s, "  // Availability/pricing-request fallback (ReserveModal.tsx, program has no",
               "  // Medical case intake (Submit Your Case) - must come before the availability fallback.\n"
               "  if (!body.user_id && body.request_type === \"medical_case\") {\n"
               "    return handleMedicalCase(req, body)\n"
               "  }\n\n"
               "  // Availability/pricing-request fallback (ReserveModal.tsx, program has no", "route branch")
    fn = '''
function escHtml(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

// Medical case intake: stores the case durably, takes no payment, never opens checkout.
// The free-text case description is kept ONLY in bookings.inquiry_context (not e-mailed).
async function handleMedicalCase(req: Request, body: PublicBookingPayload) {
  const programId = (body.program_id ?? "").trim() || null
  const propertyId = (body.property_id ?? "").trim() || null
  const guestName = (body.guest_name ?? "").trim()
  const guestEmail = (body.guest_email ?? "").trim() || null
  const guestWhatsapp = (body.guest_whatsapp ?? "").trim() || null
  const caseSummary = (body.case_summary ?? "").trim()
  const arrival = (body.arrival ?? "").trim()
  const pax = Number(body.pax ?? 1)

  if (!guestName) return bad("guest_name required")
  if (!guestEmail && !guestWhatsapp) return bad("guest_email or guest_whatsapp required")
  if (caseSummary.length < 10) return bad("case_summary required")
  if (caseSummary.length > 4000) return bad("case_summary too long")
  if (arrival && !ISO_DATE.test(arrival)) return bad("arrival must be YYYY-MM-DD")
  if (!Number.isInteger(pax) || pax < 1 || pax > 20) return bad("pax must be 1-20")

  let programName: string | null = null
  if (programId) {
    const { data: program } = await supabaseAdmin
      .from("programs")
      .select("id, name, active")
      .eq("id", programId)
      .maybeSingle()
    if (!program || !program.active) return bad("unknown or inactive program_id", 404)
    programName = program.name
  }
  let propertyName: string | null = body.property_name ?? null
  if (propertyId) {
    const { data: prop } = await supabaseAdmin
      .from("properties")
      .select("id, name, active")
      .eq("id", propertyId)
      .maybeSingle()
    if (!prop || !prop.active) return bad("unknown or inactive property_id", 404)
    propertyName = prop.name
  }

  const { data: guestUser, error: guestErr } = await supabaseAdmin
    .from("users")
    .insert({
      name: guestName,
      email: guestEmail,
      whatsapp: guestWhatsapp,
      country: body.destination_country ?? null,
      source: "website_medical_case",
    })
    .select("id")
    .single()
  if (guestErr || !guestUser) return bad(guestErr?.message ?? "could not create guest record")

  const inquiryContext = {
    kind: "medical_case",
    status_note: "case_review_pending",
    case_summary: caseSummary,
    program_id: programId,
    program_name: programName,
    property_id: propertyId,
    property_name: propertyName,
    destination_country: body.destination_country ?? null,
    source_page: body.source_page ?? null,
    guest_contact: { email: guestEmail, whatsapp: guestWhatsapp },
    attribution: {
      market_country: body.market_country ?? null,
      traffic_channel: body.traffic_channel ?? null,
      utm_source: body.utm_source ?? null,
      utm_medium: body.utm_medium ?? null,
      utm_campaign: body.utm_campaign ?? null,
      ga_client_id: body.ga_client_id ?? null,
      session_id: body.session_id ?? null,
    },
  }

  const { data: booking, error: bookingErr } = await supabaseAdmin
    .from("bookings")
    .insert({
      user_id: guestUser.id,
      program_id: programId,
      arrival: arrival || null,
      pax,
      status: "inquiry",
      payment_status: "unpaid",
      source: "website_medical_case",
      inquiry_context: inquiryContext,
    })
    .select("id")
    .single()
  if (bookingErr || !booking) return bad(bookingErr?.message ?? "could not create booking")

  logFunnelEvent({
    event_name: "medical_case_submitted",
    ga_client_id: body.ga_client_id || null,
    session_id: body.session_id || null,
    user_id: guestUser.id,
    booking_id: booking.id,
    market_country: body.market_country || null,
    destination_country: body.destination_country || null,
    property_id: propertyId,
    program_id: programId,
    utm_source: body.utm_source || null,
    utm_medium: body.utm_medium || null,
    utm_campaign: body.utm_campaign || null,
    traffic_channel: body.traffic_channel || null,
  })

  void (async () => {
    try {
      const origin = new URL(req.url).origin
      const partnerEmails = propertyId ? await partnerEmailsForProperties([propertyId]) : []
      const recipients = Array.from(new Set([...adminInbox(), ...partnerEmails]))
      if (recipients.length === 0) return
      const subject = `New medical case: ${programName ?? propertyName ?? "general"}`
      const html =
        `<p>New medical case submitted on the website.</p>` +
        `<p><strong>Guest:</strong> ${escHtml(guestName)}<br/>` +
        `<strong>Contact:</strong> ${escHtml(guestEmail ?? guestWhatsapp ?? "")}<br/>` +
        `<strong>Provider/page:</strong> ${escHtml(propertyName ?? "-")}<br/>` +
        `<strong>Program:</strong> ${escHtml(programName ?? "not selected (case review decides)")}<br/>` +
        `<strong>Source page:</strong> ${escHtml(body.source_page ?? "-")}</p>` +
        `<p>The case description is stored in the admin panel only: <a href="${origin}/admin/bookings">${origin}/admin/bookings</a></p>`
      const text = `New medical case from ${guestName} (${guestEmail ?? guestWhatsapp ?? ""}). Provider: ${propertyName ?? "-"}. Open ${origin}/admin/bookings to review.`
      await sendEmail({ to: recipients, subject, html, text, tag: "medical_case" } as any)
    } catch (err) {
      console.error("[handleMedicalCase] notify failed:", err)
    }
  })()

  return NextResponse.json({ success: true, booking: { id: booking.id } }, { headers: cors })
}

'''
    s = rep(s, "async function notifyInquiry(args: {", fn.lstrip("\n") + "async function notifyInquiry(args: {", "route fn")
    save(ROUTE, s)
    print("route.ts patched")

# ================= ReserveModal =================
s = read(MODAL)
if "caseSummary" in s:
    print("ReserveModal intake already patched")
else:
    s = rep(s, "  const [pax, setPax] = useState(1)\n", "  const [pax, setPax] = useState(1)\n  const [caseSummary, setCaseSummary] = useState(\"\")\n", "modal state")
    s = rep(s, 'if (!programId) { setError("Pick a program"); return }', 'if (!programId && !caseMode) { setError("Pick a program"); return }', "modal program check")
    s = rep(s, 'if (!arrival) { setError("Pick an arrival date"); return }',
               'if (!arrival && !caseMode) { setError("Pick an arrival date"); return }\n'
               '    if (caseMode && caseSummary.trim().length < 10) { setError("Please describe your case in a few sentences"); return }', "modal arrival check")
    s = rep(s, "const sharedFields = {\n        program_id: programId,", "const sharedFields = {\n        program_id: programId || undefined,", "modal shared")
    s = rep(s, 'source_page: typeof window !== "undefined" ? window.location.pathname : undefined,',
               'source_page: typeof window !== "undefined" ? window.location.pathname : undefined,\n'
               '            request_type: caseMode ? "medical_case" : undefined,\n'
               '            case_summary: caseMode ? caseSummary.trim() : undefined,', "modal payload")
    s = rep(s, "value={arrival} min={today} onChange={(e) => setArrival(e.target.value)} required />",
               "value={arrival} min={today} onChange={(e) => setArrival(e.target.value)} required={!caseMode} />", "modal arrival input")
    s = rep(s, '<div className="eyebrow" style={{ marginBottom: 6 }}>Arrival</div>',
               '<div className="eyebrow" style={{ marginBottom: 6 }}>{caseMode ? "Preferred arrival (optional)" : "Arrival"}</div>', "modal arrival label")
    s = rep(s, "{isPriced && selectedVariant && fullPrice != null",
               '{caseMode && (\n'
               '                  <label>\n'
               '                    <div className="eyebrow" style={{ marginBottom: 6 }}>Your case</div>\n'
               '                    <textarea\n'
               '                      className="field"\n'
               '                      rows={5}\n'
               '                      maxLength={4000}\n'
               '                      value={caseSummary}\n'
               '                      onChange={(e) => setCaseSummary(e.target.value)}\n'
               '                      placeholder="What you need (consultation, second opinion, examination, surgery), main diagnosis or symptoms, preferred city or hospital, languages. Please do not include passport or ID numbers."\n'
               '                      required\n'
               '                    />\n'
               '                  </label>\n'
               '                )}\n'
               '                {isPriced && selectedVariant && fullPrice != null', "modal textarea")
    save(MODAL, s)
    print("ReserveModal intake patched")

# ================= property page =================
s = read(PROP)
if "case_mode: true" in s:
    print("property page intake already patched")
else:
    s = rep(s, "          {programs.length > 0 && (",
               "          {isMedicalProp && programs.length === 0 && (\n"
               "            <ReserveModal\n"
               "              programs={[{\n"
               "                id: \"\",\n"
               "                name: `Case review - ${property.name.trim()}`,\n"
               "                property_id: property.id,\n"
               "                property_name: property.name,\n"
               "                destination_country: property.country ?? undefined,\n"
               "                case_mode: true,\n"
               "              }]}\n"
               "              triggerLabel=\"Submit Your Case\"\n"
               "              triggerClassName=\"btn btn-primary\"\n"
               "            />\n"
               "          )}\n"
               "          {programs.length > 0 && (", "prop button")
    s = rep(s, '<p className="body">No published programs at this property yet.</p>',
               '<p className="body">{isMedicalProp ? "Submit your case: our team reviews it, recommends the suitable provider and programme, and confirms scope and price before any booking." : "No published programs at this property yet."}</p>', "prop empty text")
    save(PROP, s)
    print("property page intake patched")

# ================= ProgramDetailView =================
s = read(VIEW)
if "!isMedical && (" in s and "program.tier && !isMedical" in s:
    print("view tier already patched")
else:
    s = rep(s, '{program.tier && <span className="tag tag-outline">{program.tier}</span>}',
               '{program.tier && !isMedical && <span className="tag tag-outline">{program.tier}</span>}', "view tier")
    save(VIEW, s)
    print("ProgramDetailView tier patched")

print("DONE. Next: cd /opt/dit-platform && rm -rf .next && npm run build   then   pm2 restart dit")
