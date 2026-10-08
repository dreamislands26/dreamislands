import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

const STATUSES = ["pending", "in_review", "approved", "rejected"] as const

type PatchPayload = {
  status?: (typeof STATUSES)[number]
  admin_note?: string | null
  linked_property_id?: string | null
}

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)
  const { id } = await params

  let body: PatchPayload
  try {
    body = (await req.json()) as PatchPayload
  } catch {
    return bad("invalid JSON body")
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return bad(`status must be one of ${STATUSES.join(", ")}`)
    update.status = body.status
  }
  if (body.admin_note !== undefined) update.admin_note = body.admin_note?.trim() || null
  if (body.linked_property_id !== undefined) update.linked_property_id = body.linked_property_id || null

  if (Object.keys(update).length === 1) return bad("no fields to update")

  const { data, error } = await supabaseAdmin
    .from("property_requests")
    .update(update)
    .eq("id", id)
    .select("id, property_name, status, admin_note, linked_property_id, updated_at")
    .single()

  if (error) return bad(error.message)
  return NextResponse.json({ success: true, request: data })
}
