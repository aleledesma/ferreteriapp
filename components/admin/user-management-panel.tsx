"use client"

import { useMemo, useState, useTransition } from "react"
import { Loader2, Shield, UserCheck, UserCog, UserX } from "lucide-react"
import { toast } from "sonner"

import type { RoleUpdateResult } from "@/app/admin/actions"
import { updateUserRoleAction } from "@/app/admin/actions"
import { MANAGEABLE_ROLES } from "@/app/admin/constants"
import type { ManagedUser } from "@/app/admin/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type UserManagementPanelProps = {
  currentUserId: string
  users: ManagedUser[]
}

function getRoleLabel(role: ManagedUser["role"]) {
  switch (role) {
    case "ADMIN":
      return "Administrador"
    case "ACTIVE":
      return "Activo"
    case "INACTIVE":
      return "Inactivo"
  }
}

function getRoleBadgeClasses(role: ManagedUser["role"]) {
  switch (role) {
    case "ADMIN":
      return "border-primary/25 bg-primary/8 text-primary"
    case "ACTIVE":
      return "border-emerald-500/25 bg-emerald-500/8 text-emerald-700"
    case "INACTIVE":
      return "border-border/60 text-muted-foreground/70"
  }
}

const KPI_ITEMS = [
  {
    key: "total" as const,
    label: "Total",
    icon: UserCog,
    borderClass: "border-l-foreground/30",
    numberClass: "text-foreground",
  },
  {
    key: "active" as const,
    label: "Activos",
    icon: UserCheck,
    borderClass: "border-l-emerald-500",
    numberClass: "text-emerald-700",
  },
  {
    key: "inactive" as const,
    label: "Inactivos",
    icon: UserX,
    borderClass: "border-l-amber-500",
    numberClass: "text-amber-700",
  },
  {
    key: "admins" as const,
    label: "Administradores",
    icon: Shield,
    borderClass: "border-l-sky-500",
    numberClass: "text-sky-700",
  },
]

export function UserManagementPanel({ currentUserId, users }: UserManagementPanelProps) {
  const [managedUsers, setManagedUsers] = useState(users)
  const [selectedRoles, setSelectedRoles] = useState<Record<string, ManagedUser["role"]>>(
    Object.fromEntries(users.map((user) => [user.id, user.role])),
  )
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const summary = useMemo(() => {
    const total = managedUsers.length
    const active = managedUsers.filter((user) => user.role === "ACTIVE").length
    const inactive = managedUsers.filter((user) => user.role === "INACTIVE").length
    const admins = managedUsers.filter((user) => user.role === "ADMIN").length

    return { total, active, inactive, admins }
  }, [managedUsers])

  function handleRoleChange(userId: string, nextRole: ManagedUser["role"]) {
    setSelectedRoles((current) => ({ ...current, [userId]: nextRole }))
  }

  function handleSubmit(userId: string) {
    const nextRole = selectedRoles[userId]
    const targetUser = managedUsers.find((user) => user.id === userId)
    const formData = new FormData()
    formData.set("targetUserId", userId)
    formData.set("nextRole", nextRole)

    setPendingUserId(userId)
    const toastId = toast.loading(
      `Actualizando rol de ${targetUser?.name ?? targetUser?.email ?? "usuario"}...`,
    )

    startTransition(async () => {
      try {
        const result = (await updateUserRoleAction(formData)) as RoleUpdateResult

        if (result.status === "error") {
          toast.error("No se pudo actualizar el rol", {
            id: toastId,
            description: result.message,
          })
          return
        }

        if (result.user) {
          const updatedUser = result.user
          setManagedUsers((current) =>
            current.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
          )
          setSelectedRoles((current) => ({ ...current, [updatedUser.id]: updatedUser.role }))
        }

        toast.success("Rol actualizado", {
          id: toastId,
          description: result.message,
        })
      } catch (error) {
        console.error(error)
        toast.error("No se pudo guardar el cambio", {
          id: toastId,
          description: "Inténtalo nuevamente.",
        })
      } finally {
        setPendingUserId(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_ITEMS.map((item, index) => {
          const Icon = item.icon

          return (
            <div
              key={item.key}
              className={cn(
                "rounded-xl border border-border/60 border-l-[3px] bg-background/90 px-5 py-4 shadow-sm",
                "animate-in fade-in-0 slide-in-from-bottom-1 duration-500",
                item.borderClass,
              )}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Icon className="size-3.5 shrink-0" />
                {item.label}
              </div>
              <p
                className={cn(
                  "mt-2 text-[2rem] font-bold tabular-nums leading-none tracking-tight",
                  item.numberClass,
                )}
              >
                {summary[item.key]}
              </p>
            </div>
          )
        })}
      </section>

      {/* User table */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background/85 shadow-sm animate-in fade-in-0 slide-in-from-bottom-3 duration-500 delay-200">
        <div className="border-b border-border/60 px-5 py-4">
          <p className="text-sm font-semibold text-foreground">Gestión de usuarios</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Los cambios se aplican al instante y requieren volver a iniciar sesión para impactar la sesión del usuario afectado.
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/60 bg-muted/20 hover:bg-muted/20">
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Usuario
              </TableHead>
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Estado
              </TableHead>
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Rol actual
              </TableHead>
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Nuevo rol
              </TableHead>
              <TableHead className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Acción
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {managedUsers.map((user) => {
              const selectedRole = selectedRoles[user.id]
              const isCurrentUser = currentUserId === user.id
              const isSaving = pendingUserId === user.id && isPending
              const isUnchanged = selectedRole === user.role
              const isBlockedSelfChange = isCurrentUser && selectedRole !== "ADMIN"

              return (
                <TableRow
                  key={user.id}
                  className="transition-colors hover:bg-muted/25"
                >
                  <TableCell className="px-4 py-4 align-middle">
                    <div className="space-y-0.5">
                      <p className="font-medium text-foreground">{user.name ?? "Sin nombre"}</p>
                      <p className="text-sm text-muted-foreground">{user.email ?? "Sin correo"}</p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 align-middle">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-block size-1.5 rounded-full",
                          user.isActive ? "bg-emerald-500" : "bg-muted-foreground/40",
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm",
                          user.isActive ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {user.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 align-middle">
                    <Badge
                      variant="outline"
                      className={cn("text-[11px] font-medium", getRoleBadgeClasses(user.role))}
                    >
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 align-middle">
                    <Select
                      value={selectedRole}
                      onValueChange={(value) =>
                        handleRoleChange(user.id, value as ManagedUser["role"])
                      }
                    >
                      <SelectTrigger className="w-[180px] bg-background">
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {MANAGEABLE_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {getRoleLabel(role)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-right align-middle">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSubmit(user.id)}
                      disabled={isSaving || isUnchanged || isBlockedSelfChange}
                      className="min-w-24"
                    >
                      {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                      {isSaving ? "Guardando" : "Guardar"}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
