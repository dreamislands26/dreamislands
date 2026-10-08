import { getSessionUser } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"
import { fetchInsights } from "@/lib/partner-insights"
import InsightsView from "../_components/InsightsView"

export const dynamic = "force-dynamic"

export default async function PartnerOverview() {
  const user = await getSessionUser()
  const propertyIds = user?.partner_property_ids ?? []

  let scopeLabel = "No property linked — ask an admin to link your account to a property"
  if (propertyIds.length > 0) {
    const sb = await supabaseServer()
    const { data } = await sb
      .from("properties")
      .select("name, island, country")
      .in("id", propertyIds)
      .order("name", { ascending: true })
    if (data && data.length > 0) {
      scopeLabel =
        data.length === 1
          ? `Scoped to ${data[0].name} — ${data[0].island}, ${data[0].country}`
          : `Scoped to ${data.map((p) => p.name).join(" · ")}`
    }
  }

  const data = await fetchInsights(propertyIds)
  return (
    <InsightsView
      data={data}
      scopeLabel={scopeLabel}
      guestBasePath="/partner/guests"
      noScope={propertyIds.length === 0}
    />
  )
}
