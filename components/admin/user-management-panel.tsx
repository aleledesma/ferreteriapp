"use client"

import { useMemo, useState, useTransition } from "react"
import { Loader2, Shield, UserCheck, UserCog, UserX } from "lucide-react"

import type { RoleUpdateResult } from "@/app/admin/actions"
import { updateUserRoleAction } from "@/app/admin/actions"
import { MANAGEABLE_ROLES } from "@/app/admin/constants"
import type { ManagedUser } from "@/app/admin/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

type UserManagementPanelProps = {
  currentUserId: string
  users: ManagedUser[]
}

type Notice = {
  tone: "success" | "error"
  message: string
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

function getRoleBadgeVariant(role: ManagedUser["role"]) {
  switch (role) {
    case "ADMIN":
      return "default"
    case "ACTIVE":
      return "secondary"
    case "INACTIVE":
      return "outline"
  }
}

export function UserManagementPanel({ currentUserId, users }: UserManagementPanelProps) {
  const [managedUsers, setManagedUsers] = useState(users)
  const [selectedRoles, setSelectedRoles] = useState<Record<string, ManagedUser["role"]>>(
    Object.fromEntries(users.map((user) => [user.id, user.role])),
  )
  const [notice, setNotice] = useState<Notice | null>(null)
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
    const formData = new FormData()
    formData.set("targetUserId", userId)
    formData.set("nextRole", nextRole)

    setPendingUserId(userId)
    setNotice(null)

    startTransition(async () => {
      try {
        const result = (await updateUserRoleAction(formData)) as RoleUpdateResult

        if (result.status === "error") {
          setNotice({ tone: "error", message: result.message })
          return
        }

        if (result.user) {
          const updatedUser = result.user
          setManagedUsers((current) =>
            current.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
          )
          setSelectedRoles((current) => ({ ...current, [updatedUser.id]: updatedUser.role }))
        }

        setNotice({ tone: "success", message: result.message })
      } catch (error) {
        console.error(error)
        setNotice({
          tone: "error",
          message: "No se pudo guardar el cambio. Inténtalo nuevamente.",
        })
      } finally {
        setPendingUserId(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <Card className="border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
          <CardHeader className="pb-2">
            <CardDescription>Total de usuarios</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <UserCog className="size-5 text-primary" />
              {summary.total}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-500/15 bg-gradient-to-br from-background via-background to-emerald-500/5 shadow-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-75">
          <CardHeader className="pb-2">
            <CardDescription>Usuarios activos</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl text-emerald-700">
              <UserCheck className="size-5" />
              {summary.active}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-amber-500/15 bg-gradient-to-br from-background via-background to-amber-500/5 shadow-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-100">
          <CardHeader className="pb-2">
            <CardDescription>Usuarios inactivos</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl text-amber-700">
              <UserX className="size-5" />
              {summary.inactive}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-sky-500/15 bg-gradient-to-br from-background via-background to-sky-500/5 shadow-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-150">
          <CardHeader className="pb-2">
            <CardDescription>Administradores</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl text-sky-700">
              <Shield className="size-5" />
              {summary.admins}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      {notice ? (
        <Alert
          variant={notice.tone === "error" ? "destructive" : "success"}
          className="animate-in fade-in-0 slide-in-from-top-2 duration-300"
        >
          <AlertDescription>{notice.message}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="overflow-hidden border-border/60 shadow-sm animate-in fade-in-0 slide-in-from-bottom-3 duration-500 delay-200">
        <CardHeader className="border-b bg-gradient-to-r from-background to-muted/40">
          <CardTitle>Gestión de usuarios</CardTitle>
          <CardDescription>
            Cambia roles de forma rápida. Los cambios se aplican al instante y requieren volver a iniciar sesión para impactar en la sesión del usuario afectado.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-4">Usuario</TableHead>
                <TableHead className="px-4 py-4">Estado</TableHead>
                <TableHead className="px-4 py-4">Rol actual</TableHead>
                <TableHead className="px-4 py-4">Nuevo rol</TableHead>
                <TableHead className="px-4 py-4 text-right">Acción</TableHead>
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
                  <TableRow key={user.id} className="transition-all duration-200 hover:bg-muted/30">
                    <TableCell className="px-4 py-4 align-top">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{user.name ?? "Sin nombre"}</p>
                        <p className="text-sm text-muted-foreground">{user.email ?? "Sin correo"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 align-top">
                      <Badge variant={user.isActive ? "secondary" : "outline"}>
                        {user.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-4 align-top">
                      <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleLabel(user.role)}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-4 align-top">
                      <Select value={selectedRole} onValueChange={(value) => handleRoleChange(user.id, value as ManagedUser["role"])}>
                        <SelectTrigger className="w-[180px] bg-background shadow-xs transition-all duration-200 hover:border-primary/50">
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
                    <TableCell className="px-4 py-4 text-right align-top">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSubmit(user.id)}
                        disabled={isSaving || isUnchanged || isBlockedSelfChange}
                        className="min-w-24 transition-all duration-200"
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
        </CardContent>
      </Card>
    </div>
  )
}
