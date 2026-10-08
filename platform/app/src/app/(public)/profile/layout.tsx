import type { Metadata } from "next"
import ProfileFrame from "./_components/ProfileFrame"
import { loadProfile } from "./_components/load"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "My Wellness Journey — Dream Islands",
  robots: { index: false, follow: false },
}

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const data = await loadProfile()
  return <ProfileFrame data={data}>{data.state === "guest" ? children : null}</ProfileFrame>
}
