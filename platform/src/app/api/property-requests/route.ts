import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"
import { adminInbox, sendEmail } from "@/lib/email"
import { propertyRequestSubmitted } from "@/lib/email-templates"

type CreatePayload = {
  property_name?: string
  island?: string | null
  country?: string | null
  description?: string | null
  contact_name?: string | null
  contact_phone?: string | null
}

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(req: Request) {
  const me = await getSessionUser()
  if (!me) return bad("unauthorized", 401)
  if (me.role !== "partner") return bad("forbidden", 403)

  let body: CreatePayload
  try {
    body = (await req.json()) as CreatePayload
  } catch {
    return bad("invalid JSON body")
  }

  const propertyName = (body.property_name ?? "").trim()
  if (!propertyName) return bad("property_name required")

  const { data, error } = await supabaseAdmin
    .from("property_requests")
    .insert({
      // Never taken from the body — the requester is whoever is logged in.
      requested_by: me.id,
      property_name: propertyName,
      island: body.island?.trim() || null,
      country: body.country?.trim() || null,
      description: body.description?.trim() || null,
      contact_name: body.contact_name?.trim() || null,
      contact_phone: body.contact_phone?.trim() || null,
    })
    .select("id, property_name, island, country, status, admin_note, created_at")
    .single()

  if (error) return bad(error.message)

  void notifyPropertyRequest({
    partnerEmail: me.email,
    propertyName,
    island: body.island?.trim() || null,
    country: body.country?.trim() || null,
    description: body.description?.trim() || null,
    contactName: body.contact_name?.trim() || null,
    contactPhone: body.contact_phone?.trim() || null,
  })

  return NextResponse.json({ success: true, request: data })
}

// The partner is copied on purpose: seeing the mail land is the immediate signal
// that the request was received. The DB row is the durable record — sendEmail
// swallows delivery failures by design.
async function notifyPropertyRequest(args: {
  partnerEmail: string
  propertyName: string
  island: string | null
  country: string | null
  description: string | null
  contactName: string | null
  contactPhone: string | null
}) {
  const panelUrl = process.env.NEXT_PUBLIC_PANEL_SITE_URL ?? ""
  const recipients = Array.from(new Set([...adminInbox(), args.partnerEmail])).filter(Boolean)
  if (recipients.length === 0) return

  const mail = propertyRequestSubmitted({
    partnerEmail: args.partnerEmail,
    propertyName: args.propertyName,
    island: args.island,
    country: args.country,
    description: args.description,
    contactName: args.contactName,
    contactPhone: args.contactPhone,
    adminUrl: `${panelUrl}/admin/properties`,
  })

  await sendEmail({
    to: recipients,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  })
}
