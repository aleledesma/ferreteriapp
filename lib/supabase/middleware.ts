import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { getSupabaseEnvs } from "./getSupabaseEnvs"

const PUBLIC_PATHS = new Set(["/login", "/signup", "/sign-up"])

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
    params.has("code") ||
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
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (pathname === "/sign-up") {
    return NextResponse.redirect(new URL("/signup", request.url))
  }

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    const next = `${pathname}${request.nextUrl.search}`
    if (next !== "/") {
      url.searchParams.set("next", next)
    }
    return NextResponse.redirect(url)
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    if (pathname === "/login" && isRecoveryRequest(request)) {
      return response
    }

    return NextResponse.redirect(new URL("/", request.url))
  }

  return response
}
