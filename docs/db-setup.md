# Configuración inicial (Auth.js + Prisma + Google OAuth)

Esta guía es para levantar el módulo de autenticación desde cero en una base nueva.

## 1) Variables de entorno

Configura en `.env`:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_TRUST_HOST=true` (recomendado en desarrollo)
- `AUTH_BOOTSTRAP_ADMIN_EMAIL` (opcional, para promocionar automáticamente al primer admin)

## 2) Instalar dependencias

```bash
npm install
```

## 3) Generar cliente Prisma y aplicar migraciones

```bash
npx prisma generate
npx prisma migrate deploy
```

## 4) Configurar Google OAuth

En Google Cloud Console:

1. Crea credenciales OAuth 2.0.
2. Agrega URI autorizado para callback:
   - `http://localhost:3000/api/auth/callback/google`
3. En producción agrega tu dominio real con la misma ruta de callback.

## 5) Levantar la app

```bash
npm run dev
```

## 6) Verificación rápida

1. Entra a `/login` y autentica con Google.
2. Verifica que se crean registros en `users`, `accounts` y `sessions`.
3. Si configuraste `AUTH_BOOTSTRAP_ADMIN_EMAIL`, ese usuario entra como `ADMIN` (solo si todavía no existe otro admin).
