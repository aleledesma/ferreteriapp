"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, CircleOff, Loader2, PackageSearch, PencilLine, ReceiptText, ShieldBan, ShoppingBag, Warehouse } from "lucide-react"
import { toast } from "sonner"

import type { ProductDetailResponse, StockAdjustmentResponse, UpdateProductResponse } from "@/lib/products/catalog-types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

type ProductDetailSheetProps = {
  productId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductChanged?: () => Promise<void> | void
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
  }).format(new Date(value))
}

export function ProductDetailSheet({ productId, open, onOpenChange, onProductChanged }: ProductDetailSheetProps) {
  const [detail, setDetail] = useState<ProductDetailResponse["product"] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState({
    name: "",
    brand: "",
    categoryName: "",
    barcode: "",
    salePrice: "0",
    costPrice: "0",
    minStock: "0",
    nextStock: "0",
    stockNotes: "",
  })

  const isDirty = useMemo(() => {
    if (!detail) return false

    return (
      draft.name !== detail.name ||
      draft.brand !== (detail.brand ?? "") ||
      draft.categoryName !== (detail.categoryName ?? "") ||
      draft.barcode !== (detail.barcode ?? "") ||
      draft.salePrice !== detail.pricing.salePrice ||
      draft.costPrice !== detail.pricing.costPrice ||
      draft.minStock !== String(detail.inventory.minStock)
    )
  }, [detail, draft])

  function syncDraft(nextDetail: ProductDetailResponse["product"]) {
    setDraft({
      name: nextDetail.name,
      brand: nextDetail.brand ?? "",
      categoryName: nextDetail.categoryName ?? "",
      barcode: nextDetail.barcode ?? "",
      salePrice: nextDetail.pricing.salePrice,
      costPrice: nextDetail.pricing.costPrice,
      minStock: String(nextDetail.inventory.minStock),
      nextStock: String(nextDetail.inventory.stock),
      stockNotes: "",
    })
  }

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
        syncDraft(payload.product)
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

  async function refreshParentCatalog() {
    await onProductChanged?.()
  }

  async function handlePatch(body: Record<string, unknown>, successTitle: string) {
    if (!productId) return

    setIsSaving(true)

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const payload = (await response.json()) as UpdateProductResponse & { error?: string }

      if (!response.ok || !payload.product) {
        throw new Error(payload.error || "No se pudo actualizar el producto.")
      }

      setDetail(payload.product)
      syncDraft(payload.product)
      await refreshParentCatalog()
      toast.success(successTitle)
    } catch (error) {
      toast.error("No se pudo actualizar el producto", {
        description: error instanceof Error ? error.message : "Inténtalo nuevamente.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveDetails() {
    await handlePatch(
      {
        name: draft.name,
        brand: draft.brand,
        categoryName: draft.categoryName,
        barcode: draft.barcode,
        salePrice: draft.salePrice,
        costPrice: draft.costPrice,
        minStock: Number(draft.minStock),
      },
      "Producto actualizado",
    )
  }

  async function handleStockAdjustment() {
    if (!productId) return

    setIsSaving(true)

    try {
      const response = await fetch(`/api/products/${productId}/stock-adjustments`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          nextStock: Number(draft.nextStock),
          notes: draft.stockNotes.trim().length > 0 ? draft.stockNotes.trim() : null,
        }),
      })

      const payload = (await response.json()) as StockAdjustmentResponse & { error?: string }

      if (!response.ok || !payload.movement) {
        throw new Error(payload.error || "No se pudo ajustar el stock.")
      }

      const refreshed = await fetch(`/api/products/${productId}`)
      const refreshedPayload = (await refreshed.json()) as ProductDetailResponse & { error?: string }

      if (!refreshed.ok || !refreshedPayload.product) {
        throw new Error(refreshedPayload.error || "No se pudo refrescar el detalle del producto.")
      }

      setDetail(refreshedPayload.product)
      syncDraft(refreshedPayload.product)
      await refreshParentCatalog()
      toast.success("Stock ajustado")
    } catch (error) {
      toast.error("No se pudo ajustar el stock", {
        description: error instanceof Error ? error.message : "Inténtalo nuevamente.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-[94vw] flex-col overflow-y-auto md:max-w-[78vw] xl:max-w-[58vw] 2xl:max-w-[52vw]">
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

            <Tabs defaultValue="summary" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Resumen</TabsTrigger>
                <TabsTrigger value="inventory">Inventario</TabsTrigger>
                <TabsTrigger value="edit">Edición</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
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
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Lista vigente</span>
                        <span className="text-right font-medium">{detail.currentPriceList?.name ?? "Sin lista vigente"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/85 p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <Warehouse className="size-4 text-primary" />
                      <p className="font-medium text-foreground">Estado general</p>
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
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Creado</span>
                        <span className="font-medium">{formatDate(detail.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Actualizado</span>
                        <span className="font-medium">{formatDate(detail.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="inventory" className="space-y-4">
                <section className="rounded-2xl border border-border/60 bg-background/85 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">Movimientos de stock</p>
                      <p className="text-sm text-muted-foreground">Últimos 20 movimientos registrados.</p>
                    </div>
                    {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                  </div>

                  <div className="mb-4 rounded-xl border border-border/60 bg-muted/10 p-3">
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
                      <div className="space-y-2 lg:min-w-44">
                        <Label htmlFor="product-stock-adjustment">Ajuste manual de stock</Label>
                        <Input id="product-stock-adjustment" type="number" min="0" step="1" value={draft.nextStock} onChange={(event) => setDraft((current) => ({ ...current, nextStock: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-stock-notes">Nota del ajuste (opcional)</Label>
                        <Textarea
                          id="product-stock-notes"
                          value={draft.stockNotes}
                          onChange={(event) => setDraft((current) => ({ ...current, stockNotes: event.target.value }))}
                          placeholder="Ej. corrección por conteo manual"
                          className="min-h-10 resize-none"
                        />
                      </div>
                      <Button type="button" disabled={isSaving || Number(draft.nextStock) === detail.inventory.stock} onClick={() => void handleStockAdjustment()}>
                        {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Warehouse className="size-4" />}
                        Ajustar stock
                      </Button>
                    </div>
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
              </TabsContent>

              <TabsContent value="edit" className="space-y-4">
                <section className="rounded-2xl border border-border/60 bg-background/85 p-4 shadow-sm">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">Acciones rápidas</p>
                      <p className="text-sm text-muted-foreground">Opera sobre el producto sin abandonar el catálogo.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSaving}
                        onClick={() => void handlePatch({ isActive: !detail.flags.isActive }, detail.flags.isActive ? "Producto desactivado" : "Producto activado")}
                      >
                        <ShieldBan className="size-4" />
                        {detail.flags.isActive ? "Desactivar" : "Activar"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSaving}
                        onClick={() => void handlePatch({ isForSale: !detail.flags.isForSale }, detail.flags.isForSale ? "Producto fuera de venta" : "Producto habilitado para venta")}
                      >
                        <ShoppingBag className="size-4" />
                        {detail.flags.isForSale ? "Sacar de venta" : "Habilitar venta"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="product-name-edit">Nombre</Label>
                      <Input id="product-name-edit" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-brand-edit">Marca</Label>
                      <Input id="product-brand-edit" value={draft.brand} onChange={(event) => setDraft((current) => ({ ...current, brand: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-category-edit">Categoría</Label>
                      <Input id="product-category-edit" value={draft.categoryName} onChange={(event) => setDraft((current) => ({ ...current, categoryName: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-barcode-edit">Código de barras</Label>
                      <Input id="product-barcode-edit" value={draft.barcode} onChange={(event) => setDraft((current) => ({ ...current, barcode: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-sale-price-edit">Precio de venta</Label>
                      <Input id="product-sale-price-edit" type="number" min="0" step="0.01" value={draft.salePrice} onChange={(event) => setDraft((current) => ({ ...current, salePrice: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-cost-price-edit">Precio de costo</Label>
                      <Input id="product-cost-price-edit" type="number" min="0" step="0.01" value={draft.costPrice} onChange={(event) => setDraft((current) => ({ ...current, costPrice: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-min-stock-edit">Stock mínimo</Label>
                      <Input id="product-min-stock-edit" type="number" min="0" step="1" value={draft.minStock} onChange={(event) => setDraft((current) => ({ ...current, minStock: event.target.value }))} />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button type="button" disabled={!isDirty || isSaving} onClick={() => void handleSaveDetails()}>
                      {isSaving ? <Loader2 className="size-4 animate-spin" /> : <PencilLine className="size-4" />}
                      Guardar cambios
                    </Button>
                  </div>
                </section>
              </TabsContent>
            </Tabs>

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
