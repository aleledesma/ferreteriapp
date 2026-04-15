import type { UserRole } from "@prisma/client"

export const MANAGEABLE_ROLES: UserRole[] = ["INACTIVE", "ACTIVE", "ADMIN"]
