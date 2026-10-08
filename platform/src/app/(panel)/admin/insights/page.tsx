import { fetchInsights } from "@/lib/partner-insights"
import InsightsView from "../../_components/InsightsView"

export const dynamic = "force-dynamic"

// Same dashboard partners see on /partner, across every property.
export default async function AdminInsights() {
  const data = await fetchInsights(null)
  return <InsightsView data={data} scopeLabel="All properties — partners see this view scoped to their own" guestBasePath="/admin/users" />
}
