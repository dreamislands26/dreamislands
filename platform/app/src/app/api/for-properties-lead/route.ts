import { NextResponse } from "next/server"
import { sendEmail, adminInbox } from "@/lib/email"
import { forPropertiesLeadReceived } from "@/lib/email-templates"
import { supabaseAdmin } from "@/lib/supabase-server"

const PRIVACY_POLICY_VERSION = "2026-09-for-properties-v1"

type LeadPayload = {
  full_name?: string
  business_email?: string
  role?: string
  property_or_group?: string
  country_city?: string
  website?: string
  program_to_review?: string
  bottleneck?: string
  consent?: boolean
  company_confirm?: string
}

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

// In-memory sliding-window rate limit. This runs in a single pm2 fork
// instance, so it resets on restart and does not share state across
// instances — good enough to blunt naive scripted abuse, not a substitute
// for a real edge/Redis rate limiter if this ever scales to multiple procs.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 5
const hits = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  timestamps.push(now)
  hits.set(ip, timestamps)
  return timestamps.length > RATE_LIMIT_MAX
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  return "unknown"
}

export async function POST(req: Request) {
  const ip = clientIp(req)
  if (isRateLimited(ip)) {
    return bad("too many requests, please try again later", 429)
  }

  let body: LeadPayload
  try {
    body = (await req.json()) as LeadPayload
  } catch {
    return bad("invalid JSON body")
  }

  // Honeypot: real users never see or fill this field (it's visually
  // hidden and unreachable by tab). If it's filled, pretend success
  // without inserting a row or sending an email.
  if ((body.company_confirm ?? "").trim() !== "") {
    return NextResponse.json({ success: true })
  }

  const fullName = (body.full_name ?? "").trim()
  const businessEmail = (body.business_email ?? "").trim()
  const propertyOrGroup = (body.property_or_group ?? "").trim()

  if (!fullName) return bad("full_name required")
  if (!businessEmail || !businessEmail.includes("@")) return bad("valid business_email required")
  if (!propertyOrGroup) return bad("property_or_group required")
  if (!body.consent) return bad("consent required")

  const role = body.role?.trim() || null
  const countryCity = body.country_city?.trim() || null
  const website = body.website?.trim() || null
  const programToReview = body.program_to_review?.trim() || null
  const bottleneck = body.bottleneck?.trim() || null
  const consentAt = new Date().toISOString()
  const userAgent = req.headers.get("user-agent") || null

  // Durable record first. sendEmail is fire-and-forget and swallows
  // delivery failures by design, so this DB row — not the email — is the
  // real, recoverable record of the inquiry.
  const { error: dbError } = await supabaseAdmin.from("for_properties_leads").insert({
    full_name: fullName,
    business_email: businessEmail,
    role,
    property_or_group: propertyOrGroup,
    country_city: countryCity,
    website,
    program_to_review: programToReview,
    bottleneck,
    consent: true,
    consent_at: consentAt,
    privacy_policy_version: PRIVACY_POLICY_VERSION,
    source_ip: ip,
    user_agent: userAgent,
  })

  if (dbError) {
    return bad(`could not save request: ${dbError.message}`, 500)
  }

  const recipients = adminInbox()
  if (recipients.length > 0) {
    const mail = forPropertiesLeadReceived({
      fullName,
      businessEmail,
      role,
      propertyOrGroup,
      countryCity,
      website,
      programToReview,
      bottleneck,
    })
    await sendEmail({
      to: recipients,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      tag: "for-properties-lead",
    })
  }

  return NextResponse.json({ success: true })
}
