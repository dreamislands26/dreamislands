import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/start",
  "/matched",
  "/programs",
  "/properties",
  "/reviews",
  "/tanya-samui",
  "/about",
  "/partners",
  "/for-properties",
  "/guides",
  "/tracks",
  "/auth/callback",
  "/profile",
  "/api/profile",
  "/api/intake",
  "/api/auth",
  "/api/programs",
  "/api/properties",
  "/api/bookings/public",
  "/api/webhooks",
  "/api/for-properties-lead",
  "/wellness-baseline-score",
  "/how-wbs-works",
  "/destinations",
  "/medical",
  "/sitemap.xml",
  "/saved",
]

const PANEL_HOSTS = new Set(["panel.dreamislands.org"])
const PUBLIC_HOSTS = new Set(["dreamislands.org", "www.dreamislands.org"])

const PUBLIC_HOST_ALLOWED = [
  "/",
  "/start",
  "/profile",
  "/api/profile",
  "/api/auth",
  "/matched",
  "/programs",
  "/properties",
  "/reviews",
  "/tanya-samui",
  "/about",
  "/partners",
  "/for-properties",
  "/guides",
  "/tracks",
  "/api/intake",
  "/api/programs",
  "/api/properties",
  "/api/bookings/public",
  "/api/webhooks",
  "/api/for-properties-lead",
  "/wellness-baseline-score",
  "/how-wbs-works",
  "/destinations",
  "/medical",
  "/sitemap.xml",
  "/saved",
]

const PANEL_HOST_ALLOWED = [
  "/",
  "/login",
  "/auth",
  "/partner",
  "/admin",
  "/api/auth",
  "/api/programs",
  "/api/properties",
  "/api/me",
  "/api/admin",
  "/api/users",
  "/api/specialists",
  "/api/bookings",
  "/api/programs",
  "/api/properties",
  "/api/services",
  "/api/accommodations",
  "/api/property-requests",
  "/api/upload",
  "/api/intake",
]

function pathMatches(pathname: string, allowed: string[]) {
  return allowed.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

function normalizeHost(hostHeader: string | null): string {
  if (!hostHeader) return ""
  return hostHeader.toLowerCase().split(":")[0]
}

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

// Internal preview over a tunnel. Off unless PREVIEW_PASSWORD is set: then every request needs the
// password (HTTP Basic), and nothing may write, since this server talks to the production database.
const PREVIEW_PASSWORD = process.env.PREVIEW_PASSWORD
const PREVIEW_USER = process.env.PREVIEW_USER || "dit"
const PREVIEW_READ_APIS = [/^\/api\/profile\/session$/, /^\/api\/programs\/[^/]+\/pricing$/]

function previewGuard(request: NextRequest): NextResponse | null {
  if (!PREVIEW_PASSWORD) return null
  const [scheme, encoded] = (request.headers.get("authorization") ?? "").split(" ")
  let given = ""
  try { given = scheme === "Basic" && encoded ? atob(encoded) : "" } catch {}
  if (given !== `${PREVIEW_USER}:${PREVIEW_PASSWORD}`) {
    return new NextResponse("Authentication required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="DIT preview", charset="UTF-8"' } })
  }
  const { pathname, searchParams } = request.nextUrl
  const readOnly = NextResponse.json({ error: "Read-only preview" }, { status: 503 })
  if (request.method !== "GET" && request.method !== "HEAD") return readOnly
  if (pathname.startsWith("/api/") && !PREVIEW_READ_APIS.some((r) => r.test(pathname))) return readOnly
  if (searchParams.has("session_id")) return readOnly // Stripe return links confirm payments
  return null
}

export async function proxy(request: NextRequest) {
  const blocked = previewGuard(request)
  if (blocked) return blocked
  const host = normalizeHost(request.headers.get("host"))
  const { pathname } = request.nextUrl

  if (PUBLIC_HOSTS.has(host) && !pathMatches(pathname, PUBLIC_HOST_ALLOWED)) {
    return new NextResponse("Not found", { status: 404 })
  }
  if (PANEL_HOSTS.has(host) && !pathMatches(pathname, PANEL_HOST_ALLOWED)) {
    return new NextResponse("Not found", { status: 404 })
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (isPublic(pathname)) {
    if (user && pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return response
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|llms.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)$).*)"],
}
