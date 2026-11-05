import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
const revalidateTag = vi.fn()
vi.mock("next/cache", () => ({ revalidateTag: (...a: unknown[]) => revalidateTag(...a) }))

const { withCatalogRevalidate } = await import("./catalog-revalidate")

describe("withCatalogRevalidate", () => {
  beforeEach(() => revalidateTag.mockClear())

  it("drops the catalog cache at once after a successful write", async () => {
    const handler = withCatalogRevalidate(async () => Response.json({ ok: true }, { status: 201 }))
    const res = await handler(new Request("http://x/api/programs", { method: "POST" }), {})
    expect(res.status).toBe(201)
    expect(revalidateTag).toHaveBeenCalledWith("catalog", { expire: 0 })
  })

  it("keeps the cache when the write was refused or failed", async () => {
    for (const status of [400, 401, 403, 404, 500]) {
      const handler = withCatalogRevalidate(async () => new Response(null, { status }))
      await handler(new Request("http://x/api/programs/1", { method: "PATCH" }), { params: Promise.resolve({ id: "1" }) })
    }
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it("passes the request and route context through unchanged", async () => {
    const inner = vi.fn(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => Response.json({ id: (await ctx.params).id }))
    const req = new Request("http://x/api/programs/abc", { method: "DELETE" })
    const res = await withCatalogRevalidate(inner)(req, { params: Promise.resolve({ id: "abc" }) })
    expect(inner.mock.calls[0][0]).toBe(req)
    expect(await res.json()).toEqual({ id: "abc" })
  })
})
