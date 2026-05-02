"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CircleOff, Loader2, PackageSearch, ReceiptText, Warehouse } from "lucide-react"
import { toast } from "sonner"

import type { ProductDetailResponse } from "@/lib/products/catalog-types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"

type ProductDetailSheetProps = {
  productId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(Number(value))
}

function formatDateTime(value: string | null) {
  if (!value) return "Sin ventas registradas"

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function ProductDetailSheet({ productId, open, onOpenChange }: ProductDetailSheetProps) {
  const [detail, setDetail] = useState<ProductDetailResponse["product"] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!open || !productId) {
      setDetail(null)
      return
    }

    async function loadDetail() {
      setIsLoading(true)

      try {
        const response = await fetch(`/api/products/${productId}`)
        const payload = (await response.json()) as ProductDetailResponse & { error?: string }

        if (!response.ok || !payload.product) {
          throw new Error(payload.error || "No se pudo cargar el detalle del producto.")
        }

        setDetail(payload.product)
      } catch (error) {
        toast.error("No se pudo abrir el detalle", {
          description: error instanceof Error ? error.message : "Inténtalo nuevamente.",
        })
        onOpenChange(false)
      } finally {
        setIsLoading(false)
      }
    }

    void loadDetail()
  }, [onOpenChange, open, productId])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-2xl flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalle del producto</SheetTitle>
          <SheetDescription>
            Consulta la información principal del artículo sin perder el contexto del catálogo.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 px-6 py-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : detail ? (
          <div className="space-y-6 px-6 py-4">
            <section className="rounded-2xl border border-border/60 bg-muted/15 p-4 shadow-sm">
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-foreground">{detail.name}</h3>
                    <p className="text-sm text-muted-foreground">Proveedor {detail.supplier.name}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={detail.flags.isActive ? "secondary" : "outline"}>
                      {detail.flags.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                    <Badge variant={detail.flags.isForSale ? "secondary" : "outline"}>
                      {detail.flags.isForSale ? "En venta" : "No en venta"}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/75 px-2.5 py-1">
                    <PackageSearch className="size-3.5" />
                    {detail.supplierProductCode}
                  </span>
                  {detail.barcode ? (
                    <span className="rounded-full border border-border/60 bg-background/75 px-2.5 py-1">
                      {detail.barcode}
                    </span>
                  ) : null}
                  {detail.brand ? <span className="rounded-full border border-border/60 bg-background/75 px-2.5 py-1">{detail.brand}</span> : null}
                  {detail.categoryName ? <span className="rounded-full border border-border/60 bg-background/75 px-2.5 py-1">{detail.categoryName}</span> : null}
                </div>

                {detail.description ? <p className="text-sm leading-relaxed text-muted-foreground">{detail.description}</p> : null}
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-background/85 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <ReceiptText className="size-4 text-primary" />
                  <p className="font-medium text-foreground">Comercial</p>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Precio venta</span>
                    <span className="font-medium">{formatCurrency(detail.pricing.salePrice)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Precio costo</span>
                    <span className="font-medium">{formatCurrency(detail.pricing.costPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Última venta</span>
                    <span className="text-right font-medium">{formatDateTime(detail.salesSummary.lastSaleAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Total vendido</span>
                    <span className="font-medium">{detail.salesSummary.totalUnitsSold}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/85 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Warehouse className="size-4 text-primary" />
                  <p className="font-medium text-foreground">Inventario</p>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Stock actual</span>
                    <span className="font-medium">{detail.inventory.stock}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Stock mínimo</span>
                    <span className="font-medium">{detail.inventory.minStock}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Estado</span>
                    <Badge variant="outline">
                      {detail.inventory.stockStatus === "sin_stock" ? <CircleOff className="size-3.5" /> : null}
                      {detail.inventory.stockStatus === "stock_bajo" ? <AlertTriangle className="size-3.5" /> : null}
                      {detail.inventory.stockStatus === "sin_stock"
                        ? "Sin stock"
                        : detail.inventory.stockStatus === "stock_bajo"
                          ? "Stock bajo"
                          : "Stock normal"}
                    </Badge>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border/60 bg-background/85 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">Movimientos de stock</p>
                  <p className="text-sm text-muted-foreground">Últimos 20 movimientos registrados.</p>
                </div>
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
              </div>

              <div className="space-y-3">
                {detail.stockMovements.length > 0 ? (
                  detail.stockMovements.map((movement) => (
                    <div key={movement.id} className="rounded-xl border border-border/60 bg-muted/10 p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{movement.type.replaceAll("_", " ")}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(movement.createdAt)}</p>
                        </div>
                        <Badge variant="outline">{movement.quantityDelta > 0 ? `+${movement.quantityDelta}` : movement.quantityDelta}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>Anterior: {movement.previousStock ?? "-"}</span>
                        <span>Nuevo: {movement.nextStock ?? "-"}</span>
                        <span>Usuario: {movement.createdBy?.name ?? movement.createdBy?.email ?? "Sistema"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground">
                    Todavía no hay movimientos de stock registrados para este producto.
                  </div>
                )}
              </div>
            </section>

            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
