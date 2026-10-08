import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

// Attach/detach a single program to a property. Deliberately not routed through
// PATCH /api/programs/[id] with property_ids: that endpoint replaces the whole
// property set of a program, so a stale client would silently drop another
// property's link.

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)
  const { id: propertyId } = await params

  let body: { program_id?: string }
  try {
    body = (await req.json()) as { program_id?: string }
  } catch {
    return bad("invalid JSON body")
  }
  const programId = (body.program_id ?? "").trim()
  if (!programId) return bad("program_id required")

  const { error } = await supabaseAdmin
    .from("program_properties")
    .upsert(
      { program_id: programId, property_id: propertyId, role: "primary" },
      { onConflict: "program_id,property_id" },
    )
  if (error) return bad(error.message)
  return NextResponse.json({ success: true })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)
  const { id: propertyId } = await params

  const programId = new URL(req.url).searchParams.get("program_id") ?? ""
  if (!programId) return bad("program_id query param required")

  const { error } = await supabaseAdmin
    .from("program_properties")
    .delete()
    .eq("property_id", propertyId)
    .eq("program_id", programId)
  if (error) return bad(error.message)
  return NextResponse.json({ success: true })
}
