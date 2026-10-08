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

export async function proxy(request: NextRequest) {
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|llms.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
