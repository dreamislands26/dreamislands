import type { Metadata } from "next"
import ApplyForm from "./ApplyForm"

export const metadata: Metadata = {
  title: "Apply as a partner",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

// Partner application (Mark's interview, B1). Linked from the partner login page.
export default function PartnerApplyPage() {
  return <ApplyForm />
}
