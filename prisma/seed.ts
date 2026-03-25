import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("Falta DATABASE_URL para ejecutar la seed de Prisma.")
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`
      insert into public.app_roles(name, is_system)
      values ('ADMIN', true), ('INACTIVE', true)
      on conflict (name)
      do update set is_system = excluded.is_system
    `)

    await tx.$executeRawUnsafe(`
      insert into public.app_permissions(name, description)
      values
        ('*', 'Acceso total a todos los permisos'),
        ('dashboard.read', 'Permite acceder al panel principal')
      on conflict (name)
      do update set description = excluded.description
    `)

    await tx.$executeRawUnsafe(`
      insert into public.app_role_permissions(role_id, permission_id)
      select roles.id, permissions.id
      from public.app_roles roles
      join public.app_permissions permissions on permissions.name = '*'
      where roles.name = 'ADMIN'
      on conflict (role_id, permission_id) do nothing
    `)

    await tx.$executeRawUnsafe(`
      delete from public.app_role_permissions
      where role_id = (
        select id
        from public.app_roles
        where name = 'INACTIVE'
      )
    `)
  })
}

main()
  .catch((error) => {
    console.error("Error al ejecutar seed RBAC:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
