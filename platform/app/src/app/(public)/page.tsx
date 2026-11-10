import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth"
import { OG_IMAGES, TWITTER_IMAGES } from "@/lib/og"
import HomeV2 from "./_components/HomeV2"
import { loadGallery, loadOutcomes, loadPrograms, loadProperties, loadReviews } from "./_lib/catalog"

export const dynamic = "force-dynamic"

// Keyword-bearing home title and description (the layout default is a brand line with no search terms).
const HOME_TITLE = "Wellness & Longevity Retreats in Asia, Matched to Your Goal | Dream Islands"
const HOME_DESC =
  "Compare wellness, longevity, sleep, stress and recovery retreat programmes across Thailand, China, Indonesia, Singapore, the Philippines, Vietnam and Malaysia. Take a 2-minute Wellness Journey and get matched."
export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESC,
  openGraph: { title: HOME_TITLE, description: HOME_DESC, url: "https://dreamislands.org", type: "website", images: OG_IMAGES },
  twitter: { card: "summary_large_image", title: HOME_TITLE, description: HOME_DESC, images: TWITTER_IMAGES },
}

const PANEL_HOSTS = new Set(["panel.dreamislands.org"])
const PUBLIC_HOSTS = new Set(["dreamislands.org", "www.dreamislands.org"])

export default async function Root() {
  const host = ((await headers()).get("host") ?? "").toLowerCase().split(":")[0]
  const isPanel = PANEL_HOSTS.has(host)
  const isPublic = PUBLIC_HOSTS.has(host)

  // The catalog does not depend on who is signed in: start it together with the session check.
  const catalog = isPanel ? null : Promise.all([loadPrograms(), loadProperties(), loadOutcomes(), loadReviews()])
  catalog?.catch(() => {}) // a redirect below may leave it unawaited; the await further down still rethrows

  const user = await getSessionUser()

  if (isPanel) {
    if (!user) redirect("/login")
    if (user.role === "admin") redirect("/admin")
    if (user.role === "partner") redirect("/partner")
    // Guests live on the public site, not the staff panel.
    redirect(`${(process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "").replace(/\/$/, "")}/profile`)
  }

  if (!isPublic) {
    if (user?.role === "admin") redirect("/admin")
    if (user?.role === "partner") redirect("/partner")
  }

  const [programs, props, outcomes, reviews] = await catalog!
  const tanya = props.find((p) => p.slug === "tanya-core") ?? null
  const chinaImage = props.find((p) => p.slug === "wudang-mountain-wellness-center")?.image_url ?? null
  const tanyaPhotos = tanya ? (await loadGallery({ property_id: tanya.id }, "Tanya Samui")).slice(0, 3).map((g) => g.url) : []
  return <HomeV2 programs={programs} tanya={tanya} tanyaPhotos={tanyaPhotos} chinaImage={chinaImage} outcomes={outcomes} properties={props} reviews={reviews} />
}
