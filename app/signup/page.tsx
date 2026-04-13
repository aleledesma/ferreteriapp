import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Registro temporalmente deshabilitado</CardTitle>
          <CardDescription>
            Esta pantalla se redefinirá después de integrar Auth.js.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          En la siguiente fase se habilitará autenticación solo con Google OAuth.
        </CardContent>
      </Card>
    </main>
  )
}
