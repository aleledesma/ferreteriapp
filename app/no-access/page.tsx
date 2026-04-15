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

export default async function NoAccessPage() {
  const user = await requireAuthenticatedUser()

  async function handleSignOut() {
    "use server"

    await signOut({ redirectTo: "/login" })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Cuenta inactiva</CardTitle>
          <CardDescription>
            Tu cuenta todavía no fue habilitada por un administrador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Iniciaste sesión como <span className="font-medium">{user.email}</span>.
          </p>
          <p className="text-muted-foreground">
            Cuando un administrador cambie tu rol a activo, podrás ingresar al sistema.
          </p>
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
