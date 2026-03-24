import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { SignupForm } from "@/components/auth/signup-form"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function SignupPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/")
  }

  return (
    <AuthShell title="Crear cuenta" description="Regístrate con tu correo y una contraseña segura.">
      <SignupForm />
    </AuthShell>
  )
}
