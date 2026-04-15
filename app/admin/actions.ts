"use server"

import type { UserRole } from "@prisma/client"

import { requireRole } from "@/lib/auth/guards"
import { prisma } from "@/lib/prisma"

import { MANAGEABLE_ROLES } from "./constants"
import type { ManagedUser } from "./types"

export type RoleUpdateResult = {
  status: "success" | "error"
  message: string
  user?: ManagedUser
}

function isUserRole(value: string): value is UserRole {
  return MANAGEABLE_ROLES.includes(value as UserRole)
}

export async function listManagedUsersAction(): Promise<ManagedUser[]> {
  await requireRole(["ADMIN"])

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return users.map((user) => ({
    ...user,
    isActive: user.role !== "INACTIVE",
  }))
}

export async function updateUserRoleAction(formData: FormData) {
  const currentUser = await requireRole(["ADMIN"])

  const targetUserId = formData.get("targetUserId")
  const nextRole = formData.get("nextRole")

  if (typeof targetUserId !== "string" || targetUserId.length === 0) {
    return {
      status: "error",
      message: "No se recibió el usuario que quieres actualizar.",
    } satisfies RoleUpdateResult
  }

  if (typeof nextRole !== "string" || !isUserRole(nextRole)) {
    return {
      status: "error",
      message: "El rol seleccionado no es válido.",
    } satisfies RoleUpdateResult
  }

  if (currentUser.id === targetUserId && nextRole !== "ADMIN") {
    return {
      status: "error",
      message: "No puedes desactivarte ni quitarte el rol ADMIN.",
    } satisfies RoleUpdateResult
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: nextRole },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  })

  return {
    status: "success",
    message: `Rol actualizado a ${nextRole}.`,
    user: {
      ...updatedUser,
      isActive: updatedUser.role !== "INACTIVE",
    },
  } satisfies RoleUpdateResult
}
