import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { moveApplication, STAGES, type Stage } from "@/lib/partner-applications"

// Move a partner application along the CRM stages (src/lib/partner-applications.ts).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return NextResponse.json({ success: false, error: "forbidden" }, { status: 403 })

  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as { stage?: string }
  if (!STAGES.some((s) => s.key === body.stage)) {
    return NextResponse.json({ success: false, error: "unknown stage" }, { status: 400 })
  }
  const row = await moveApplication(id, body.stage as Stage, me.email)
  if (!row) return NextResponse.json({ success: false, error: "not found" }, { status: 404 })
  return NextResponse.json({ success: true, application: row })
}
