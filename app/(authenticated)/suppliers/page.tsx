import { SuppliersPageClient } from "@/components/suppliers/suppliers-page-client"
import { requireRole } from "@/lib/auth/guards"

export default async function SuppliersPage() {
  await requireRole(["ACTIVE", "ADMIN"])

  return (
    <main className="min-h-full bg-[radial-gradient(circle_at_top,_var(--color-primary)/10,_transparent_35%),linear-gradient(180deg,var(--color-background),color-mix(in_oklab,var(--color-muted)_45%,transparent))] p-4 md:p-8">
      <div className="mx-auto w-full max-w-7xl">
        <SuppliersPageClient />
      </div>
    </main>
  )
}
