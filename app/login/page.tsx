import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Acceso temporalmente deshabilitado</CardTitle>
          <CardDescription>
            Esta pantalla se reimplementará con Auth.js (Google OAuth).
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          La autenticación anterior fue removida como parte de la limpieza de la Fase A.
        </CardContent>
      </Card>
    </main>
  )
}
