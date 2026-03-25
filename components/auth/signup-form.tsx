"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

type Notice = {
  tone: "error" | "success"
  message: string
}

export function SignupForm() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setNotice(null)

    const origin = window.location.origin
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/login`,
      },
    })

    if (error) {
      setNotice({ tone: "error", message: "No se pudo crear la cuenta. Verifica los datos e inténtalo nuevamente." })
      setLoading(false)
      return
    }

    setNotice({
      tone: "success",
      message:
        "Cuenta creada. Tu acceso quedará inactivo hasta que un administrador lo habilite. Revisa tu correo si se requiere confirmación.",
    })
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear cuenta</CardTitle>
        <CardDescription>Crea tu cuenta con correo y contraseña.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notice ? (
          <Alert variant={notice.tone === "error" ? "destructive" : "success"}>
            <AlertDescription>{notice.message}</AlertDescription>
          </Alert>
        ) : null}

        <form className="space-y-3" onSubmit={handleSignUp}>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Correo electrónico</Label>
            <Input
              id="signup-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password">Contraseña</Label>
            <Input
              id="signup-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        <span>
          ¿Ya tienes una cuenta?{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Iniciar sesión
          </Link>
        </span>
      </CardFooter>
    </Card>
  )
}
