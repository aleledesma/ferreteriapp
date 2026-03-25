import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { INACTIVE_APP_ROLE, resolveAppRole } from "@/lib/auth/resolve-app-role"
import { getSupabaseEnvs } from "./getSupabaseEnvs"

const PUBLIC_PATHS = new Set(["/login", "/signup"])
const INACTIVE_ROLE = INACTIVE_APP_ROLE
const NO_ACCESS_PATH = "/no-access"

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname)
}

function isRecoveryRequest(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (pathname !== "/login") {
    return false
  }

  const params = request.nextUrl.searchParams
  return (
    params.get("recovery") === "1" ||
    params.get("type") === "recovery" ||
    params.has("token_hash")
  )
}

export async function updateSession(request: NextRequest) {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnvs()

  let response = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        )
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const appRole = user ? await resolveAppRole(supabase) : INACTIVE_ROLE

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    const next = `${pathname}${request.nextUrl.search}`
    if (next !== "/") {
      url.searchParams.set("next", next)
    }
    return NextResponse.redirect(url)
  }

  if (user) {
    const isInactive = appRole === INACTIVE_ROLE

    if (isInactive && pathname === "/") {
      return NextResponse.redirect(new URL(NO_ACCESS_PATH, request.url))
    }

    if (isInactive && !isPublicPath(pathname) && pathname !== NO_ACCESS_PATH) {
      return NextResponse.redirect(new URL(NO_ACCESS_PATH, request.url))
    }

    if (!isInactive && pathname === NO_ACCESS_PATH) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    if (pathname === "/login" && isRecoveryRequest(request)) {
      return response
    }

    const destination = appRole === INACTIVE_ROLE ? NO_ACCESS_PATH : "/"
    return NextResponse.redirect(new URL(destination, request.url))
  }

  return response
}
