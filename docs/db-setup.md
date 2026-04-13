# Configuración inicial de base de datos (base nueva)

Esta guía asume una base nueva, sin datos ni estructuras previas.

## 1) Variable de entorno mínima

En `.env` necesitás:

- `DATABASE_URL`

## 2) Estado actual de migraciones

```bash
npx prisma migrate deploy
```

En este punto no hay migraciones funcionales activas para auth.
La implementación de Auth.js y la nueva tabla de usuarios se agregarán en la Fase B.

## 3) Verificación rápida

```sql
select to_regclass('public.app_roles') as app_roles;
select to_regprocedure('public.custom_access_token_hook(jsonb)') as custom_access_token_hook;
select to_regprocedure('public.authorize(text)') as authorize_fn;
```

El resultado esperado es `null` en las tres consultas.

## 4) Nota

En esta fase no se ejecuta seed ni hooks de autenticación.
Eso se configurará en la siguiente fase cuando se integre Auth.js.
