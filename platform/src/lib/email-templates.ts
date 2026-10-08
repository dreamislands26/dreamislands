import "server-only"

const BRAND = "Dream Islands Travel"
const BRAND_COLOR = "#1D9E75"

function layout(title: string, body: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#f6f8f7;margin:0;padding:24px;color:#10221c;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;">
    <div style="display:inline-flex;align-items:center;margin-bottom:20px;">
      <div style="width:28px;height:28px;border-radius:8px;background:${BRAND_COLOR};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;margin-right:10px;">D</div>
      <strong style="font-size:15px;">${BRAND}</strong>
    </div>
    <h1 style="font-size:20px;font-weight:700;margin:0 0 16px;color:#10221c;">${escape(title)}</h1>
    ${body}
    <hr style="border:none;border-top:1px solid #eef1ef;margin:24px 0 12px;">
    <p style="font-size:11px;color:#9aa6a1;margin:0;">${BRAND} · wellness OS · SEA</p>
  </div>
</body></html>`
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function btn(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;font-size:14px;">${escape(label)}</a>`
}

// ─── intake (new WBS lead) ────────────────────────────────
export function intakeReceived(args: {
  guestName: string | null
  whatsapp: string
  wbsScore: number | null
  cohort: number | null
  recommendation: string | null
  matchedUrl: string
}) {
  const subject = `🌿 New lead: ${args.guestName ?? args.whatsapp} (WBS ${args.wbsScore ?? "—"}, ${args.recommendation ?? "no reco"})`
  const html = layout(
    "New intake received",
    `<p><strong>Guest:</strong> ${escape(args.guestName ?? "—")} (${escape(args.whatsapp)})</p>
     <p><strong>WBS:</strong> ${args.wbsScore ?? "—"} / 100 · Cohort ${args.cohort ?? "—"} · ${escape(args.recommendation ?? "no recommendation")}</p>
     <p>${btn("Open matched programs", args.matchedUrl)}</p>`,
  )
  const text = `New intake — ${args.guestName ?? args.whatsapp}\nWBS ${args.wbsScore ?? "—"} / 100, cohort ${args.cohort ?? "—"}\n${args.matchedUrl}`
  return { subject, html, text }
}

// ─── public booking inquiry ──────────────────────────────
export function bookingInquiry(args: {
  guestName: string | null
  whatsapp: string
  programName: string
  propertyName: string | null
  arrival: string
  departure: string
  pax: number
  adminBookingUrl: string
}) {
  const subject = `📅 New inquiry: ${args.programName} — ${args.guestName ?? args.whatsapp}`
  const html = layout(
    "New booking inquiry",
    `<p><strong>Guest:</strong> ${escape(args.guestName ?? "—")} (${escape(args.whatsapp)})</p>
     <p><strong>Program:</strong> ${escape(args.programName)}${args.propertyName ? ` @ ${escape(args.propertyName)}` : ""}</p>
     <p><strong>Dates:</strong> ${escape(args.arrival)} → ${escape(args.departure)} · ${args.pax} pax</p>
     <p>${btn("Open in admin", args.adminBookingUrl)}</p>`,
  )
  const text = `New inquiry — ${args.programName}\n${args.guestName ?? args.whatsapp}\n${args.arrival} → ${args.departure} (${args.pax} pax)\n${args.adminBookingUrl}`
  return { subject, html, text }
}

// ─── availability / pricing request (ReserveModal fallback — no priced variant) ──
export function availabilityRequest(args: {
  guestName: string
  guestContact: string
  programName: string
  propertyName: string | null
  arrival: string | null
  pax: number
  sourcePage: string | null
  adminBookingUrl: string
}) {
  const subject = `🔎 Availability request: ${args.programName} — ${args.guestName}`
  const html = layout(
    "New availability & pricing request",
    `<p>This program has no live bookable price yet — the guest was shown "Request availability and pricing" instead of checkout.</p>
     <p><strong>Guest:</strong> ${escape(args.guestName)} (${escape(args.guestContact)})</p>
     <p><strong>Program:</strong> ${escape(args.programName)}${args.propertyName ? ` @ ${escape(args.propertyName)}` : ""}</p>
     <p><strong>Preferred arrival:</strong> ${args.arrival ? escape(args.arrival) : "—"} · ${args.pax} pax</p>
     ${args.sourcePage ? `<p><strong>Source page:</strong> ${escape(args.sourcePage)}</p>` : ""}
     <p>${btn("Open in admin", args.adminBookingUrl)}</p>`,
  )
  const text = `Availability request — ${args.programName}\n${args.guestName} (${args.guestContact})\nArrival: ${args.arrival ?? "—"} · ${args.pax} pax\n${args.sourcePage ? `Source: ${args.sourcePage}\n` : ""}${args.adminBookingUrl}`
  return { subject, html, text }
}

// ─── booking status transitions (3.7) ────────────────────
export function bookingConfirmed(args: {
  guestName: string | null
  programName: string
  arrival: string
  departure: string
  meUrl: string
}) {
  const subject = `✅ Confirmed: ${args.programName} ${args.arrival} → ${args.departure}`
  const html = layout(
    "Your stay is confirmed",
    `<p>Hi ${escape(args.guestName ?? "there")},</p>
     <p>Your stay at <strong>${escape(args.programName)}</strong> is confirmed for ${escape(args.arrival)} → ${escape(args.departure)}.</p>
     <p>We'll reach out by WhatsApp with arrival logistics. You can also see your bookings any time:</p>
     <p>${btn("Open my profile", args.meUrl)}</p>`,
  )
  const text = `Stay confirmed — ${args.programName}, ${args.arrival} → ${args.departure}\n${args.meUrl}`
  return { subject, html, text }
}

export function preWbsReminder(args: {
  guestName: string | null
  programName: string
  meUrl: string
}) {
  const subject = `🌅 Take your pre-stay WBS — ${args.programName}`
  const html = layout(
    "Pre-stay baseline",
    `<p>Hi ${escape(args.guestName ?? "there")},</p>
     <p>Welcome to <strong>${escape(args.programName)}</strong>. Take a 5-minute WBS now so we can compare with your post-stay score.</p>
     <p>${btn("Take pre-stay WBS", args.meUrl)}</p>`,
  )
  const text = `Take pre-stay WBS for ${args.programName}\n${args.meUrl}`
  return { subject, html, text }
}

export function postWbsReminder(args: {
  guestName: string | null
  programName: string
  meUrl: string
}) {
  const subject = `🌇 How are you feeling? — post-stay WBS`
  const html = layout(
    "Post-stay baseline",
    `<p>Hi ${escape(args.guestName ?? "there")},</p>
     <p>Hope your stay at <strong>${escape(args.programName)}</strong> was restorative. Take your post-stay WBS so we can show you the delta.</p>
     <p>${btn("Take post-stay WBS", args.meUrl)}</p>`,
  )
  const text = `Take post-stay WBS for ${args.programName}\n${args.meUrl}`
  return { subject, html, text }
}

// ─── magic-link (3.2) ────────────────────────────────────
export function magicLink(args: { email: string; link: string }) {
  const subject = `Sign in to ${BRAND}`
  const html = layout(
    "Your sign-in link",
    `<p>Click below to sign in to ${escape(BRAND)}. The link expires in one hour.</p>
     <p>${btn("Sign in", args.link)}</p>
     <p style="font-size:12px;color:#6b7975;margin-top:16px;">If you didn't request this, ignore this email.</p>`,
  )
  const text = `Sign in: ${args.link}\nThe link expires in one hour.`
  return { subject, html, text }
}

// ─── guest profile: one-time sign-in code ────────────────
export function guestLoginCode(args: { guestName: string | null; code: string }) {
  const hi = args.guestName ? `Hi ${escape(args.guestName)},` : "Hi,"
  const subject = `${args.code} is your Dream Islands code`
  const html = layout(
    "Your sign-in code",
    `<p>${hi}</p>
     <p>Enter this code on the Dream Islands site to open your profile:</p>
     <p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:8px 0 16px;color:#10221c;">${escape(args.code)}</p>
     <p style="font-size:12px;color:#6b7975;">The code works once and expires in one hour. If you didn't request it, ignore this email.</p>`,
  )
  const text = `Your Dream Islands code: ${args.code}\nIt works once and expires in one hour.`
  return { subject, html, text }
}

// ─── guest report right after the WS assessment ──────────
export function guestReport(args: {
  guestName: string | null
  score: number | null
  focus: string | null
  dimensions: Array<{ label: string; value: number }>
  profileUrl: string
}) {
  const hi = args.guestName ? `Hi ${escape(args.guestName)},` : "Hi,"
  const rows = args.dimensions
    .map(
      (d) => `<tr><td style="padding:6px 0;color:#5b6b65;font-size:14px;">${escape(d.label)}</td>
        <td style="padding:6px 0;text-align:right;font-weight:600;font-size:14px;">${d.value}</td></tr>`,
    )
    .join("")
  const subject = `Your Wellbeing & Wellness Score: ${args.score ?? "—"}/100`
  const html = layout(
    "Your Wellbeing & Wellness Score",
    `<p>${hi}</p>
     <p>Thanks for taking the assessment. Here's your baseline.</p>
     <p style="font-size:44px;font-weight:700;margin:8px 0 0;color:${BRAND_COLOR};">${args.score ?? "—"}<span style="font-size:18px;color:#9aa6a1;">/100</span></p>
     ${args.focus ? `<p style="margin:4px 0 16px;color:#5b6b65;">${escape(args.focus)}</p>` : ""}
     <table style="width:100%;border-collapse:collapse;border-top:1px solid #eef1ef;margin-bottom:20px;">${rows}</table>
     <p>Keep your report in your profile — it tracks how your score changes before, during and after your journey.</p>
     <p>${btn("View report in profile", args.profileUrl)}</p>`,
  )
  const text = `Your Wellbeing & Wellness Score: ${args.score ?? "—"}/100\n${args.dimensions.map((d) => `${d.label}: ${d.value}`).join("\n")}\nView report in profile: ${args.profileUrl}`
  return { subject, html, text }
}

// ─── partner requests a new property ──────────────────────
export function propertyRequestSubmitted(args: {
  partnerEmail: string
  propertyName: string
  island: string | null
  country: string | null
  description: string | null
  contactName: string | null
  contactPhone: string | null
  adminUrl: string
}) {
  const subject = `🏝 Property request: ${args.propertyName} — ${args.partnerEmail}`
  const location = [args.island, args.country].filter(Boolean).join(", ")
  const html = layout(
    "New property request",
    `<p><strong>Partner:</strong> ${escape(args.partnerEmail)}</p>
     <p><strong>Property:</strong> ${escape(args.propertyName)}${location ? ` — ${escape(location)}` : ""}</p>
     ${args.contactName || args.contactPhone
       ? `<p><strong>Contact:</strong> ${escape(args.contactName ?? "—")}${args.contactPhone ? ` · ${escape(args.contactPhone)}` : ""}</p>`
       : ""}
     ${args.description ? `<p><strong>Notes:</strong> ${escape(args.description)}</p>` : ""}
     <p style="font-size:13px;color:#6b7975;">The request is saved in the platform — the partner can see its status in their Properties tab.</p>
     <p>${btn("Open properties", args.adminUrl)}</p>`,
  )
  const text = `Property request from ${args.partnerEmail}\n${args.propertyName}${location ? ` — ${location}` : ""}\n${args.description ?? ""}\n${args.adminUrl}`
  return { subject, html, text }
}

// ─── for-properties (new platform lead) ────────────────────────────────
export function forPropertiesLeadReceived(args: {
  fullName: string
  businessEmail: string
  role: string | null
  propertyOrGroup: string
  countryCity: string | null
  website: string | null
  programToReview: string | null
  bottleneck: string | null
}): { subject: string; html: string; text: string } {
  const subject = `New platform demo request — ${args.propertyOrGroup}`
  const rows: Array<[string, string | null]> = [
    ["Contact", `${args.fullName} (${args.businessEmail})`],
    ["Role", args.role],
    ["Property / group", args.propertyOrGroup],
    ["Country / city", args.countryCity],
    ["Website", args.website],
    ["Program to review", args.programToReview],
    ["Operational bottleneck", args.bottleneck],
  ]
  const body = `
    <p style="font-size:14px;color:#3c4a45;margin:0 0 18px;">A wellness property requested a platform demo via /for-properties.</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      ${rows
        .filter(([, v]) => v)
        .map(
          ([k, v]) =>
            `<tr><td style="padding:6px 10px 6px 0;color:#9aa6a1;white-space:nowrap;vertical-align:top;">${escape(k)}</td><td style="padding:6px 0;color:#10221c;">${escape(v as string)}</td></tr>`,
        )
        .join("")}
    </table>
    <div style="margin-top:20px;">${btn("Reply to " + args.fullName, `mailto:${args.businessEmail}`)}</div>
  `
  const text = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n")
  return { subject, html: layout(subject, body), text }
}
