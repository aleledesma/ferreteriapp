import { signOut } from "@/auth"
import { UserManagementPanel } from "@/components/admin/user-management-panel"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Card className="border-primary/10 bg-background/85 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/75 animate-in fade-in-0 slide-in-from-top-2 duration-500">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Panel de administración</CardTitle>
              <CardDescription>
                Revisa el estado de los usuarios y administra roles desde una sola vista.
              </CardDescription>
            </div>
            <CardFooter className="justify-end p-0">
              <form action={handleSignOut}>
                <Button type="submit" variant="outline">
                  Cerrar sesión
                </Button>
              </form>
            </CardFooter>
          </CardHeader>
        </Card>

        <UserManagementPanel currentUserId={currentUser.id} users={users} />
      </div>
    </main>
  )
}
