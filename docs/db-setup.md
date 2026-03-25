# Configuración inicial de base de datos (Prisma + Supabase)

Esta guía es para **primera ejecución** del proyecto.

## 1) Contexto mínimo de variables de entorno

En tu `.env` (o entorno local) necesitás al menos:

- `DATABASE_URL`: cadena de conexión Postgres de Supabase (la usada por Prisma).

> Sin `DATABASE_URL`, ni migraciones ni seed pueden ejecutarse.

## 2) Aplicar migraciones (crea tablas, funciones y trigger)

Desde la raíz del proyecto ejecutá:

```bash
npx prisma migrate deploy
```

Esto aplica las migraciones de `prisma/migrations` y crea los objetos de DB necesarios (incluyendo funciones y trigger de RBAC/custom claims).

## 3) Ejecutar seed inicial

```bash
npx tsx prisma/seed.ts
```

Esto carga datos base (roles/permisos y relaciones iniciales) requeridos por el esquema RBAC.

## 4) Habilitar Custom Access Token Hook en Supabase

En Supabase Dashboard:

1. Ir a **Authentication** → **Hooks**.
2. En **Custom Access Token Hook**, seleccionar/usar la función:
   - `public.custom_access_token_hook`
3. Guardar cambios.

## 5) Validaciones rápidas post-setup

Podés validar desde SQL Editor de Supabase:

```sql
select to_regclass('public.app_roles') as app_roles_table;
select to_regprocedure('public.custom_access_token_hook(jsonb)') as access_token_hook_fn;
select to_regprocedure('public.authorize(text)') as authorize_fn;
select to_regprocedure('public.assign_default_inactive_role()') as assign_inactive_trigger_fn;
```

Y verificar datos base:

```sql
select name from public.app_roles order by name;
```

Deberías ver al menos `ADMIN` e `INACTIVE`.

## 6) Re-login para refrescar claims JWT

Después de activar el hook o cambiar roles/permisos, hacé **logout + login** (o refresh de sesión) para recibir el JWT con claims actualizados.
