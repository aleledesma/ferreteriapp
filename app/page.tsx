import Link from "next/link"
import { redirect } from "next/navigation"

import { signOut } from "@/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireAuthenticatedUser } from "@/lib/auth/guards"

export default async function HomePage() {
  const user = await requireAuthenticatedUser()

  if (user.role === "INACTIVE") {
    redirect("/no-access")
  }

  async function handleSignOut() {
    "use server"

    await signOut({ redirectTo: "/login" })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>FerreteriApp</CardTitle>
          <CardDescription>Panel principal autenticado con Google OAuth.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Sesión iniciada como: <span className="font-medium">{user.email}</span>
          </p>
          <p className="text-muted-foreground">
            Rol actual: <span className="font-medium">{user.role}</span>
          </p>
          {user.role === "ADMIN" ? (
            <p>
              <Link href="/admin" className="text-primary underline-offset-4 hover:underline">
                Ir al panel de administración
              </Link>
            </p>
          ) : null}
        </CardContent>
        <CardFooter>
          <form action={handleSignOut}>
            <Button type="submit" variant="outline">
              Cerrar sesión
            </Button>
          </form>
        </CardFooter>
      </Card>
    </main>
  )
}
