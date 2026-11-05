import { headers } from "next/headers"
import LoginView from "./LoginView"

export const dynamic = "force-dynamic"

// The application form lives on the public site. On panel.dreamislands.org it is another host;
// locally both share one server, so a relative link is enough.
async function applyUrl() {
  const host = ((await headers()).get("host") ?? "").split(":")[0]
  const publicSite = (process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "").replace(/\/$/, "")
  return host === "panel.dreamislands.org" && publicSite ? `${publicSite}/partners/apply` : "/partners/apply"
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const params = await searchParams
  return <LoginView nextPath={params.next ?? "/"} applyUrl={await applyUrl()} />
}
