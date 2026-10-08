import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  buildGuestRows,
  type DbAssessment,
  type DbBooking,
  type DbPartnerLink,
  type DbProfile,
  type DbProgram,
  type DbProgramProperty,
  type DbProperty,
  type DbSession,
  type DbUser,
  type DbWbsDaily,
  type GuestRow,
} from "./guest-metrics"

const USER_COLS =
  "id, name, email, whatsapp, country, wbs_score, latest_score, latest_focus, cohort, source, language, wbs_started_at, created_at"

const BOOKING_COLS =
  "id, user_id, program_id, arrival, departure, status, pre_wbs, post_wbs, amount_usd, full_price, currency, created_at, confirmed_at, started_at, completed_at, cancelled_at"

export type GuestDataset = {
  rows: GuestRow[]
  bookings: DbBooking[]
  programs: DbProgram[]
  properties: DbProperty[]
  programProperties: DbProgramProperty[]
  errorMessage: string | null
}

/**
 * One fetch shared by the guest list, the property Guests tab and the guest
 * profile. `users` is the caller's already-authorised row set — the partner
 * panel passes the `partner_guests` view, admin passes the table.
 */
export async function fetchGuestDataset(
  sb: SupabaseClient,
  users: DbUser[],
): Promise<GuestDataset> {
  const [bookingsRes, programsRes, ppRes, propsRes, asmtRes, dailyRes, sessRes, linksRes, profRes] =
    await Promise.all([
      sb.from("bookings").select(BOOKING_COLS).order("created_at", { ascending: false }),
      sb.from("programs").select("id, name, cohort, tier").order("name"),
      sb.from("program_properties").select("program_id, property_id"),
      sb.from("properties").select("id, name, slug, active").order("name"),
      sb.from("assessments").select("user_id, focus, score, completed_at"),
      sb.from("user_wbs_daily").select("user_id, score, updated_at"),
      sb
        .from("analytics_sessions")
        .select(
          "user_id, market_country, traffic_channel, utm_source, utm_medium, gclid, fbclid, last_seen_at",
        ),
      sb.from("partner_properties").select("profile_id, property_id"),
      sb.from("profiles").select("id, full_name"),
    ])

  const bookings = (bookingsRes.data ?? []) as DbBooking[]
  const programs = (programsRes.data ?? []) as DbProgram[]
  const programProperties = (ppRes.data ?? []) as DbProgramProperty[]
  const properties = (propsRes.data ?? []) as DbProperty[]

  const rows = buildGuestRows({
    users,
    bookings,
    programs,
    programProperties,
    properties,
    assessments: (asmtRes.data ?? []) as DbAssessment[],
    wbsDaily: (dailyRes.data ?? []) as DbWbsDaily[],
    sessions: (sessRes.data ?? []) as DbSession[],
    partnerLinks: (linksRes.data ?? []) as DbPartnerLink[],
    profiles: (profRes.data ?? []) as DbProfile[],
  })

  return {
    rows,
    bookings,
    programs,
    properties,
    programProperties,
    errorMessage: bookingsRes.error?.message ?? programsRes.error?.message ?? null,
  }
}

export async function fetchAdminUsers(sb: SupabaseClient): Promise<{
  users: DbUser[]
  errorMessage: string | null
}> {
  const res = await sb
    .from("users")
    .select(USER_COLS)
    .order("created_at", { ascending: false })
    .limit(500)
  return { users: (res.data ?? []) as DbUser[], errorMessage: res.error?.message ?? null }
}

/** partner_guests emits one row per property scope — collapse to one per guest. */
export async function fetchPartnerUsers(sb: SupabaseClient): Promise<{
  users: DbUser[]
  errorMessage: string | null
}> {
  const res = await sb
    .from("partner_guests")
    .select("id, name, email, whatsapp, country, cohort, wbs_score, source, created_at")

  const unique = new Map<string, DbUser>()
  for (const g of (res.data ?? []) as Array<Partial<DbUser> & { id: string; created_at: string }>) {
    if (unique.has(g.id)) continue
    unique.set(g.id, {
      id: g.id,
      name: g.name ?? null,
      email: g.email ?? null,
      whatsapp: g.whatsapp ?? null,
      country: g.country ?? null,
      wbs_score: g.wbs_score ?? null,
      latest_score: null,
      latest_focus: null,
      cohort: g.cohort ?? null,
      source: g.source ?? null,
      language: null,
      wbs_started_at: null,
      created_at: g.created_at,
    })
  }

  return { users: Array.from(unique.values()), errorMessage: res.error?.message ?? null }
}

/* ─── Guest 360 profile ────────────────────────────────────── */

export async function fetchAdminUser(
  sb: SupabaseClient,
  userId: string,
): Promise<DbUser | null> {
  const res = await sb.from("users").select(USER_COLS).eq("id", userId).maybeSingle()
  return (res.data as DbUser) ?? null
}

export type ProfileBooking = {
  id: string
  program_name: string | null
  property_names: string[]
  specialist_names: string[]
  arrival: string | null
  departure: string | null
  status: string | null
  pre_wbs: number | null
  post_wbs: number | null
  amount: number | null
  currency: string
  pax: number | null
  created_at: string
  confirmed_at: string | null
  started_at: string | null
  completed_at: string | null
  cancelled_at: string | null
}

export type ProfileAssessment = {
  id: string
  intent: string | null
  score: number | null
  focus: string | null
  confidence: number | null
  sub_body: number | null
  sub_recovery: number | null
  sub_metabolic: number | null
  sub_mind: number | null
  sub_risk: number | null
  sub_performance: number | null
  source: string | null
  moment_label: string | null
  completed_at: string | null
}

export type ProfileFlag = {
  id: string
  flag: string
  review_status: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  sla_due_at: string | null
}

export type ProfileTouch = {
  session_id: string | null
  traffic_channel: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  landing_page: string | null
  referrer: string | null
  device: string | null
  market_country: string | null
  started_at: string | null
  last_seen_at: string | null
}

export type SpecialistTouch = {
  key: string
  specialist_id: string
  name: string
  specialist_role: string | null
  booking_role: string | null
  program_name: string | null
  arrival: string | null
  departure: string | null
  status: string | null
  assigned_at: string
}

export type ProfileEvent = {
  event_id: string
  event_name: string
  occurred_at: string
  value: number | null
  currency: string | null
}

export type GuestProfile = {
  row: GuestRow
  language: string | null
  wbs_started_at: string | null
  bookings: ProfileBooking[]
  specialistTouches: SpecialistTouch[]
  assessments: ProfileAssessment[]
  daily: Array<{ day_no: number; score: number | null; updated_at: string; daily_note: string | null }>
  flags: ProfileFlag[]
  touches: ProfileTouch[]
  events: ProfileEvent[]
}

/**
 * Takes the guest row the caller already authorised rather than reading
 * `public.users` itself: the `users_read` policy grants SELECT to admins only,
 * so a partner must come in through the `partner_guests` view.
 */
type BookingSpecialistLink = {
  booking_id: string
  specialist_id: string
  role: string | null
  created_at: string
}

export async function fetchGuestProfile(
  sb: SupabaseClient,
  user: DbUser,
): Promise<GuestProfile> {
  const userId = user.id

  const dataset = await fetchGuestDataset(sb, [user])
  const row = dataset.rows[0]

  const bookingIds = dataset.bookings.filter((b) => b.user_id === userId).map((b) => b.id)

  const [rawBookingsRes, asmtRes, dailyRes, flagsRes, sessRes, evRes, bsRes, specRes] =
    await Promise.all([
      sb
        .from("bookings")
        .select(`${BOOKING_COLS}, pax`)
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      sb
        .from("assessments")
        .select(
          "id, intent, score, focus, confidence, sub_body, sub_recovery, sub_metabolic, sub_mind, sub_risk, sub_performance, source, moment_label, completed_at",
        )
        .eq("user_id", userId)
        .order("completed_at", { ascending: false }),
      sb
        .from("user_wbs_daily")
        .select("day_no, score, updated_at, daily_note")
        .eq("user_id", userId)
        .order("day_no"),
      sb
        .from("medical_flags")
        .select("id, flag, review_status, reviewed_by, reviewed_at, sla_due_at")
        .eq("user_id", userId),
      sb
        .from("analytics_sessions")
        .select(
          "session_id, traffic_channel, utm_source, utm_medium, utm_campaign, landing_page, referrer, device, market_country, started_at, last_seen_at",
        )
        .eq("user_id", userId)
        .order("started_at", { ascending: false }),
      sb
        .from("analytics_events")
        .select("event_id, event_name, occurred_at, value, currency")
        .eq("user_id", userId)
        .order("occurred_at", { ascending: false })
        .limit(50),
      bookingIds.length > 0
        ? sb
            .from("booking_specialists")
            .select("booking_id, specialist_id, role, created_at")
            .in("booking_id", bookingIds)
        : Promise.resolve({ data: [] as BookingSpecialistLink[] }),
      sb.from("specialists").select("id, name, role"),
    ])

  const programsById = new Map(dataset.programs.map((p) => [p.id, p]))
  const propsById = new Map(dataset.properties.map((p) => [p.id, p]))
  const programToProps = new Map<string, string[]>()
  for (const l of dataset.programProperties) {
    const arr = programToProps.get(l.program_id) ?? []
    arr.push(l.property_id)
    programToProps.set(l.program_id, arr)
  }

  const specById = new Map(
    ((specRes.data ?? []) as Array<{ id: string; name: string; role: string | null }>).map((s) => [
      s.id,
      s,
    ]),
  )
  const specLinks = (bsRes.data ?? []) as BookingSpecialistLink[]
  const specByBooking = new Map<string, string[]>()
  for (const link of specLinks) {
    const spec = specById.get(link.specialist_id)
    if (!spec) continue
    const arr = specByBooking.get(link.booking_id) ?? []
    arr.push(spec.name)
    specByBooking.set(link.booking_id, arr)
  }

  const bookings: ProfileBooking[] = (
    (rawBookingsRes.data ?? []) as Array<DbBooking & { pax: number | null }>
  ).map((b) => ({
    id: b.id,
    program_name: b.program_id ? (programsById.get(b.program_id)?.name ?? null) : null,
    property_names: (b.program_id ? (programToProps.get(b.program_id) ?? []) : [])
      .map((pid) => propsById.get(pid)?.name)
      .filter((n): n is string => !!n),
    specialist_names: specByBooking.get(b.id) ?? [],
    arrival: b.arrival,
    departure: b.departure,
    status: b.status,
    pre_wbs: b.pre_wbs,
    post_wbs: b.post_wbs,
    amount: b.amount_usd ?? b.full_price,
    currency: (b.currency ?? "usd").toLowerCase(),
    pax: b.pax,
    created_at: b.created_at,
    confirmed_at: b.confirmed_at,
    started_at: b.started_at,
    completed_at: b.completed_at,
    cancelled_at: b.cancelled_at,
  }))

  const bookingById = new Map(bookings.map((b) => [b.id, b]))
  const specialistTouches: SpecialistTouch[] = specLinks
    .flatMap((link) => {
      const spec = specById.get(link.specialist_id)
      const b = bookingById.get(link.booking_id)
      if (!spec || !b) return []
      return [
        {
          key: `${link.booking_id}-${link.specialist_id}`,
          specialist_id: link.specialist_id,
          name: spec.name,
          specialist_role: spec.role,
          booking_role: link.role,
          program_name: b.program_name,
          arrival: b.arrival,
          departure: b.departure,
          status: b.status,
          assigned_at: link.created_at,
        },
      ]
    })
    .sort((a, b) => b.assigned_at.localeCompare(a.assigned_at))

  return {
    row,
    language: user.language,
    wbs_started_at: user.wbs_started_at,
    bookings,
    specialistTouches,
    assessments: (asmtRes.data ?? []) as ProfileAssessment[],
    daily: (dailyRes.data ?? []) as GuestProfile["daily"],
    flags: (flagsRes.data ?? []) as ProfileFlag[],
    touches: (sessRes.data ?? []) as ProfileTouch[],
    events: (evRes.data ?? []) as ProfileEvent[],
  }
}
