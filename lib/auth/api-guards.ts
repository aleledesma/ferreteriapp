import type { UserRole } from "@prisma/client"

import { auth } from "@/auth"

export type ApiSessionUser = {
  id: string
  email?: string | null
  name?: string | null
  role: UserRole
}

export async function getAuthorizedApiUser(allowedRoles: UserRole[]) {
  const session = await auth()

  if (!session?.user) {
    return { error: "UNAUTHENTICATED" as const }
  }

  if (!allowedRoles.includes(session.user.role)) {
    return { error: "FORBIDDEN" as const }
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    } satisfies ApiSessionUser,
  }
}
