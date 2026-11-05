import { applicationsEnabled, listApplications } from "@/lib/partner-applications"
import ApplicationsView from "./ApplicationsView"

export const dynamic = "force-dynamic"

export default async function ApplicationsPage() {
  const enabled = applicationsEnabled()
  return <ApplicationsView enabled={enabled} rows={enabled ? await listApplications() : []} />
}
