import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"

// Remembers which guest row this browser just created by taking the WS
// assessment, so signing in afterwards (even with a new email) can claim it.
// Signed so a guest id from a /matched/<id> URL can't be replayed to claim
// someone else's results.

export const QUIZ_COOKIE = "dit_quiz"
export const QUIZ_COOKIE_MAX_AGE = 7 * 24 * 60 * 60

function key(): Buffer {
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-only-secret"
  return createHmac("sha256", "dit-quiz-cookie").update(base).digest()
}

function sign(payload: string): string {
  return createHmac("sha256", key()).update(payload).digest("base64url")
}

export function quizCookieValue(guestId: string): string {
  return `${guestId}.${sign(guestId)}`
}

export function readQuizCookie(value: string | undefined | null): string | null {
  if (!value) return null
  const dot = value.lastIndexOf(".")
  if (dot <= 0) return null
  const id = value.slice(0, dot)
  const presented = Buffer.from(value.slice(dot + 1))
  const expected = Buffer.from(sign(id))
  if (presented.length !== expected.length || !timingSafeEqual(presented, expected)) return null
  return /^[0-9a-f-]{36}$/i.test(id) ? id : null
}

export const quizCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: QUIZ_COOKIE_MAX_AGE,
}
