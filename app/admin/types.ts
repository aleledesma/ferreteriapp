import type { UserRole } from "@prisma/client"

export type ManagedUser = {
  id: string
  email: string | null
  name: string | null
  role: UserRole
  isActive: boolean
  createdAt: Date
}
