export function toSpanishAuthMessage(
  message: string,
  options?: { recoveryContext?: boolean },
) {
  const normalized = message.toLowerCase()

  if (normalized.includes("pkce code verifier not found in storage")) {
    if (!options?.recoveryContext) {
      return "No se pudo completar la autenticación con Google. Inténtalo nuevamente."
    }

    return "No se pudo validar el enlace de recuperación. Suele pasar cuando se abre en otro navegador/dispositivo o después de limpiar el almacenamiento del navegador. Solicita un nuevo correo y ábrelo en este mismo navegador."
  }

  if (normalized.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos."
  }

  if (normalized.includes("email not confirmed")) {
    return "Tu correo todavía no está confirmado. Revisa tu bandeja de entrada."
  }

  if (
    normalized.includes("token has expired") ||
    normalized.includes("otp_expired") ||
    normalized.includes("link is invalid")
  ) {
    return "El enlace es inválido o venció. Solicita un nuevo correo de recuperación."
  }

  if (normalized.includes("too many requests")) {
    return "Se alcanzó el límite de intentos. Espera un momento e inténtalo de nuevo."
  }

  return "No se pudo completar la autenticación. Inténtalo nuevamente."
}

export function isRecoveryPkceError(message: string) {
  return message
    .toLowerCase()
    .includes("pkce code verifier not found in storage")
}