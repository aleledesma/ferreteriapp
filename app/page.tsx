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

export default async function HomePage() {
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
          <CardTitle>FerreteriApp</CardTitle>
          <CardDescription>Área privada del panel (protegida con Supabase Auth).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Sesión iniciada como: <span className="font-medium">{user.email}</span>
          </p>
          <p className="text-muted-foreground">
            Las rutas son privadas por defecto. Solo <code>/login</code> y <code>/signup</code> son públicas.
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
