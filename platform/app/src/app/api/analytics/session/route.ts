import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"

type SessionPayload = {
  session_id?: string
  ga_client_id?: string
  market_country?: string
  destination_country?: string
  traffic_channel?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  gclid?: string
  fbclid?: string
  ttclid?: string
  msclkid?: string
  landing_page?: string
  referrer?: string
  device?: string
  browser?: string
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: cors })
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SessionPayload
    const sessionId = (body.session_id ?? "").trim()
    if (!sessionId) return NextResponse.json({ success: false }, { status: 400, headers: cors })
    const { data: existing } = await supabaseAdmin
      .from("analytics_sessions")
      .select("session_id")
      .eq("session_id", sessionId)
      .maybeSingle()
    if (existing) {
      await supabaseAdmin
        .from("analytics_sessions")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("session_id", sessionId)
    } else {
      await supabaseAdmin.from("analytics_sessions").insert({
        session_id: sessionId,
        ga_client_id: body.ga_client_id ?? null,
        market_country: body.market_country ?? null,
        destination_country: body.destination_country ?? null,
        traffic_channel: body.traffic_channel ?? null,
        utm_source: body.utm_source ?? null,
        utm_medium: body.utm_medium ?? null,
        utm_campaign: body.utm_campaign ?? null,
        utm_content: body.utm_content ?? null,
        utm_term: body.utm_term ?? null,
        gclid: body.gclid ?? null,
        fbclid: body.fbclid ?? null,
        ttclid: body.ttclid ?? null,
        msclkid: body.msclkid ?? null,
        landing_page: body.landing_page ?? null,
        referrer: body.referrer ?? null,
        device: body.device ?? null,
        browser: body.browser ?? null,
      })
    }
    return NextResponse.json({ success: true }, { headers: cors })
  } catch (err) {
    console.error("[analytics/session] failed:", err)
    return NextResponse.json({ success: false }, { status: 500, headers: cors })
  }
}
