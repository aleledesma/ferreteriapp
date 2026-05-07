import { ChevronRight } from "lucide-react"

import { ProductsNewTabs } from "@/components/products/products-new-tabs"
import { requireRole } from "@/lib/auth/guards"

const STEPS = [
  { n: 1, title: "Define el proveedor" },
  { n: 2, title: "Agrupa sus archivos" },
  { n: 3, title: "Inicia la carga" },
]

export default async function NewProductsPage() {
  await requireRole(["ACTIVE", "ADMIN"])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-primary)/14,_transparent_30%),radial-gradient(circle_at_85%_15%,_color-mix(in_oklab,var(--color-primary)_18%,transparent),_transparent_22%),linear-gradient(180deg,var(--color-background),color-mix(in_oklab,var(--color-muted)_45%,transparent))] p-4 md:p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-500">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Catálogo / Nuevos productos
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Nuevos productos
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Centraliza la incorporación de listas de precios y prepara la información para crear o actualizar productos del catálogo.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-1.5">
            {STEPS.map((step, index) => (
              <div key={step.n} className="flex items-center gap-1.5">
                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-2 shadow-sm backdrop-blur-sm">
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {step.n}
                  </span>
                  <span className="text-sm font-medium text-foreground">{step.title}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/40" />
                )}
              </div>
            ))}
          </div>
        </div>

        <ProductsNewTabs />
      </div>
    </main>
  )
}
