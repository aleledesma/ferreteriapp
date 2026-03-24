import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"

export const dynamic = "force-dynamic"

export default function LoginPage() {
  return (
    <AuthShell
      title="Bienvenido de nuevo"
      description="Ingresa con tu cuenta o continúa con Google."
    >
      <LoginForm />
    </AuthShell>
  )
}
