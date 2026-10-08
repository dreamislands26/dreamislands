import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

type UpdatePayload = {
  role?: "admin" | "partner" | "user"
  partner_property_ids?: string[]
  full_name?: string | null
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
  if (!id) return bad("missing user id")

  let body: UpdatePayload
  try {
    body = (await req.json()) as UpdatePayload
  } catch {
    return bad("invalid JSON body")
  }

  if (id === me.id && body.role && body.role !== me.role) {
    return bad("you cannot change your own role")
  }

  const [{ data: target, error: fetchErr }, { data: currentLinks }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, role, full_name")
      .eq("id", id)
      .single(),
    supabaseAdmin
      .from("partner_properties")
      .select("property_id")
      .eq("profile_id", id),
  ])
  if (fetchErr || !target) return bad("user not found", 404)

  const nextRole = body.role ?? target.role
  if (!["admin", "partner", "user"].includes(nextRole)) {
    return bad("role must be admin, partner or user")
  }

  if (target.role === "admin" && nextRole !== "admin") {
    const { count } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin")
    if ((count ?? 0) <= 1) {
      return bad("cannot demote the last admin")
    }
  }

  const existingIds = (currentLinks ?? []).map((l) => l.property_id as string)
  const nextPropertyIds =
    nextRole === "partner"
      ? Array.from(new Set(body.partner_property_ids ?? existingIds))
      : []

  if (nextRole === "partner" && nextPropertyIds.length === 0) {
    return bad("partner_property_ids required when role=partner")
  }

  const update: Record<string, unknown> = {
    role: nextRole,
    // Dual-write: RLS still scopes off this column until migration 18 lands.
    partner_property_id: nextPropertyIds[0] ?? null,
  }
  if (body.full_name !== undefined) {
    update.full_name = body.full_name?.trim() || null
  }

  const { error: updateErr } = await supabaseAdmin
    .from("profiles")
    .update(update)
    .eq("id", id)

  if (updateErr) return bad(`update failed: ${updateErr.message}`)

  // Replace the link set rather than merging — removing a property must remove access.
  const { error: delErr } = await supabaseAdmin
    .from("partner_properties")
    .delete()
    .eq("profile_id", id)
  if (delErr) return bad(`property unlink failed: ${delErr.message}`)

  if (nextPropertyIds.length > 0) {
    const { error: insErr } = await supabaseAdmin
      .from("partner_properties")
      .insert(nextPropertyIds.map((pid) => ({ profile_id: id, property_id: pid })))
    if (insErr) return bad(`property link failed: ${insErr.message}`)
  }

  return NextResponse.json({ success: true })
}
