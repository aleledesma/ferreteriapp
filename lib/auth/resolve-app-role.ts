import type { SupabaseClient } from "@supabase/supabase-js"

export const INACTIVE_APP_ROLE = "INACTIVE"

const PLATFORM_JWT_ROLES = new Set([
  "ANON",
  "AUTHENTICATED",
  "SERVICE_ROLE",
  "SUPABASE_ADMIN",
])

export type AppRole = string

type JsonRecord = Record<string, unknown>

function asRecord(value: unknown): JsonRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null
  }

  return value as JsonRecord
}

function normalizeRoleValue(role: unknown): AppRole | null {
  if (typeof role !== "string") {
    return null
  }

  const normalized = role.trim().toUpperCase()
  if (normalized.length === 0) {
    return null
  }

  if (PLATFORM_JWT_ROLES.has(normalized)) {
    return null
  }

  return normalized
}

function getNestedClaimValue(claims: JsonRecord, path: string[]) {
  let current: unknown = claims

  for (const key of path) {
    const currentRecord = asRecord(current)
    if (!currentRecord) {
      return undefined
    }

    current = currentRecord[key]
  }

  return current
}

function extractRoleFromClaims(claims: unknown): AppRole | null {
  const claimRecord = asRecord(claims)
  if (!claimRecord) {
    return null
  }

  const claimPaths = [
    ["app_role"],
    ["user_role"],
    ["app_metadata", "app_role"],
    ["app_metadata", "user_role"],
    ["app_metadata", "role"],
    ["role"],
  ]

  for (const claimPath of claimPaths) {
    const role = normalizeRoleValue(getNestedClaimValue(claimRecord, claimPath))
    if (role) {
      return role
    }
  }

  return null
}

async function getRoleFromClaims(
  supabase: SupabaseClient,
): Promise<AppRole | null> {
  const { data, error } = await supabase.auth.getClaims()
  if (error) {
    return null
  }

  return extractRoleFromClaims(data?.claims)
}

async function getRoleFromDatabase(
  supabase: SupabaseClient,
): Promise<AppRole | null> {
  const { data, error } = await supabase.rpc("get_my_app_role")

  if (error) {
    return null
  }

  return normalizeRoleValue(data)
}

export async function resolveAppRole(
  supabase: SupabaseClient,
): Promise<AppRole> {
  const [claimsRole, databaseRole] = await Promise.all([
    getRoleFromClaims(supabase),
    getRoleFromDatabase(supabase),
  ])

  if (databaseRole) {
    return databaseRole
  }

  if (claimsRole) {
    return claimsRole
  }

  return INACTIVE_APP_ROLE
}
