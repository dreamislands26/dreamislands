// Default share image. Next.js merges page metadata shallowly, so a page that sets its own `openGraph` / `twitter`
// drops the layout's images: pages without their own photo must pass these explicitly.
export const DEFAULT_OG_IMAGE =
  "https://xbzrtofanbrahasxbisf.supabase.co/storage/v1/object/public/ecosystem/homepage/dream-islands-tropical-sunset-wellness-travel-asia.png"

export const OG_IMAGES = [{ url: DEFAULT_OG_IMAGE, alt: "Dream Islands: wellness travel across Asia" }]
export const TWITTER_IMAGES = [DEFAULT_OG_IMAGE]
