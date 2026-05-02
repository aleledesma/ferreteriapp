"use client"

import { useMemo, useState, useTransition } from "react"
import { Funnel, Search, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import type {
  DeactivateProductsResponse,
  ProductActivityStatusFilter,
  ProductCatalogKpisResponse,
  ProductCatalogSupplierOption,
  ProductListResponse,
  ProductSaleStatusFilter,
  ProductSortOption,
  ProductStockStatus,
} from "@/lib/products/catalog-types"

import { ProductDetailSheet } from "@/components/products/product-detail-sheet"
import { DeactivateProductsDialog } from "@/components/products/deactivate-products-dialog"
import { ProductsKpiStrip } from "@/components/products/products-kpi-strip"
import { ProductsTable } from "@/components/products/products-table"
import { ProductsTableSkeleton } from "@/components/products/products-table-skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ProductsPageClientProps = {
  initialCatalog: ProductListResponse
  initialKpis: ProductCatalogKpisResponse
  supplierOptions: ProductCatalogSupplierOption[]
}

function buildInitialFilters(appliedFilters: ProductListResponse["appliedFilters"]) {
  return {
    search: appliedFilters.search ?? "",
    supplierId: appliedFilters.supplierId ?? "all",
    category: appliedFilters.category ?? "",
    brand: appliedFilters.brand ?? "",
    stockStatus: appliedFilters.stockStatus ?? "all",
    activityStatus: appliedFilters.activityStatus,
    saleStatus: appliedFilters.saleStatus,
    sort: appliedFilters.sort,
  }
}

const STOCK_STATUS_OPTIONS: Array<{ value: ProductStockStatus | "all"; label: string }> = [
  { value: "all", label: "Todo el stock" },
  { value: "sin_stock", label: "Sin stock" },
  { value: "stock_bajo", label: "Stock bajo" },
  { value: "stock_normal", label: "Stock normal" },
]

const ACTIVITY_OPTIONS: Array<{ value: ProductActivityStatusFilter; label: string }> = [
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
  { value: "all", label: "Todos" },
]

const SALE_OPTIONS: Array<{ value: ProductSaleStatusFilter; label: string }> = [
  { value: "all", label: "Venta y no venta" },
  { value: "for_sale", label: "En venta" },
  { value: "not_for_sale", label: "No en venta" },
]

const SORT_OPTIONS: Array<{ value: ProductSortOption; label: string }> = [
  { value: "critical_stock", label: "Stock crítico primero" },
  { value: "name", label: "Nombre" },
  { value: "updated_at", label: "Última actualización" },
  { value: "sale_price", label: "Precio de venta" },
  { value: "stock", label: "Stock" },
  { value: "supplier", label: "Proveedor" },
]

async function fetchCatalog(searchParams: URLSearchParams) {
  const response = await fetch(`/api/products?${searchParams.toString()}`)
  const payload = (await response.json()) as ProductListResponse & { error?: string }

  if (!response.ok) {
    throw new Error(payload.error || "No se pudo cargar el catálogo de productos.")
  }

  return payload
}

export function ProductsPageClient({ initialCatalog, initialKpis, supplierOptions }: ProductsPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [catalog, setCatalog] = useState(initialCatalog)
  const [filters, setFilters] = useState(() => buildInitialFilters(initialCatalog.appliedFilters))
  const [isPending, startTransition] = useTransition()
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const activeProductId = searchParams.get("product")

  const activeFilterCount = useMemo(() => {
    return [
      filters.search.trim().length > 0,
      filters.supplierId !== "all",
      filters.category.trim().length > 0,
      filters.brand.trim().length > 0,
      filters.stockStatus !== "all",
      filters.activityStatus !== "active",
      filters.saleStatus !== "all",
      filters.sort !== "critical_stock",
    ].filter(Boolean).length
  }, [filters])

  function buildBaseParams() {
    const params = new URLSearchParams()

    if (filters.search.trim()) params.set("search", filters.search.trim())
    if (filters.supplierId !== "all") params.set("supplierId", filters.supplierId)
    if (filters.category.trim()) params.set("category", filters.category.trim())
    if (filters.brand.trim()) params.set("brand", filters.brand.trim())
    if (filters.stockStatus !== "all") params.set("stockStatus", filters.stockStatus)
    if (filters.activityStatus !== "active") params.set("activityStatus", filters.activityStatus)
    if (filters.saleStatus !== "all") params.set("saleStatus", filters.saleStatus)
    if (filters.sort !== "critical_stock") params.set("sort", filters.sort)
    params.set("limit", "100")

    return params
  }

  function buildRouteParams(productId: string | null) {
    const next = buildBaseParams()

    if (productId) {
      next.set("product", productId)
    } else {
      next.delete("product")
    }

    return next
  }

  function syncProductQuery(productId: string | null) {
    const next = buildRouteParams(productId)

    router.replace(`/products?${next.toString()}`, { scroll: false })
  }

  function applyFilters() {
    startTransition(async () => {
      try {
        const params = buildBaseParams()
        const nextCatalog = await fetchCatalog(params)
        setCatalog(nextCatalog)
        setSelectedIds([])
        router.replace(`/products?${buildRouteParams(activeProductId).toString()}`, { scroll: false })
      } catch (error) {
        toast.error("No se pudo actualizar el catálogo", {
          description: error instanceof Error ? error.message : "Inténtalo nuevamente.",
        })
      }
    })
  }

  async function handleLoadMore() {
    if (!catalog.pageInfo.hasMore || !catalog.pageInfo.nextCursor) {
      return
    }

    setIsLoadingMore(true)

    try {
      const params = buildBaseParams()
      params.set("cursor", catalog.pageInfo.nextCursor)
      const nextCatalog = await fetchCatalog(params)
      setCatalog((current) => ({
        ...nextCatalog,
        items: [...current.items, ...nextCatalog.items],
      }))
    } catch (error) {
      toast.error("No se pudo cargar más productos", {
        description: error instanceof Error ? error.message : "Inténtalo nuevamente.",
      })
    } finally {
      setIsLoadingMore(false)
    }
  }

  function resetFilters() {
    setFilters({
      search: "",
      supplierId: "all",
      category: "",
      brand: "",
      stockStatus: "all",
      activityStatus: "active",
      saleStatus: "all",
      sort: "critical_stock",
    })
  }

  function toggleSelection(productId: string, checked: boolean) {
    setSelectedIds((current) => {
      if (checked) {
        return current.includes(productId) ? current : [...current, productId]
      }

      return current.filter((id) => id !== productId)
    })
  }

  function toggleAllVisible(checked: boolean) {
    setSelectedIds((current) => {
      if (!checked) {
        return current.filter((id) => !catalog.items.some((item) => item.id === id))
      }

      const merged = new Set(current)
      for (const item of catalog.items) {
        merged.add(item.id)
      }

      return Array.from(merged)
    })
  }

  async function refreshCatalogWithCurrentFilters() {
    const params = buildBaseParams()
    const nextCatalog = await fetchCatalog(params)
    setCatalog(nextCatalog)
    setSelectedIds([])
  }

  async function handleDeactivateSelected() {
    if (selectedIds.length === 0) {
      return
    }

    setIsDeactivating(true)

    try {
      const response = await fetch("/api/products/deactivate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ productIds: selectedIds }),
      })

      const payload = (await response.json()) as DeactivateProductsResponse & { error?: string }

      if (!response.ok) {
        throw new Error(payload.error || "No se pudieron desactivar los productos.")
      }

      await refreshCatalogWithCurrentFilters()
      setIsDeactivateDialogOpen(false)
      toast.success("Productos desactivados", {
        description: `${payload.processedCount} producto${payload.processedCount === 1 ? "" : "s"} actualizado${payload.processedCount === 1 ? "" : "s"}.`,
      })
    } catch (error) {
      toast.error("No se pudieron desactivar los productos", {
        description: error instanceof Error ? error.message : "Inténtalo nuevamente.",
      })
    } finally {
      setIsDeactivating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/10 bg-background/85 shadow-lg shadow-primary/5 backdrop-blur animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <CardHeader className="gap-6 border-b border-border/50 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-primary)_8%,transparent),transparent_58%),linear-gradient(180deg,transparent,color-mix(in_oklab,var(--color-muted)_55%,transparent))]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <Funnel className="size-3.5" />
              Catálogo operativo
            </div>
            <CardTitle className="text-3xl tracking-tight md:text-4xl">Productos</CardTitle>
            <CardDescription className="max-w-3xl text-base leading-relaxed">
              Supervisa el inventario real, prioriza faltantes y mantén a mano la información clave de cada producto sin salir del flujo del catálogo.
            </CardDescription>
          </div>

          <ProductsKpiStrip kpis={initialKpis} />
        </CardHeader>

        <CardContent className="space-y-5 p-5 md:p-6">
          <div className="rounded-2xl border border-border/60 bg-muted/15 p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="relative xl:col-span-2">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={filters.search}
                  onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                  placeholder="Buscar por nombre, código, barra, marca o proveedor"
                  className="pl-9"
                />
              </div>

              <Input
                value={filters.category}
                onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
                placeholder="Filtrar por categoría"
              />

              <Input
                value={filters.brand}
                onChange={(event) => setFilters((current) => ({ ...current, brand: event.target.value }))}
                placeholder="Filtrar por marca"
              />

              <Select value={filters.supplierId} onValueChange={(value) => setFilters((current) => ({ ...current, supplierId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proveedores</SelectItem>
                  {supplierOptions.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.stockStatus} onValueChange={(value) => setFilters((current) => ({ ...current, stockStatus: value as ProductStockStatus | "all" }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado de stock" />
                </SelectTrigger>
                <SelectContent>
                  {STOCK_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.activityStatus} onValueChange={(value) => setFilters((current) => ({ ...current, activityStatus: value as ProductActivityStatusFilter }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Actividad" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.saleStatus} onValueChange={(value) => setFilters((current) => ({ ...current, saleStatus: value as ProductSaleStatusFilter }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Venta" />
                </SelectTrigger>
                <SelectContent>
                  {SALE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.sort} onValueChange={(value) => setFilters((current) => ({ ...current, sort: value as ProductSortOption }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-background/80">
                  {catalog.items.length} producto{catalog.items.length === 1 ? "" : "s"} cargado{catalog.items.length === 1 ? "" : "s"}
                </Badge>
                {selectedIds.length > 0 ? (
                  <Badge variant="outline" className="bg-background/80">
                    {selectedIds.length} seleccionado{selectedIds.length === 1 ? "" : "s"}
                  </Badge>
                ) : null}
                {activeFilterCount > 0 ? (
                  <Badge variant="outline" className="bg-background/80">
                    {activeFilterCount} filtro{activeFilterCount === 1 ? "" : "s"} activo{activeFilterCount === 1 ? "" : "s"}
                  </Badge>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" disabled={selectedIds.length === 0} onClick={() => setIsDeactivateDialogOpen(true)}>
                  Desactivar seleccionados
                </Button>
                <Button type="button" variant="outline" onClick={resetFilters}>
                  <X className="size-4" />
                  Limpiar
                </Button>
                <Button type="button" onClick={applyFilters} disabled={isPending}>
                  {isPending ? "Actualizando..." : "Aplicar filtros"}
                </Button>
              </div>
            </div>
          </div>

          {isPending ? (
            <ProductsTableSkeleton />
          ) : catalog.items.length > 0 ? (
            <>
              <ProductsTable
                items={catalog.items}
                activeProductId={activeProductId}
                onOpenDetail={syncProductQuery}
                selectedIds={selectedIds}
                onToggleSelection={toggleSelection}
                onToggleAll={toggleAllVisible}
              />

              <div className="flex justify-center pt-2">
                <Button type="button" variant="outline" onClick={() => void handleLoadMore()} disabled={!catalog.pageInfo.hasMore || isLoadingMore}>
                  {isLoadingMore ? "Cargando más..." : catalog.pageInfo.hasMore ? "Cargar más" : "No hay más productos"}
                </Button>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-14 text-center">
              <p className="text-lg font-medium text-foreground">No hay productos para mostrar</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Ajusta los filtros o carga nuevos productos desde el flujo de incorporación.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <ProductDetailSheet
        productId={activeProductId}
        open={Boolean(activeProductId)}
        onProductChanged={refreshCatalogWithCurrentFilters}
        onOpenChange={(open) => {
          if (!open) {
            syncProductQuery(null)
          }
        }}
      />

      <DeactivateProductsDialog
        open={isDeactivateDialogOpen}
        selectedCount={selectedIds.length}
        isSubmitting={isDeactivating}
        onOpenChange={setIsDeactivateDialogOpen}
        onConfirm={() => {
          void handleDeactivateSelected()
        }}
      />
    </div>
  )
}
