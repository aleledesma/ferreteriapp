import { AlertTriangle, Boxes, CircleOff, PackageCheck } from "lucide-react"

import type { ProductCatalogKpisResponse } from "@/lib/products/catalog-types"
import { cn } from "@/lib/utils"

type ProductsKpiStripProps = {
  kpis: ProductCatalogKpisResponse
}

const KPI_ITEMS = [
  {
    key: "totalProducts" as const,
    label: "Total catálogo",
    icon: Boxes,
    borderClass: "border-l-foreground/30",
    numberClass: "text-foreground",
  },
  {
    key: "activeProducts" as const,
    label: "Activos",
    icon: PackageCheck,
    borderClass: "border-l-emerald-500",
    numberClass: "text-emerald-700",
  },
  {
    key: "lowStockProducts" as const,
    label: "Stock bajo",
    icon: AlertTriangle,
    borderClass: "border-l-amber-500",
    numberClass: "text-amber-700",
  },
  {
    key: "outOfStockProducts" as const,
    label: "Sin stock",
    icon: CircleOff,
    borderClass: "border-l-destructive",
    numberClass: "text-destructive",
  },
] satisfies ReadonlyArray<{
  key: keyof ProductCatalogKpisResponse
  label: string
  icon: typeof Boxes
  borderClass: string
  numberClass: string
}>

export function ProductsKpiStrip({ kpis }: ProductsKpiStripProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {KPI_ITEMS.map((item, index) => {
        const Icon = item.icon

        return (
          <div
            key={item.key}
            className={cn(
              "rounded-xl border border-border/60 border-l-[3px] bg-background/90 px-5 py-4 shadow-sm backdrop-blur-sm",
              "animate-in fade-in-0 slide-in-from-bottom-1 duration-500",
              item.borderClass,
            )}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Icon className="size-3.5 shrink-0" />
              {item.label}
            </div>
            <p className={cn("mt-2 text-[2rem] font-bold tabular-nums leading-none tracking-tight", item.numberClass)}>
              {kpis[item.key]}
            </p>
          </div>
        )
      })}
    </div>
  )
}
