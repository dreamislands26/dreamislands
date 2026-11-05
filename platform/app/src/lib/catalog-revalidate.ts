import "server-only"
import { revalidateTag } from "next/cache"
import { CATALOG_TAG } from "./supabase-catalog"

/** Drop every cached public catalog read now: the next visitor gets fresh rows from Supabase. */
export function revalidateCatalog() {
  revalidateTag(CATALOG_TAG, { expire: 0 })
}

/**
 * Wraps an admin write route handler (POST / PATCH / PUT / DELETE on programs, variants, properties, rooms,
 * services, specialists...). After a successful answer (status < 400) the public catalog cache is dropped,
 * so a change saved in the panel shows on the site at once instead of after the 5 minute cache window.
 */
export function withCatalogRevalidate<Req extends Request, Ctx>(
  handler: (req: Req, ctx: Ctx) => Promise<Response> | Response,
): (req: Req, ctx: Ctx) => Promise<Response> {
  return async (req, ctx) => {
    const res = await handler(req, ctx)
    if (res.status < 400) revalidateCatalog()
    return res
  }
}
