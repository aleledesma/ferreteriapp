import { createBrowserClient } from "@supabase/ssr"
import { getSupabaseEnvs } from "./getSupabaseEnvs"

export function createSupabaseBrowserClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnvs()
  return createBrowserClient(supabaseUrl, supabasePublishableKey)
}
