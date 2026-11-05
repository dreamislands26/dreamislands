import { timingSafeEqual } from "node:crypto"
import { rm } from "node:fs/promises"
import path from "node:path"
import { revalidateCatalog } from "@/lib/catalog-revalidate"

// On-demand cache reset for changes made outside the panel (SQL, apply_*.py scripts, Supabase Studio).
//
//   curl -X POST -H "x-revalidate-secret: $REVALIDATE_SECRET" http://127.0.0.1:3000/api/revalidate
//     -> drops the public catalog data cache (programs, properties, media, reviews...).
//   ...add ?images=1 to also delete the optimised image cache (.next/cache/images); use it after a photo
//     was replaced in Supabase Storage under the SAME file name. Browsers may still hold the old picture
//     for up to images.minimumCacheTTL, so a new photo should get a new file name.
//
// Off unless REVALIDATE_SECRET is set in .env.local. Without the right header it answers 404.

export const dynamic = "force-dynamic"

function authorised(req: Request) {
  const secret = process.env.REVALIDATE_SECRET
  const given = req.headers.get("x-revalidate-secret")
  if (!secret || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: Request) {
  if (!authorised(req)) return new Response("Not found", { status: 404 })
  revalidateCatalog()
  let images = false
  if (new URL(req.url).searchParams.get("images") === "1") {
    await rm(path.join(process.cwd(), ".next", "cache", "images"), { recursive: true, force: true })
    images = true
  }
  return Response.json({ catalog: true, images, at: new Date().toISOString() })
}
