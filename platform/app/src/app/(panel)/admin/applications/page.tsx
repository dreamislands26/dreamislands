import { listApplications } from "@/lib/partner-applications"
import ApplicationsView from "./ApplicationsView"

export const dynamic = "force-dynamic"

export default async function ApplicationsPage() {
  return <ApplicationsView rows={await listApplications()} />
}
