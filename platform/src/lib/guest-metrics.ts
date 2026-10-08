/**
 * Guest list/profile aggregation shared by admin and partner panels.
 *
 * Acquisition / distribution / technical source are derived here rather than
 * stored: `users.source` conflates all three, and analytics_sessions is still
 * empty, so persisting a split now would freeze a mapping we can't yet verify.
 */

export type Stage = "lead" | "inquiry" | "confirmed" | "active" | "completed" | "cancelled"

export type Acquisition = "organic" | "paid" | "referral" | "partner" | "direct" | "internal" | "unknown"
export type Distribution = "direct" | "partner" | "agency" | "internal" | "unknown"
export type Technical = "wbs_form" | "checkout" | "manual" | "seed" | "api" | "unknown"

export type DbUser = {
  id: string
  name: string | null
  email: string | null
  whatsapp: string | null
  country: string | null
  wbs_score: number | null
  latest_score: number | null
  latest_focus: string | null
  cohort: number | null
  source: string | null
  language: string | null
  wbs_started_at: string | null
  created_at: string
}

export type DbBooking = {
  id: string
  user_id: string | null
  program_id: string | null
  arrival: string | null
  departure: string | null
  status: string | null
  pre_wbs: number | null
  post_wbs: number | null
  amount_usd: number | null
  full_price: number | null
  currency: string | null
  created_at: string
  confirmed_at: string | null
  started_at: string | null
  completed_at: string | null
  cancelled_at: string | null
}

export type DbProgram = { id: string; name: string; cohort: number | null; tier: string | null }
export type DbProperty = { id: string; name: string; slug: string; active?: boolean }
export type DbProgramProperty = { program_id: string; property_id: string }
export type DbAssessment = {
  user_id: string | null
  focus: string | null
  score: number | null
  completed_at: string | null
}
export type DbWbsDaily = { user_id: string; score: number | null; updated_at: string }
export type DbSession = {
  user_id: string | null
  market_country: string | null
  traffic_channel: string | null
  utm_source: string | null
  utm_medium: string | null
  gclid: string | null
  fbclid: string | null
  last_seen_at: string | null
}
export type DbPartnerLink = { profile_id: string; property_id: string }
export type DbProfile = { id: string; full_name: string | null }

export type NextAction = { label: string; tone: "urgent" | "due" | "idle" }

export type GuestRow = {
  id: string
  name: string | null
  email: string | null
  whatsapp: string | null
  country: string | null
  created_at: string
  last_activity: string | null
  market: string | null
  ws_current: number | null
  ws_baseline: number | null
  goal: string | null
  cohort: number | null
  program_ids: string[]
  program_names: string[]
  property_ids: string[]
  property_names: string[]
  partner_names: string[]
  arrival: string | null
  departure: string | null
  stage: Stage
  acquisition: Acquisition
  distribution: Distribution
  technical: Technical
  gmv_usd: number
  gmv_thb: number
  pre_wbs: number | null
  post_wbs: number | null
  delta_ws: number | null
  next_action: NextAction
  booking_count: number
  source: string | null
}

export type BuildInput = {
  users: DbUser[]
  bookings: DbBooking[]
  programs: DbProgram[]
  programProperties: DbProgramProperty[]
  properties: DbProperty[]
  assessments?: DbAssessment[]
  wbsDaily?: DbWbsDaily[]
  sessions?: DbSession[]
  partnerLinks?: DbPartnerLink[]
  profiles?: DbProfile[]
}

const STAGE_RANK: Record<Stage, number> = {
  lead: 0,
  inquiry: 1,
  confirmed: 2,
  active: 3,
  completed: 4,
  cancelled: 5,
}

export const STAGE_LABEL: Record<Stage, string> = {
  lead: "Lead",
  inquiry: "Inquiry",
  confirmed: "Confirmed",
  active: "In stay",
  completed: "Completed",
  cancelled: "Cancelled",
}

export const STAGE_COLOR: Record<Stage, string> = {
  lead: "default",
  inquiry: "gold",
  confirmed: "blue",
  active: "green",
  completed: "purple",
  cancelled: "red",
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}

function maxDate(...values: Array<string | null | undefined>): string | null {
  let best: string | null = null
  for (const v of values) {
    if (!v) continue
    if (!best || v > best) best = v
  }
  return best
}

/** users.source carries the technical origin of the record, nothing more. */
function technicalFrom(source: string | null): Technical {
  switch (source) {
    case "wbs_form":
      return "wbs_form"
    case "direct_checkout":
      return "checkout"
    case "manual":
      return "manual"
    case "test-seed":
      return "seed"
    case "direct":
      return "api"
    default:
      return "unknown"
  }
}

/** How the guest was won. Analytics wins when present; otherwise inferred. */
function acquisitionFrom(source: string | null, s: DbSession | undefined): Acquisition {
  if (s) {
    if (s.gclid || s.fbclid || s.utm_medium === "cpc" || s.utm_medium === "paid") return "paid"
    if (s.traffic_channel === "organic" || s.utm_medium === "organic") return "organic"
    if (s.traffic_channel === "referral" || s.utm_medium === "referral") return "referral"
    if (s.traffic_channel === "direct") return "direct"
  }
  if (source === "test-seed") return "internal"
  if (source === "manual") return "referral"
  if (source === "wbs_form") return "organic"
  if (source === "direct" || source === "direct_checkout") return "direct"
  return "unknown"
}

/** Who put the booking in front of the guest — us, a partner, or an agency. */
function distributionFrom(
  source: string | null,
  hasPartnerProperty: boolean,
  s: DbSession | undefined,
): Distribution {
  if (source === "test-seed") return "internal"
  if (s?.utm_medium === "affiliate" || s?.utm_medium === "agency") return "agency"
  if (hasPartnerProperty) return "partner"
  if (source) return "direct"
  return "unknown"
}

function stageFrom(statuses: string[]): Stage {
  if (statuses.length === 0) return "lead"
  const live = statuses.filter((s) => s !== "cancelled")
  if (live.length === 0) return "cancelled"
  // Furthest point reached wins: a completed stay outranks a fresh inquiry.
  return live
    .map((s) => (s as Stage) ?? "lead")
    .reduce((a, b) => (STAGE_RANK[a] >= STAGE_RANK[b] ? a : b), "inquiry" as Stage)
}

function nextActionFrom(stage: Stage, latest: DbBooking | null, hasWbs: boolean, now: Date): NextAction {
  switch (stage) {
    case "lead":
      return hasWbs
        ? { label: "Match a program", tone: "due" }
        : { label: "Send WBS", tone: "due" }
    case "inquiry":
      return { label: "Confirm booking", tone: "urgent" }
    case "confirmed": {
      if (latest?.pre_wbs == null) return { label: "Collect pre-WBS", tone: "urgent" }
      if (latest.arrival) {
        const d = daysBetween(now, new Date(latest.arrival))
        if (d >= 0 && d <= 7) return { label: `Arrival in ${d}d`, tone: "due" }
      }
      return { label: "Awaiting arrival", tone: "idle" }
    }
    case "active": {
      if (latest?.departure) {
        const d = daysBetween(now, new Date(latest.departure))
        if (d <= 2) return { label: "Collect post-WBS", tone: "urgent" }
        return { label: `Departs in ${d}d`, tone: "idle" }
      }
      return { label: "In stay", tone: "idle" }
    }
    case "completed":
      if (latest?.post_wbs == null) return { label: "Collect post-WBS", tone: "urgent" }
      return { label: "Follow-up / review", tone: "due" }
    case "cancelled":
      return { label: "Re-engage", tone: "idle" }
  }
}

export function buildGuestRows(input: BuildInput, now = new Date()): GuestRow[] {
  const programsById = new Map(input.programs.map((p) => [p.id, p]))
  const propsById = new Map(input.properties.map((p) => [p.id, p]))

  const programToProperties = new Map<string, string[]>()
  for (const link of input.programProperties) {
    const arr = programToProperties.get(link.program_id) ?? []
    arr.push(link.property_id)
    programToProperties.set(link.program_id, arr)
  }

  const profileById = new Map((input.profiles ?? []).map((p) => [p.id, p]))
  const propertyToPartners = new Map<string, string[]>()
  for (const link of input.partnerLinks ?? []) {
    const name = profileById.get(link.profile_id)?.full_name
    if (!name) continue
    const arr = propertyToPartners.get(link.property_id) ?? []
    arr.push(name)
    propertyToPartners.set(link.property_id, arr)
  }

  const bookingsByUser = new Map<string, DbBooking[]>()
  for (const b of input.bookings) {
    if (!b.user_id) continue
    const arr = bookingsByUser.get(b.user_id) ?? []
    arr.push(b)
    bookingsByUser.set(b.user_id, arr)
  }

  const assessmentByUser = new Map<string, DbAssessment>()
  for (const a of input.assessments ?? []) {
    if (!a.user_id) continue
    const prev = assessmentByUser.get(a.user_id)
    if (!prev || (a.completed_at ?? "") > (prev.completed_at ?? "")) assessmentByUser.set(a.user_id, a)
  }

  const dailyByUser = new Map<string, DbWbsDaily>()
  for (const d of input.wbsDaily ?? []) {
    const prev = dailyByUser.get(d.user_id)
    if (!prev || d.updated_at > prev.updated_at) dailyByUser.set(d.user_id, d)
  }

  const sessionByUser = new Map<string, DbSession>()
  for (const s of input.sessions ?? []) {
    if (!s.user_id) continue
    const prev = sessionByUser.get(s.user_id)
    if (!prev || (s.last_seen_at ?? "") > (prev.last_seen_at ?? "")) sessionByUser.set(s.user_id, s)
  }

  return input.users.map((u) => {
    const bookings = (bookingsByUser.get(u.id) ?? []).sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    )
    const latest = bookings[0] ?? null

    const programIds = new Set<string>()
    const propertyIds = new Set<string>()
    let gmvUsd = 0
    let gmvThb = 0
    for (const b of bookings) {
      if (b.program_id) {
        programIds.add(b.program_id)
        for (const pid of programToProperties.get(b.program_id) ?? []) propertyIds.add(pid)
      }
      if (b.status === "cancelled") continue
      const amount = b.amount_usd ?? b.full_price
      if (amount == null) continue
      if ((b.currency ?? "usd").toLowerCase() === "thb") gmvThb += Number(amount)
      else gmvUsd += Number(amount)
    }

    const partnerNames = new Set<string>()
    for (const pid of propertyIds) {
      for (const n of propertyToPartners.get(pid) ?? []) partnerNames.add(n)
    }

    const stage = stageFrom(bookings.map((b) => b.status ?? "inquiry"))
    const session = sessionByUser.get(u.id)
    const daily = dailyByUser.get(u.id)
    const assessment = assessmentByUser.get(u.id)

    const pre = latest?.pre_wbs ?? null
    const post = latest?.post_wbs ?? null

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      whatsapp: u.whatsapp,
      country: u.country,
      created_at: u.created_at,
      last_activity: maxDate(
        u.created_at,
        latest?.created_at,
        latest?.confirmed_at,
        latest?.started_at,
        latest?.completed_at,
        latest?.cancelled_at,
        daily?.updated_at,
        assessment?.completed_at,
        session?.last_seen_at,
      ),
      market: session?.market_country ?? u.country,
      ws_current: daily?.score ?? u.latest_score ?? post ?? u.wbs_score,
      ws_baseline: u.wbs_score ?? assessment?.score ?? null,
      goal: u.latest_focus ?? assessment?.focus ?? null,
      cohort: u.cohort,
      program_ids: Array.from(programIds),
      program_names: Array.from(programIds)
        .map((id) => programsById.get(id)?.name)
        .filter((n): n is string => !!n),
      property_ids: Array.from(propertyIds),
      property_names: Array.from(propertyIds)
        .map((id) => propsById.get(id)?.name)
        .filter((n): n is string => !!n),
      partner_names: Array.from(partnerNames),
      arrival: latest?.arrival ?? null,
      departure: latest?.departure ?? null,
      stage,
      acquisition: acquisitionFrom(u.source, session),
      distribution: distributionFrom(u.source, partnerNames.size > 0, session),
      technical: technicalFrom(u.source),
      gmv_usd: gmvUsd,
      gmv_thb: gmvThb,
      pre_wbs: pre,
      post_wbs: post,
      delta_ws: pre != null && post != null ? post - pre : null,
      next_action: nextActionFrom(stage, latest, u.wbs_score != null, now),
      booking_count: bookings.length,
      source: u.source,
    } satisfies GuestRow
  })
}

export type GuestKpis = {
  total: number
  addedLast30: number
  activeNow: number
  conversionPct: number | null
  conversionFrom: number
  conversionTo: number
  avgDelta: number | null
  deltaSample: number
  gmvUsd30: number
  gmvThb30: number
  bookings30: number
}

export function computeKpis(rows: GuestRow[], bookings: DbBooking[], now = new Date()): GuestKpis {
  const cutoff = new Date(now.getTime() - 30 * 86_400_000).toISOString()

  const deltas = rows.map((r) => r.delta_ws).filter((d): d is number => d != null)

  // Conversion: guests currently sitting at confirmed or beyond, over everyone
  // who ever entered the funnel. A guest whose every booking was cancelled
  // counts in the denominator only — the attempt happened, the revenue didn't.
  const entered = rows.filter((r) => r.stage !== "lead")
  const converted = entered.filter((r) => STAGE_RANK[r.stage] >= STAGE_RANK.confirmed && r.stage !== "cancelled")

  let gmvUsd30 = 0
  let gmvThb30 = 0
  let bookings30 = 0
  for (const b of bookings) {
    if (b.created_at < cutoff || b.status === "cancelled") continue
    bookings30 += 1
    const amount = b.amount_usd ?? b.full_price
    if (amount == null) continue
    if ((b.currency ?? "usd").toLowerCase() === "thb") gmvThb30 += Number(amount)
    else gmvUsd30 += Number(amount)
  }

  return {
    total: rows.length,
    addedLast30: rows.filter((r) => r.created_at >= cutoff).length,
    activeNow: rows.filter((r) => r.stage === "active").length,
    conversionPct: entered.length > 0 ? Math.round((converted.length / entered.length) * 100) : null,
    conversionFrom: converted.length,
    conversionTo: entered.length,
    avgDelta:
      deltas.length > 0
        ? Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10
        : null,
    deltaSample: deltas.length,
    gmvUsd30,
    gmvThb30,
    bookings30,
  }
}
