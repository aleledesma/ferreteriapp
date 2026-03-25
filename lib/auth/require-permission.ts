import { getSupabaseServerClient } from "@/lib/supabase/server"
import { INACTIVE_APP_ROLE, type AppRole, resolveAppRole } from "./resolve-app-role"

export { INACTIVE_APP_ROLE }

export class AuthorizationError extends Error {
  readonly permission: string
  readonly role: AppRole

  constructor(message: string, permission: string, role: AppRole) {
    super(message)
    this.name = "AuthorizationError"
    this.permission = permission
    this.role = role
  }
}

async function getRoleFromAuthContext() {
  const supabase = await getSupabaseServerClient()
  return resolveAppRole(supabase)
}

export async function getAppRole() {
  return getRoleFromAuthContext()
}

export async function requirePermission(permission: string) {
  const supabase = await getSupabaseServerClient()
  const role = await resolveAppRole(supabase)
  const { data, error } = await supabase.rpc("authorize", {
    requested_permission: permission,
  })

  if (error || data !== true) {
    throw new AuthorizationError(
      "No tienes permisos para realizar esta acción.",
      permission,
      role,
    )
  }

  return { role }
}
