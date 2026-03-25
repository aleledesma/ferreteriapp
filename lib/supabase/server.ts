import { createServerClient } from "@supabase/ssr"
import { cache } from "react"
import { cookies } from "next/headers"

import { getSupabaseEnvs } from "./getSupabaseEnvs"

const buildSupabaseServerClient = cache(async () => {
  const cookieStore = await cookies()
  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnvs()

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch (error) {
          console.log(error)
        }
      },
    },
  })
})

export async function getSupabaseServerClient() {
  return buildSupabaseServerClient()
}

export const createSupabaseServerClient = getSupabaseServerClient
