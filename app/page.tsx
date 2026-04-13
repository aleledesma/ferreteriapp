import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>FerreteriApp</CardTitle>
          <CardDescription>Base limpia para iniciar la migración de autenticación.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Se eliminó temporalmente la lógica de Supabase Auth y RBAC para reimplementar autenticación con Auth.js.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
