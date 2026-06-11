import { signIn } from "@/auth"
import { GoogleAuthCard } from "@/components/auth/google-auth-card"

export default function LoginPage() {
  async function handleGoogleSignIn() {
    "use server"

    await signIn("google", { redirectTo: "/" })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <GoogleAuthCard
        title="Iniciar sesión"
        description="Accede con tu cuenta de Google para ingresar a FerreteriApp."
        buttonLabel="Continuar con Google"
        onSubmit={handleGoogleSignIn}
      />
    </main>
  )
}
