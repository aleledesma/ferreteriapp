"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  Barcode,
  CircleOff,
  Loader2,
  PackageSearch,
  PencilLine,
  ShoppingBag,
  Trash2,
  Warehouse,
} from "lucide-react"
import { toast } from "sonner"

import type {
  ProductDetailResponse,
  StockAdjustmentResponse,
  UpdateProductResponse,
} from "@/lib/products/catalog-types"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

type ProductDetailSheetProps = {
  productId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductChanged?: () => Promise<void> | void
  onDeleteProduct?: (productId: string) => Promise<void>
}

type ActiveTab = "summary" | "inventory" | "edit"

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

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6 py-2.5">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="truncate text-right text-sm font-medium text-foreground tabular-nums">
        {value}
      </span>
    </div>
  )
}

export function ProductDetailSheet({
  productId,
  open,
  onOpenChange,
  onProductChanged,
  onDeleteProduct,
}: ProductDetailSheetProps) {
  const onOpenChangeRef = useRef(onOpenChange)
  const [detail, setDetail] = useState<ProductDetailResponse["product"] | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>("summary")
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

  const stockDelta =
    detail && draft.nextStock !== ""
      ? Number(draft.nextStock) - detail.inventory.stock
      : 0

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
    onOpenChangeRef.current = onOpenChange
  }, [onOpenChange])

  useEffect(() => {
    if (!open || !productId) {
      setDetail(null)
      setActiveTab("summary")
      return
    }

    let cancelled = false

    async function loadDetail() {
      setIsLoading(true)

      try {
        const response = await fetch(`/api/products/${productId}`)
        const payload = (await response.json()) as ProductDetailResponse & {
          error?: string
        }

        if (!response.ok || !payload.product) {
          throw new Error(
            payload.error || "No se pudo cargar el detalle del producto.",
          )
        }

        if (cancelled) {
          return
        }

        setDetail(payload.product)
        syncDraft(payload.product)
      } catch (error) {
        if (cancelled) {
          return
        }

        toast.error("No se pudo abrir el detalle", {
          description:
            error instanceof Error ? error.message : "Inténtalo nuevamente.",
        })
        onOpenChangeRef.current(false)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadDetail()

    return () => {
      cancelled = true
    }
  }, [open, productId])

  async function refreshParentCatalog() {
    await onProductChanged?.()
  }

  async function handlePatch(
    body: Record<string, unknown>,
    successTitle: string,
  ) {
    if (!productId) return

    setIsSaving(true)

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })

      const payload = (await response.json()) as UpdateProductResponse & {
        error?: string
      }

      if (!response.ok || !payload.product) {
        throw new Error(payload.error || "No se pudo actualizar el producto.")
      }

      setDetail(payload.product)
      syncDraft(payload.product)
      await refreshParentCatalog()
      toast.success(successTitle)
    } catch (error) {
      toast.error("No se pudo actualizar el producto", {
        description:
          error instanceof Error ? error.message : "Inténtalo nuevamente.",
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
      const response = await fetch(
        `/api/products/${productId}/stock-adjustments`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            nextStock: Number(draft.nextStock),
            notes:
              draft.stockNotes.trim().length > 0
                ? draft.stockNotes.trim()
                : null,
          }),
        },
      )

      const payload = (await response.json()) as StockAdjustmentResponse & {
        error?: string
      }

      if (!response.ok || !payload.movement) {
        throw new Error(payload.error || "No se pudo ajustar el stock.")
      }

      const refreshed = await fetch(`/api/products/${productId}`)
      const refreshedPayload =
        (await refreshed.json()) as ProductDetailResponse & { error?: string }

      if (!refreshed.ok || !refreshedPayload.product) {
        throw new Error(
          refreshedPayload.error ||
            "No se pudo refrescar el detalle del producto.",
        )
      }

      setDetail(refreshedPayload.product)
      syncDraft(refreshedPayload.product)
      await refreshParentCatalog()
      toast.success("Stock ajustado")
    } catch (error) {
      toast.error("No se pudo ajustar el stock", {
        description:
          error instanceof Error ? error.message : "Inténtalo nuevamente.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const TABS: Array<{ id: ActiveTab; label: string }> = [
    { id: "summary", label: "Resumen" },
    { id: "inventory", label: "Inventario" },
    { id: "edit", label: "Editar" },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full max-w-[94vw] flex-col overflow-hidden p-0 md:max-w-[76vw] xl:max-w-[54vw] 2xl:max-w-[46vw]"
      >
        {/* Always-present title for screen readers */}
        <SheetTitle className="sr-only">
          {detail?.name ?? "Detalle de producto"}
        </SheetTitle>

        {isLoading ? (
          /* ── Loading skeleton ── */
          <div className="flex flex-col">
            <div className="space-y-3 border-b border-border/50 px-6 pr-14 pt-5 pb-4">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-24 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <Skeleton className="h-6 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-2/5 rounded-md" />
            </div>
            <div className="grid grid-cols-3 gap-px bg-border/40">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-2.5 bg-background px-5 py-5">
                  <Skeleton className="h-3 w-14 rounded-md" />
                  <Skeleton className="h-8 w-10 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
              ))}
            </div>
            <div className="flex gap-0 border-b border-border/50 px-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="m-2.5 h-5 w-20 rounded-md" />
              ))}
            </div>
            <div className="space-y-0 px-6 py-5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0"
                >
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-4 w-24 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        ) : detail ? (
          <>
            {/* ── Product header (sticky) ── */}
            <div className="shrink-0 space-y-2 border-b border-border/50 px-6 pr-14 pt-5 pb-4">
              {/* Metadata chips */}
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                  <PackageSearch className="size-3 shrink-0" />
                  {detail.supplierProductCode}
                </span>
                {detail.barcode ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                    <Barcode className="size-3 shrink-0" />
                    {detail.barcode}
                  </span>
                ) : null}
                {detail.brand ? (
                  <span className="rounded-md bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">
                    {detail.brand}
                  </span>
                ) : null}
                {detail.categoryName ? (
                  <span className="rounded-md bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">
                    {detail.categoryName}
                  </span>
                ) : null}
              </div>
              {/* Product name */}
              <h2 className="text-xl font-bold leading-snug tracking-tight text-foreground">
                {detail.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {detail.supplier.name}
              </p>
              {detail.description ? (
                <p className="text-xs leading-relaxed text-muted-foreground/70">
                  {detail.description}
                </p>
              ) : null}
              {detail.deletion.deletedAt ? (
                <p className="text-xs font-medium text-destructive/80">
                  Marcado para eliminación hasta {formatDateTime(detail.deletion.deleteExpiresAt)}
                </p>
              ) : null}
            </div>

            {/* ── Hero strip ── */}
            <div className="shrink-0 grid grid-cols-3 gap-px bg-border/40 border-b border-border/50">
              {/* Stock */}
              <div
                className={cn(
                  "bg-background px-5 py-4",
                  detail.inventory.stockStatus === "sin_stock" &&
                    "bg-destructive/[0.035]",
                  detail.inventory.stockStatus === "stock_bajo" &&
                    "bg-amber-500/[0.035]",
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Stock
                </p>
                <p
                  className={cn(
                    "mt-1.5 text-3xl font-bold tabular-nums leading-none tracking-tight",
                    detail.inventory.stockStatus === "sin_stock" &&
                      "text-destructive",
                    detail.inventory.stockStatus === "stock_bajo" &&
                      "text-amber-600",
                    detail.inventory.stockStatus === "stock_normal" &&
                      "text-foreground",
                  )}
                >
                  {detail.inventory.stock}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  mín. {detail.inventory.minStock}
                </p>
              </div>

              {/* Price */}
              <div className="bg-background px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Precio venta
                </p>
                <p className="mt-1.5 text-xl font-bold tabular-nums leading-tight text-foreground">
                  {formatCurrency(detail.pricing.salePrice)}
                </p>
                <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                  Costo {formatCurrency(detail.pricing.costPrice)}
                </p>
              </div>

              {/* Status */}
              <div className="bg-background px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Estado
                </p>
                <div className="mt-1.5 space-y-1.5">
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium",
                      detail.inventory.stockStatus === "sin_stock" &&
                        "border-destructive/20 bg-destructive/8 text-destructive",
                      detail.inventory.stockStatus === "stock_bajo" &&
                        "border-amber-500/20 bg-amber-500/10 text-amber-700",
                      detail.inventory.stockStatus === "stock_normal" &&
                        "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
                    )}
                  >
                    {detail.inventory.stockStatus === "sin_stock" ? (
                      <CircleOff className="size-3 shrink-0" />
                    ) : null}
                    {detail.inventory.stockStatus === "stock_bajo" ? (
                      <AlertTriangle className="size-3 shrink-0" />
                    ) : null}
                    {detail.inventory.stockStatus === "sin_stock"
                      ? "Sin stock"
                      : detail.inventory.stockStatus === "stock_bajo"
                        ? "Stock bajo"
                        : "Stock normal"}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span
                      className={cn(
                        "inline-block size-1.5 shrink-0 rounded-full",
                        detail.flags.isActive
                          ? "bg-emerald-500"
                          : "bg-muted-foreground/40",
                      )}
                    />
                    {detail.flags.isActive ? "Activo" : "Inactivo"}
                    {detail.flags.isForSale ? (
                      <span className="text-muted-foreground/60">
                        · En venta
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Tab navigation (sticky) ── */}
            <div
              role="tablist"
              className="shrink-0 flex gap-0 border-b border-border/50 bg-background/60 px-2"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "cursor-pointer border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-150",
                    activeTab === tab.id
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground/80",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Scrollable tab content ── */}
            <div role="tabpanel" className="flex-1 overflow-y-auto">
              {/* RESUMEN */}
              {activeTab === "summary" ? (
                <div className="px-6 py-5">
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Comercial
                    </p>
                    <div className="divide-y divide-border/50">
                      <DataRow
                        label="Precio venta"
                        value={formatCurrency(detail.pricing.salePrice)}
                      />
                      <DataRow
                        label="Precio costo"
                        value={formatCurrency(detail.pricing.costPrice)}
                      />
                      <DataRow
                        label="Lista de precios"
                        value={
                          detail.currentPriceList?.name ?? "Sin lista vigente"
                        }
                      />
                      <DataRow
                        label="Última venta"
                        value={formatDateTime(detail.salesSummary.lastSaleAt)}
                      />
                      <DataRow
                        label="Unidades vendidas"
                        value={`${detail.salesSummary.totalUnitsSold}`}
                      />
                    </div>
                  </div>

                  <div className="mt-6 border-t border-border/50 pt-5">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Registro
                    </p>
                    <div className="divide-y divide-border/50">
                      <DataRow
                        label="Creado"
                        value={formatDate(detail.createdAt)}
                      />
                      <DataRow
                        label="Última actualización"
                        value={formatDate(detail.updatedAt)}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {/* INVENTARIO */}
              {activeTab === "inventory" ? (
                <div className="space-y-6 px-6 py-5">
                  {/* Stock adjustment */}
                  <div>
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Ajuste de stock
                    </p>
                    <div className="rounded-xl border border-border/60 bg-muted/5 p-4">
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <p className="text-xs text-muted-foreground">
                          Stock actual:{" "}
                          <span className="font-semibold tabular-nums text-foreground">
                            {detail.inventory.stock}
                          </span>
                        </p>
                        {stockDelta !== 0 && !Number.isNaN(stockDelta) ? (
                          <div
                            className={cn(
                              "flex items-center rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums",
                              stockDelta > 0
                                ? "bg-emerald-500/10 text-emerald-700"
                                : "bg-destructive/10 text-destructive",
                            )}
                          >
                            {stockDelta > 0 ? `+${stockDelta}` : stockDelta}
                          </div>
                        ) : null}
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-end gap-2.5">
                          <div className="flex-1 space-y-1.5">
                            <Label
                              htmlFor="product-stock-adjustment"
                              className="text-xs text-muted-foreground"
                            >
                              Nueva cantidad
                            </Label>
                            <Input
                              id="product-stock-adjustment"
                              type="number"
                              min="0"
                              step="1"
                              value={draft.nextStock}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  nextStock: event.target.value,
                                }))
                              }
                              className="h-10 text-base font-semibold tabular-nums"
                            />
                          </div>
                          <Button
                            type="button"
                            className="h-10 shrink-0"
                            disabled={
                              isSaving ||
                              draft.nextStock === "" ||
                              Number(draft.nextStock) === detail.inventory.stock
                            }
                            onClick={() => void handleStockAdjustment()}
                          >
                            {isSaving ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Warehouse className="size-4" />
                            )}
                            Ajustar
                          </Button>
                        </div>
                        <Textarea
                          id="product-stock-notes"
                          value={draft.stockNotes}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              stockNotes: event.target.value,
                            }))
                          }
                          placeholder="Nota del ajuste (opcional)"
                          className="min-h-[68px] resize-none text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Movement timeline */}
                  <div>
                    <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Historial · últimos {detail.stockMovements.length}{" "}
                      movimientos
                    </p>
                    {detail.stockMovements.length > 0 ? (
                      <div className="relative">
                        {detail.stockMovements.map((movement, idx) => (
                          <div
                            key={movement.id}
                            className="relative flex gap-3 pb-5 last:pb-0"
                          >
                            {/* Connector line */}
                            {idx < detail.stockMovements.length - 1 ? (
                              <div className="absolute left-[10px] top-6 bottom-0 w-px bg-border/60" />
                            ) : null}
                            {/* Delta dot */}
                            <div
                              className={cn(
                                "relative z-10 mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                                movement.quantityDelta > 0
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                                  : "border-destructive/30 bg-destructive/10 text-destructive",
                              )}
                            >
                              {movement.quantityDelta > 0 ? "+" : "−"}
                            </div>
                            {/* Content */}
                            <div className="min-w-0 flex-1 pt-0.5">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium capitalize leading-tight text-foreground">
                                  {movement.type.replaceAll("_", " ")}
                                </p>
                                <span
                                  className={cn(
                                    "shrink-0 text-sm font-bold tabular-nums",
                                    movement.quantityDelta > 0
                                      ? "text-emerald-600"
                                      : "text-destructive",
                                  )}
                                >
                                  {movement.quantityDelta > 0
                                    ? `+${movement.quantityDelta}`
                                    : movement.quantityDelta}
                                </span>
                              </div>
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
                                <span className="tabular-nums">
                                  {movement.previousStock ?? "?"} →{" "}
                                  {movement.nextStock ?? "?"}
                                </span>
                                <span className="text-border">·</span>
                                <span>
                                  {formatDateTime(movement.createdAt)}
                                </span>
                                <span className="text-border">·</span>
                                <span>
                                  {movement.createdBy?.name ??
                                    movement.createdBy?.email ??
                                    "Sistema"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
                        Sin movimientos de stock registrados.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* EDITAR */}
              {activeTab === "edit" ? (
                <div className="space-y-6 px-6 py-5">
                  {/* Toggle flags */}
                  <div>
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Estado del producto
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() =>
                          void handlePatch(
                            { isActive: !detail.flags.isActive },
                            detail.flags.isActive
                              ? "Producto desactivado"
                              : "Producto activado",
                          )
                        }
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
                          detail.flags.isActive
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/[0.15]"
                            : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/35 hover:text-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block size-2 shrink-0 rounded-full transition-colors",
                            detail.flags.isActive
                              ? "bg-emerald-500"
                              : "bg-muted-foreground/40",
                          )}
                        />
                        {detail.flags.isActive ? "Activo" : "Inactivo"}
                      </button>

                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() =>
                          void handlePatch(
                            { isForSale: !detail.flags.isForSale },
                            detail.flags.isForSale
                              ? "Producto fuera de venta"
                              : "Producto habilitado para venta",
                          )
                        }
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
                          detail.flags.isForSale
                            ? "border-primary/30 bg-primary/[0.06] text-primary hover:bg-primary/[0.09]"
                            : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/35 hover:text-foreground",
                        )}
                      >
                        <ShoppingBag className="size-3.5" />
                        {detail.flags.isForSale ? "En venta" : "No en venta"}
                      </button>

                      <button
                        type="button"
                        disabled={isSaving || !detail.flags.isActive || detail.flags.isDeleted}
                        onClick={async () => {
                          if (!productId || !onDeleteProduct) {
                            return
                          }

                          setIsSaving(true)
                          try {
                            await onDeleteProduct(productId)
                            onOpenChange(false)
                          } catch (error) {
                            toast.error("No se pudo eliminar el producto", {
                              description: error instanceof Error ? error.message : "Inténtalo nuevamente.",
                            })
                          } finally {
                            setIsSaving(false)
                          }
                        }}
                        className="flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/[0.04] px-4 py-2.5 text-sm font-medium text-destructive/80 transition-all duration-150 hover:bg-destructive/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="size-3.5" />
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {/* Edit fields */}
                  <div className="border-t border-border/50 pt-5">
                    <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Información del producto
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label
                          htmlFor="product-name-edit"
                          className="text-xs text-muted-foreground"
                        >
                          Nombre
                        </Label>
                        <Input
                          id="product-name-edit"
                          value={draft.name}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="product-brand-edit"
                          className="text-xs text-muted-foreground"
                        >
                          Marca
                        </Label>
                        <Input
                          id="product-brand-edit"
                          value={draft.brand}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              brand: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="product-category-edit"
                          className="text-xs text-muted-foreground"
                        >
                          Categoría
                        </Label>
                        <Input
                          id="product-category-edit"
                          value={draft.categoryName}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              categoryName: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="product-barcode-edit"
                          className="text-xs text-muted-foreground"
                        >
                          Código de barras
                        </Label>
                        <Input
                          id="product-barcode-edit"
                          value={draft.barcode}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              barcode: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="product-min-stock-edit"
                          className="text-xs text-muted-foreground"
                        >
                          Stock mínimo
                        </Label>
                        <Input
                          id="product-min-stock-edit"
                          type="number"
                          min="0"
                          step="1"
                          value={draft.minStock}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              minStock: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="product-sale-price-edit"
                          className="text-xs text-muted-foreground"
                        >
                          Precio de venta
                        </Label>
                        <Input
                          id="product-sale-price-edit"
                          type="number"
                          min="0"
                          step="0.01"
                          value={draft.salePrice}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              salePrice: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="product-cost-price-edit"
                          className="text-xs text-muted-foreground"
                        >
                          Precio de costo
                        </Label>
                        <Input
                          id="product-cost-price-edit"
                          type="number"
                          min="0"
                          step="0.01"
                          value={draft.costPrice}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              costPrice: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save */}
                  <div className="border-t border-border/50 pt-4">
                    <Button
                      type="button"
                      disabled={!isDirty || isSaving}
                      onClick={() => void handleSaveDetails()}
                    >
                      {isSaving ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <PencilLine className="size-4" />
                      )}
                      Guardar cambios
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
