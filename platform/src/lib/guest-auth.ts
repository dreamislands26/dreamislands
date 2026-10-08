import "server-only"
import { supabaseAdmin } from "./supabase-server"
import { sendEmail } from "./email"
import { guestLoginCode } from "./email-templates"

// Guest sign-in on the public site: one-time code by email (Resend), entered
// in the same modal — the guest never leaves the page.

export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  const email = raw.trim().toLowerCase()
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

function ilikeExact(email: string): string {
  return email.replace(/[\\%_]/g, (c) => `\\${c}`)
}

async function ensureAuthUser(email: string): Promise<void> {
  const { error } = await supabaseAdmin.auth.admin.createUser({ email, email_confirm: true })
  if (error && error.code !== "email_exists" && !/already/i.test(error.message)) {
    // Not fatal: generateLink below still works for an existing auth user.
    console.warn("[guest-auth] createUser:", error.message)
  }
}

/** Emails a one-time sign-in code. Anyone may sign in; guests without an assessment get an empty profile. */
export async function sendGuestCode(email: string): Promise<boolean> {
  await ensureAuthUser(email)
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email })
  const code = data?.properties?.email_otp
  if (error || !code) {
    console.error("[guest-auth] generateLink failed:", error?.message)
    return false
  }
  if (process.env.NODE_ENV !== "production") console.info(`[guest-auth] code for ${email}: ${code}`)

  const { data: guest } = await supabaseAdmin
    .from("users")
    .select("name")
    .ilike("email", ilikeExact(email))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  await sendEmail({ to: email, ...guestLoginCode({ guestName: guest?.name ?? null, code }), tag: "guest_login_code" })
  return true
}

/**
 * After a successful code check: tie this person's guest rows to the account.
 * - The quiz this browser just took (signed cookie) is claimed when it has no
 *   email yet or the same email — it gets the login email so it joins the trend.
 * - If nothing is linked to the account yet, the newest row with this email is.
 * Every row sharing the email then reads as one person (see guestRowIds).
 */
export async function claimGuestRows(authUserId: string, email: string, quizGuestId: string | null): Promise<void> {
  if (quizGuestId) {
    const { data: quiz } = await supabaseAdmin
      .from("users")
      .select("id, email, auth_user_id")
      .eq("id", quizGuestId)
      .maybeSingle()
    const sameOrNoEmail = quiz && (!quiz.email || quiz.email.trim().toLowerCase() === email)
    if (quiz && sameOrNoEmail && (!quiz.auth_user_id || quiz.auth_user_id === authUserId)) {
      if (!quiz.email) await supabaseAdmin.from("users").update({ email }).eq("id", quiz.id)
    }
  }

  const { data: linked } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle()
  if (linked) return

  const { data: newest } = await supabaseAdmin
    .from("users")
    .select("id")
    .ilike("email", ilikeExact(email))
    .is("auth_user_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!newest) return
  const { error } = await supabaseAdmin.from("users").update({ auth_user_id: authUserId }).eq("id", newest.id)
  if (error) console.error("[guest-auth] link failed:", error.message)
}

/** All guest rows that belong to this person: the linked one plus every row with their email. */
export async function guestRowIds(authUserId: string, email: string): Promise<{ primary: string | null; all: string[] }> {
  const [{ data: linked }, { data: byEmail }] = await Promise.all([
    supabaseAdmin.from("users").select("id").eq("auth_user_id", authUserId).maybeSingle(),
    supabaseAdmin
      .from("users")
      .select("id, auth_user_id, created_at")
      .ilike("email", ilikeExact(email))
      .order("created_at", { ascending: false }),
  ])
  // Rows with this email that belong to a different account stay out.
  const mine = (byEmail ?? []).filter((r) => !r.auth_user_id || r.auth_user_id === authUserId).map((r) => r.id as string)
  const all = Array.from(new Set([...(linked ? [linked.id as string] : []), ...mine]))
  return { primary: (linked?.id as string | undefined) ?? all[0] ?? null, all }
}
