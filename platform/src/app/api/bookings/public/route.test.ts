import { describe, it, expect, vi, beforeEach } from "vitest"

const { insertMock, stripeCreateMock } = vi.hoisted(() => {
  return {
    insertMock: vi.fn(),
    stripeCreateMock: vi.fn(),
  }
})

vi.mock("@/lib/supabase-server", () => {
  return {
    supabaseAdmin: {
      from: vi.fn((table: string) => {
        if (table === "program_variants") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: "fixture-variant-inactive",
                    program_id: "fixture-program",
                    label: "5D/4N",
                    duration_nights: 4,
                    price_basic_thb: 50000,
                    active: false,
                  },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === "programs") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: "fixture-program",
                    slug: "fixture-program-slug",
                    name: "Fixture Program",
                    active: true,
                    max_guests: null,
                  },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === "users") {
          return {
            insert: insertMock.mockReturnValue({
              select: () => ({
                single: async () => ({ data: { id: "fixture-user" }, error: null }),
              }),
            }),
          }
        }
        if (table === "bookings") {
          return {
            insert: insertMock.mockReturnValue({
              select: () => ({
                single: async () => ({ data: { id: "fixture-booking" }, error: null }),
              }),
            }),
            update: vi.fn(() => ({ eq: async () => ({ error: null }) })),
          }
        }
        throw new Error(`Unexpected table in test: ${table}`)
      }),
    },
  }
})

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: stripeCreateMock,
      },
    },
  },
}))

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
  adminInbox: vi.fn(() => []),
}))

vi.mock("@/lib/email-templates", () => ({
  bookingInquiry: vi.fn(() => ({ subject: "", html: "" })),
}))

import { POST } from "./route"

describe("POST /api/bookings/public - deposit checkout, inactive variant", () => {
  beforeEach(() => {
    insertMock.mockClear()
    stripeCreateMock.mockClear()
  })

  it("returns 404 and creates no booking row or Stripe session for an inactive variant", async () => {
    const req = new Request("https://dreamislands.org/api/bookings/public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        program_id: "fixture-program",
        variant_id: "fixture-variant-inactive",
        arrival: "2027-03-01",
        pax: 1,
        guest_name: "Fixture Guest",
        guest_email: "fixture@example.com",
      }),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json).toEqual({ success: false, error: "unknown or inactive variant_id" })
    expect(insertMock).not.toHaveBeenCalled()
    expect(stripeCreateMock).not.toHaveBeenCalled()
  })
})
