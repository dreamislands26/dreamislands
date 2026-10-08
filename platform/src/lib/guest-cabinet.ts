import "server-only"
import { supabaseAdmin } from "./supabase-server"

// Guest profile data. Reads with the service client, pinned to the guest rows
// that belong to the signed-in person (assessments RLS keys on auth.uid(),
// which is not the guest row id, so the RLS client can't read them).

export type WsPoint = { date: string; score: number; source: "assessment" | "pre" | "daily" | "post" }

export type CabinetJourney = {
  booking_id: string
  program_name: string
  location: string | null
  property_name: string | null
  duration_days: number | null
  arrival: string | null
  departure: string | null
  status: string
  status_label: string
  goals: string[]
}

export type CabinetProfile = {
  id: string | null
  name: string | null
  email: string | null
  whatsapp: string | null
  country: string | null
  member_since: string | null
}

export type CabinetReport = {
  date: string | null
  score: number | null
  focus: string | null
  dimensions: Array<{ label: string; value: number }>
  /** Same five from the first assessment, when there is an earlier one to compare with. */
  baseline_dimensions: Array<{ label: string; value: number }> | null
}

export type GuestCabinet = {
  profile: CabinetProfile
  points: WsPoint[]
  baseline: number | null
  current: number | null
  baselineDate: string | null
  assessments: number
  report: CabinetReport | null
  current_journey: CabinetJourney | null
  journeys: CabinetJourney[]
}

const STATUS_LABEL: Record<string, string> = {
  inquiry: "Request received",
  confirmed: "Confirmed",
  active: "In progress",
  completed: "Tour finished",
  cancelled: "Cancelled",
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function capitalize(s: string): string {
  const t = s.trim()
  return t ? t[0].toUpperCase() + t.slice(1) : t
}

/** Same five bars the assessment result screen shows (Safety = 100 − risk). */
export function reportDimensions(a: {
  sub_body: number | null
  sub_recovery: number | null
  sub_metabolic: number | null
  sub_mind: number | null
  sub_risk: number | null
}): Array<{ label: string; value: number }> {
  return [
    { label: "Body", value: a.sub_body },
    { label: "Recovery", value: a.sub_recovery },
    { label: "Metabolic", value: a.sub_metabolic },
    { label: "Mind", value: a.sub_mind },
    { label: "Safety", value: a.sub_risk == null ? null : Math.round(100 - a.sub_risk) },
  ].filter((d): d is { label: string; value: number } => d.value != null)
}

/** active → nearest upcoming → latest finished → latest anything not cancelled. */
function pickCurrent(journeys: CabinetJourney[]): CabinetJourney | null {
  const today = new Date().toISOString().slice(0, 10)
  const live = journeys.filter((j) => j.status !== "cancelled")
  const active = live.find((j) => j.status === "active")
  if (active) return active
  const upcoming = live
    .filter((j) => (j.status === "confirmed" || j.status === "inquiry") && (j.arrival ?? "") >= today)
    .sort((a, b) => (a.arrival ?? "").localeCompare(b.arrival ?? ""))[0]
  if (upcoming) return upcoming
  const finished = live
    .filter((j) => j.status === "completed")
    .sort((a, b) => (b.arrival ?? "").localeCompare(a.arrival ?? ""))[0]
  return finished ?? live[0] ?? null
}

const EMPTY_PROFILE: CabinetProfile = {
  id: null,
  name: null,
  email: null,
  whatsapp: null,
  country: null,
  member_since: null,
}

/** `guestIds` = every guest row of this person; `primaryId` supplies the contact details. */
export async function fetchGuestCabinet(primaryId: string | null, guestIds: string[]): Promise<GuestCabinet> {
  if (guestIds.length === 0) {
    return {
      profile: EMPTY_PROFILE,
      points: [],
      baseline: null,
      current: null,
      baselineDate: null,
      assessments: 0,
      report: null,
      current_journey: null,
      journeys: [],
    }
  }

  const [usersRes, asmtRes, bookingRes, dailyRes] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("id, name, email, whatsapp, country, wbs_score, wbs_started_at, created_at")
      .in("id", guestIds),
    supabaseAdmin
      .from("assessments")
      .select("score, focus, completed_at, sub_body, sub_recovery, sub_metabolic, sub_mind, sub_risk")
      .in("user_id", guestIds)
      .order("completed_at", { ascending: true }),
    supabaseAdmin
      .from("bookings")
      .select("id, program_id, arrival, departure, status, pre_wbs, post_wbs, duration_days")
      .in("user_id", guestIds)
      .order("arrival", { ascending: false }),
    supabaseAdmin.from("user_wbs_daily").select("user_id, day_no, score").in("user_id", guestIds),
  ])

  const users = (usersRes.data ?? []) as Array<{
    id: string
    name: string | null
    email: string | null
    whatsapp: string | null
    country: string | null
    wbs_score: number | null
    wbs_started_at: string | null
    created_at: string
  }>
  const byId = new Map(users.map((u) => [u.id, u]))
  const primary = (primaryId && byId.get(primaryId)) || users[0]
  // Fill gaps in the primary row from the person's other rows (newest first).
  const newestFirst = [...users].sort((a, b) => b.created_at.localeCompare(a.created_at))
  const pick = <K extends "name" | "email" | "whatsapp" | "country">(k: K) =>
    primary?.[k] ?? newestFirst.find((u) => u[k])?.[k] ?? null
  const oldest = users.reduce<string | null>((m, u) => (!m || u.created_at < m ? u.created_at : m), null)

  const bookings = (bookingRes.data ?? []) as Array<{
    id: string
    program_id: string | null
    arrival: string | null
    departure: string | null
    status: string
    pre_wbs: number | null
    post_wbs: number | null
    duration_days: number | null
  }>

  const programIds = Array.from(new Set(bookings.map((b) => b.program_id).filter((x): x is string => !!x)))
  const [progRes, ppRes] = programIds.length
    ? await Promise.all([
        supabaseAdmin.from("programs").select("id, name, duration_days, outcomes").in("id", programIds),
        supabaseAdmin
          .from("program_properties")
          .select("program_id, role, properties(name, island, country)")
          .in("program_id", programIds),
      ])
    : [{ data: [] }, { data: [] }]

  const programs = new Map(
    ((progRes.data ?? []) as Array<{ id: string; name: string; duration_days: number | null; outcomes: string[] | null }>).map(
      (p) => [p.id, p],
    ),
  )
  const propertyByProgram = new Map<string, { name: string; island: string | null; country: string | null }>()
  for (const row of (ppRes.data ?? []) as unknown as Array<{
    program_id: string
    role: string | null
    properties: { name: string; island: string | null; country: string | null } | null
  }>) {
    if (!row.properties) continue
    if (!propertyByProgram.has(row.program_id) || row.role === "primary") {
      propertyByProgram.set(row.program_id, row.properties)
    }
  }

  const journeys: CabinetJourney[] = bookings.map((b) => {
    const p = b.program_id ? programs.get(b.program_id) : undefined
    const prop = b.program_id ? propertyByProgram.get(b.program_id) : undefined
    const location = prop ? [prop.island, prop.country].filter(Boolean).join(", ") || null : null
    return {
      booking_id: b.id,
      program_name: p?.name ?? "Program to be confirmed",
      location,
      property_name: prop?.name ?? null,
      duration_days: b.duration_days ?? p?.duration_days ?? null,
      arrival: b.arrival,
      departure: b.departure,
      status: b.status,
      status_label: STATUS_LABEL[b.status] ?? capitalize(b.status),
      goals: (p?.outcomes ?? []).map(capitalize).filter(Boolean),
    }
  })

  // WS trend: every score we hold for this person, in date order.
  const points: WsPoint[] = []
  const asmts = (asmtRes.data ?? []) as Array<{
    score: number | null
    focus: string | null
    completed_at: string | null
    sub_body: number | null
    sub_recovery: number | null
    sub_metabolic: number | null
    sub_mind: number | null
    sub_risk: number | null
  }>
  for (const a of asmts) {
    if (a.score != null && a.completed_at) points.push({ date: a.completed_at.slice(0, 10), score: a.score, source: "assessment" })
  }
  // Legacy rows that only carry users.wbs_score (no assessments row).
  for (const u of users) {
    if (u.wbs_score != null && !asmts.length) {
      points.push({ date: u.created_at.slice(0, 10), score: u.wbs_score, source: "assessment" })
    }
  }
  for (const b of bookings) {
    if (b.pre_wbs != null && b.arrival) points.push({ date: b.arrival, score: b.pre_wbs, source: "pre" })
    if (b.post_wbs != null && (b.departure ?? b.arrival)) {
      points.push({ date: (b.departure ?? b.arrival)!, score: b.post_wbs, source: "post" })
    }
  }
  for (const d of (dailyRes.data ?? []) as Array<{ user_id: string; day_no: number; score: number | null }>) {
    const start = byId.get(d.user_id)?.wbs_started_at
    if (start && d.score != null) points.push({ date: addDays(start, d.day_no - 1), score: d.score, source: "daily" })
  }
  const order: Record<WsPoint["source"], number> = { assessment: 0, pre: 1, daily: 2, post: 3 }
  points.sort((a, b) => a.date.localeCompare(b.date) || order[a.source] - order[b.source])

  const latest = asmts.at(-1)
  const first = asmts.length > 1 ? asmts[0] : null
  const report: CabinetReport | null = latest
    ? {
        date: latest.completed_at?.slice(0, 10) ?? null,
        score: latest.score,
        focus: latest.focus,
        dimensions: reportDimensions(latest),
        baseline_dimensions: first ? reportDimensions(first) : null,
      }
    : null

  return {
    profile: {
      id: primary?.id ?? null,
      name: pick("name"),
      email: pick("email"),
      whatsapp: pick("whatsapp"),
      country: pick("country"),
      member_since: oldest?.slice(0, 10) ?? null,
    },
    points,
    baseline: points[0]?.score ?? null,
    baselineDate: points[0]?.date ?? null,
    current: points.at(-1)?.score ?? null,
    assessments: asmts.length || users.filter((u) => u.wbs_score != null).length,
    report,
    current_journey: pickCurrent(journeys),
    journeys,
  }
}
