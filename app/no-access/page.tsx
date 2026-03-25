import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function NoAccessPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  async function handleSignOut() {
    "use server"

    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut()
    redirect("/login")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Cuenta inactiva</CardTitle>
          <CardDescription>
            Tu cuenta está pendiente de habilitación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Iniciaste sesión como <span className="font-medium">{user.email}</span>.
          </p>
          <p className="text-muted-foreground">
            Tu cuenta está inactiva. Contactá al administrador para obtener acceso.
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
