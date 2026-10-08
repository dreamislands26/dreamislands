import "server-only"
import { supabaseAdmin } from "./supabase-server"

// "Program & Guest Insights" — the partner overview. Scoped explicitly to the
// programs linked to the partner's properties (same rule as partner-scope.ts);
// `propertyIds: null` means the admin's all-properties view.

export const STAGES = ["inquiry", "confirmed", "active", "completed", "cancelled"] as const
export type Stage = (typeof STAGES)[number]

export type InsightGuestRow = {
  booking_id: string
  guest_id: string | null
  guest: string
  program: string
  status: string
  arrival: string | null
  pre: number | null
  post: number | null
}

export type ProgramPerformance = { program_id: string; name: string; delta: number; n: number }

export type Dimension = { key: string; label: string; value: number | null }

export type Insights = {
  checkedAt: string
  totalBookings: number
  pipeline: number
  avgUplift: number | null
  upliftN: number
  completed: number
  followUps: number
  stages: Record<Stage, number>
  guests: InsightGuestRow[]
  performance: ProgramPerformance[]
  dimensions: Dimension[]
  assessmentCount: number
}

const DIMENSIONS: Array<{ key: string; label: string }> = [
  { key: "sub_metabolic", label: "Metabolic" },
  { key: "sub_body", label: "Body" },
  { key: "sub_mind", label: "Mind" },
  { key: "sub_recovery", label: "Recovery" },
  { key: "sub_risk", label: "Risk" },
  { key: "sub_performance", label: "Performance" },
]

const round1 = (n: number) => Math.round(n * 10) / 10

export async function fetchInsights(propertyIds: string[] | null): Promise<Insights> {
  let programIds: string[] | null = null
  if (propertyIds) {
    if (propertyIds.length === 0) programIds = []
    else {
      const { data } = await supabaseAdmin
        .from("program_properties")
        .select("program_id")
        .in("property_id", propertyIds)
      programIds = Array.from(new Set((data ?? []).map((r) => r.program_id as string)))
    }
  }

  let bookings: Array<{
    id: string
    user_id: string | null
    program_id: string | null
    arrival: string | null
    status: string
    pre_wbs: number | null
    post_wbs: number | null
  }> = []
  if (programIds === null || programIds.length > 0) {
    let q = supabaseAdmin
      .from("bookings")
      .select("id, user_id, program_id, arrival, status, pre_wbs, post_wbs")
      .order("arrival", { ascending: false, nullsFirst: false })
    if (programIds) q = q.in("program_id", programIds)
    const { data } = await q
    bookings = data ?? []
  }

  const userIds = Array.from(new Set(bookings.map((b) => b.user_id).filter((x): x is string => !!x)))
  const bookedProgramIds = Array.from(new Set(bookings.map((b) => b.program_id).filter((x): x is string => !!x)))

  const [usersRes, programsRes, asmtRes] = await Promise.all([
    userIds.length
      ? supabaseAdmin.from("users").select("id, name, country").in("id", userIds)
      : Promise.resolve({ data: [] }),
    bookedProgramIds.length
      ? supabaseAdmin.from("programs").select("id, name").in("id", bookedProgramIds)
      : Promise.resolve({ data: [] }),
    // Admin sees the population of all assessments; a partner sees their guests'.
    programIds === null
      ? supabaseAdmin
          .from("assessments")
          .select("user_id, " + DIMENSIONS.map((d) => d.key).join(", "))
      : userIds.length
        ? supabaseAdmin
            .from("assessments")
            .select("user_id, " + DIMENSIONS.map((d) => d.key).join(", "))
            .in("user_id", userIds)
        : Promise.resolve({ data: [] }),
  ])

  const users = new Map(
    ((usersRes.data ?? []) as Array<{ id: string; name: string | null; country: string | null }>).map((u) => [u.id, u]),
  )
  const programs = new Map(((programsRes.data ?? []) as Array<{ id: string; name: string }>).map((p) => [p.id, p.name]))

  const stages = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>
  for (const b of bookings) if (b.status in stages) stages[b.status as Stage]++

  const tracked = bookings.filter((b) => b.status !== "cancelled")
  const withScores = bookings.filter((b) => b.pre_wbs != null && b.post_wbs != null)
  const avgUplift = withScores.length
    ? round1(withScores.reduce((s, b) => s + (b.post_wbs! - b.pre_wbs!), 0) / withScores.length)
    : null

  const perf = new Map<string, { sum: number; n: number }>()
  for (const b of withScores) {
    if (!b.program_id) continue
    const cur = perf.get(b.program_id) ?? { sum: 0, n: 0 }
    cur.sum += b.post_wbs! - b.pre_wbs!
    cur.n++
    perf.set(b.program_id, cur)
  }
  const performance: ProgramPerformance[] = Array.from(perf.entries())
    .map(([id, v]) => ({ program_id: id, name: programs.get(id) ?? "Unknown program", delta: round1(v.sum / v.n), n: v.n }))
    .sort((a, b) => b.delta - a.delta)

  const guests: InsightGuestRow[] = bookings.map((b) => {
    const u = b.user_id ? users.get(b.user_id) : undefined
    return {
      booking_id: b.id,
      guest_id: b.user_id,
      guest: u?.name?.trim() || `Guest — ${u?.country || "Unknown"}`,
      program: (b.program_id && programs.get(b.program_id)) || "—",
      status: b.status,
      arrival: b.arrival,
      pre: b.pre_wbs,
      post: b.post_wbs,
    }
  })

  const current = (asmtRes.data ?? []) as unknown as Array<Record<string, unknown>>
  const dimensions: Dimension[] = DIMENSIONS.map((d) => {
    const vals = current.map((a) => a[d.key]).filter((v): v is number => typeof v === "number")
    return { ...d, value: vals.length ? round1(vals.reduce((s, v) => s + v, 0) / vals.length) : null }
  })

  return {
    checkedAt: new Date().toISOString(),
    totalBookings: bookings.length,
    pipeline: tracked.length,
    avgUplift,
    upliftN: withScores.length,
    completed: stages.completed,
    followUps: 0,
    stages,
    guests,
    performance,
    dimensions,
    assessmentCount: current.length,
  }
}
