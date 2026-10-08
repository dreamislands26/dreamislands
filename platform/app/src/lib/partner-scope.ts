import { supabaseAdmin } from "./supabase-server"

// A partner may see a guest when that guest has a booking on a program linked to
// any of the partner's properties.
export async function partnerCanSeeGuest(
  propertyIds: string[],
  guestId: string,
): Promise<boolean> {
  if (propertyIds.length === 0) return false

  const { data } = await supabaseAdmin
    .from("bookings")
    .select("program_id, programs!inner(program_properties!inner(property_id))")
    .eq("user_id", guestId)

  for (const row of (data ?? []) as unknown as Array<{
    programs: { program_properties: Array<{ property_id: string }> } | null
  }>) {
    for (const pp of row.programs?.program_properties ?? []) {
      if (propertyIds.includes(pp.property_id)) return true
    }
  }
  return false
}
