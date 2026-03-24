"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  isRecoveryPkceError,
  toSpanishAuthMessage,
} from "@/lib/utils/authUtils"

type Notice = {
  tone: "error" | "success"
  message: string
}

const RECOVERY_TYPE = "recovery"

function getSafeNextPath(nextParam: string | null) {
  if (!nextParam || !nextParam.startsWith("/")) {
    return "/"
  }

  return nextParam
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const isRecoveryQuery =
    searchParams.get("recovery") === "1" ||
    searchParams.get("type") === RECOVERY_TYPE
  const [isRecoveryMode, setIsRecoveryMode] = useState(isRecoveryQuery)
  const [notice, setNotice] = useState<Notice | null>(null)
  const handledCallbackRef = useRef<string | null>(null)
  const recoveryMode = isRecoveryMode || isRecoveryQuery

  const nextPath = getSafeNextPath(searchParams.get("next"))
  const providerErrorParam = searchParams.get("error_description")
  const providerError = providerErrorParam
    ? toSpanishAuthMessage(
        decodeURIComponent(providerErrorParam.replace(/\+/g, " ")),
        {
          recoveryContext: isRecoveryQuery,
        },
      )
    : null

  useEffect(() => {
    const code = searchParams.get("code")
    const tokenHash = searchParams.get("token_hash")
    const type = searchParams.get("type")

    const callbackKey = `${code ?? ""}:${tokenHash ?? ""}:${type ?? ""}`
    if (callbackKey === "::" || handledCallbackRef.current === callbackKey) {
      return
    }

    handledCallbackRef.current = callbackKey

    let mounted = true

    void (async () => {
      const isRecoveryCallback =
        (tokenHash && type === RECOVERY_TYPE) || isRecoveryQuery

      if (tokenHash && type === RECOVERY_TYPE) {
        const { error } = await supabase.auth.verifyOtp({
          type: RECOVERY_TYPE,
          token_hash: tokenHash,
        })

        if (!mounted) return

        if (error) {
          setIsRecoveryMode(true)
          setNotice({
            tone: "error",
            message: toSpanishAuthMessage(error.message),
          })
          return
        }

        setIsRecoveryMode(true)
        setNotice({
          tone: "success",
          message: "Enlace validado. Ya puedes definir tu nueva contraseña.",
        })
        router.replace("/login?recovery=1")
        router.refresh()
        return
      }

      if (!code) {
        if (isRecoveryCallback) {
          setIsRecoveryMode(true)
          setNotice({
            tone: "error",
            message:
              "No encontramos un token válido en el enlace de recuperación. Solicita un nuevo correo e inténtalo nuevamente.",
          })
        }
        return
      }

      if (!isRecoveryCallback) {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (session) {
          router.replace(nextPath)
          router.refresh()
          return
        }
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!mounted) return

      if (error) {
        if (!isRecoveryCallback) {
          const {
            data: { session },
          } = await supabase.auth.getSession()

          if (!mounted) return

          if (session) {
            router.replace(nextPath)
            router.refresh()
            return
          }
        }

        if (isRecoveryCallback && isRecoveryPkceError(error.message)) {
          setIsRecoveryMode(true)
        }
        setNotice({
          tone: "error",
          message: toSpanishAuthMessage(error.message, {
            recoveryContext: isRecoveryCallback,
          }),
        })
        return
      }

      if (isRecoveryCallback) {
        setIsRecoveryMode(true)
        setNotice({
          tone: "success",
          message: "Enlace validado. Ya puedes definir tu nueva contraseña.",
        })
        router.replace("/login?recovery=1")
        router.refresh()
        return
      }

      router.replace(nextPath)
      router.refresh()
    })()

    return () => {
      mounted = false
    }
  }, [isRecoveryQuery, nextPath, router, searchParams, supabase.auth])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true)
        setNotice({
          tone: "success",
          message: "Ya puedes definir una nueva contraseña.",
        })
        router.replace("/login?recovery=1")
        router.refresh()
      }

      if (event === "SIGNED_IN" && !recoveryMode) {
        router.replace(nextPath)
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [nextPath, recoveryMode, router, supabase.auth])

  async function handlePasswordSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setNotice(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setNotice({ tone: "error", message: toSpanishAuthMessage(error.message) })
      setLoading(false)
      return
    }

    setNotice({
      tone: "success",
      message: "Inicio de sesión exitoso. Redirigiendo...",
    })
    router.replace(nextPath)
    router.refresh()
  }

  async function handleGoogleSignIn() {
    setLoading(true)
    setNotice(null)

    const origin = window.location.origin
    const redirectTo = `${origin}/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    })

    if (error) {
      setNotice({ tone: "error", message: toSpanishAuthMessage(error.message) })
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setNotice({
        tone: "error",
        message: "Ingresa tu correo para recuperar tu contraseña.",
      })
      return
    }

    setLoading(true)
    setNotice(null)

    const origin = window.location.origin
    const redirectTo = `${origin}/login?recovery=1`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      setNotice({ tone: "error", message: toSpanishAuthMessage(error.message) })
      setLoading(false)
      return
    }

    setNotice({
      tone: "success",
      message:
        "Te enviamos un correo de recuperación. Ábrelo en este mismo navegador/dispositivo para evitar errores de verificación.",
    })
    setLoading(false)
  }

  async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!newPassword || newPassword.length < 8) {
      setNotice({
        tone: "error",
        message: "La nueva contraseña debe tener al menos 8 caracteres.",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      setNotice({
        tone: "error",
        message: "La confirmación de contraseña no coincide.",
      })
      return
    }

    setLoading(true)
    setNotice(null)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setNotice({ tone: "error", message: toSpanishAuthMessage(error.message) })
      setLoading(false)
      return
    }

    setNotice({
      tone: "success",
      message: "Contraseña actualizada correctamente.",
    })
    setNewPassword("")
    setConfirmPassword("")
    setIsRecoveryMode(false)
    setLoading(false)
    router.replace("/")
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {recoveryMode ? "Definir nueva contraseña" : "Iniciar sesión"}
        </CardTitle>
        <CardDescription>
          {recoveryMode
            ? "Completa la recuperación para continuar."
            : "Ingresa con correo/contraseña o con Google."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notice || providerError ? (
          <Alert
            variant={
              notice?.tone === "error" || providerError
                ? "destructive"
                : "success"
            }
          >
            <AlertDescription>
              {notice?.message ?? providerError}
            </AlertDescription>
          </Alert>
        ) : null}

        {recoveryMode ? (
          <form className="space-y-3" onSubmit={handlePasswordUpdate}>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">
                Confirmar nueva contraseña
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Actualizando..." : "Actualizar contraseña"}
            </Button>
          </form>
        ) : (
          <>
            <form className="space-y-3" onSubmit={handlePasswordSignIn}>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>

            <Button
              className="w-full"
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              Continuar con Google
            </Button>

            <Button
              className="w-full"
              type="button"
              variant="ghost"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              ¿Olvidaste tu contraseña?
            </Button>
          </>
        )}
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        <span>
          ¿No tienes cuenta?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Crear cuenta
          </Link>
        </span>
      </CardFooter>
    </Card>
  )
}
