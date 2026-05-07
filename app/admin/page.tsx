import { signOut } from "@/auth"
import { UserManagementPanel } from "@/components/admin/user-management-panel"
import { Button } from "@/components/ui/button"
import { requireRole } from "@/lib/auth/guards"

import { listManagedUsersAction } from "./actions"

export default async function AdminPage() {
  const currentUser = await requireRole(["ADMIN"])
  const users = await listManagedUsersAction()

  async function handleSignOut() {
    "use server"

    await signOut({ redirectTo: "/login" })
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-primary)/10,_transparent_35%),linear-gradient(180deg,var(--color-background),color-mix(in_oklab,var(--color-muted)_45%,transparent))] p-4 md:p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-500 flex items-start justify-between gap-4">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Administración
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Panel de administración
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Revisa el estado de los usuarios y administra roles desde una sola vista.
            </p>
          </div>
          <form action={handleSignOut} className="shrink-0 pt-1">
            <Button type="submit" variant="outline" size="sm">
              Cerrar sesión
            </Button>
          </form>
        </div>

        <UserManagementPanel currentUserId={currentUser.id} users={users} />
      </div>
    </main>
  )
}
