import { requireRole } from "@/lib/auth/guards"
import { NewSaleClient } from "@/components/sales/new-sale-client"

export default async function NewSalePage() {
  await requireRole(["ACTIVE", "ADMIN"])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-primary)/5,_transparent_35%),linear-gradient(180deg,var(--color-background),color-mix(in_oklab,var(--color-muted)_45%,transparent))] p-4 md:p-8">
      <div className="mx-auto w-full max-w-7xl">
        
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Punto de Venta
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Nueva Venta</h1>
        </div>

        <NewSaleClient />

      </div>
    </main>
  )
}