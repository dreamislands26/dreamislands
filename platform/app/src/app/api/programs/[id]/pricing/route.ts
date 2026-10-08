import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { data: program } = await supabaseAdmin
    .from("programs")
    .select(
      "id, name, active, program_variants(id, label, duration_days, duration_nights, price_basic_thb, price_vip_thb, active, sort_order)"
    )
    .eq("id", id)
    .maybeSingle()
  if (!program || !program.active) {
    return NextResponse.json({ success: false, error: "unknown or inactive program" }, { status: 404 })
  }
  type Variant = {
    id: string
    label: string
    duration_days: number
    duration_nights: number
    price_basic_thb: number | null
    price_vip_thb: number | null
    active: boolean
    sort_order: number
  }
  const variants = ((program as unknown as { program_variants?: Variant[] }).program_variants ?? [])
    .filter((v) => v.active && v.price_basic_thb != null)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((v) => ({
      id: v.id,
      label: v.label,
      duration_days: v.duration_days,
      duration_nights: v.duration_nights,
      price_basic_thb: Number(v.price_basic_thb),
      price_vip_thb: v.price_vip_thb != null ? Number(v.price_vip_thb) : null,
    }))
  return NextResponse.json({
    success: true,
    program: { id: program.id, name: program.name },
    variants,
  })
}
