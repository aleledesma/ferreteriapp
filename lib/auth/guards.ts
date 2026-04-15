import type { UserRole } from "@prisma/client"
import { redirect } from "next/navigation"

import { auth } from "@/auth"

const NO_ACCESS_PATH = "/no-access"

type SessionUser = {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
  role: UserRole
}

export async function requireAuthenticatedUser(): Promise<SessionUser> {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
    role: session.user.role,
  }
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuthenticatedUser()

  if (!allowedRoles.includes(user.role)) {
    redirect(NO_ACCESS_PATH)
  }

  return user
}
