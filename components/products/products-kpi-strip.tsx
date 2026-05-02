import { AlertTriangle, Boxes, CircleOff, PackageCheck } from "lucide-react"

import type { ProductCatalogKpisResponse } from "@/lib/products/catalog-types"

import { Card, CardContent } from "@/components/ui/card"

type ProductsKpiStripProps = {
  kpis: ProductCatalogKpisResponse
}

const KPI_ITEMS = [
  {
    key: "totalProducts",
    label: "Total catálogo",
    icon: Boxes,
  },
  {
    key: "activeProducts",
    label: "Activos",
    icon: PackageCheck,
  },
  {
    key: "lowStockProducts",
    label: "Stock bajo",
    icon: AlertTriangle,
  },
  {
    key: "outOfStockProducts",
    label: "Sin stock",
    icon: CircleOff,
  },
] as const satisfies ReadonlyArray<{
  key: keyof ProductCatalogKpisResponse
  label: string
  icon: typeof Boxes
}>

export function ProductsKpiStrip({ kpis }: ProductsKpiStripProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {KPI_ITEMS.map((item, index) => {
        const Icon = item.icon

        return (
          <Card
            key={item.key}
            className="border-border/50 bg-background/70 shadow-sm backdrop-blur animate-in fade-in-0 slide-in-from-top-1 duration-500"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <CardContent className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="text-xl font-semibold text-foreground">{kpis[item.key]}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-2xl border border-border/60 bg-muted/35 text-muted-foreground shadow-inner">
                <Icon className="size-4" />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
