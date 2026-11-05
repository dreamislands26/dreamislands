import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { applicationsEnabled } from "@/lib/partner-applications"
import ApplyForm from "./ApplyForm"

export const metadata: Metadata = {
  title: "Apply as a partner",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

// Local test of the partner application (Mark's interview, B1). Off unless PARTNER_APPLICATIONS_STORE=file.
export default function PartnerApplyPage() {
  if (!applicationsEnabled()) notFound()
  return <ApplyForm />
}
