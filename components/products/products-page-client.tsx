"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { CheckCheck, ChevronDown, ChevronUp, Loader2, Search, SlidersHorizontal, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import type {
  DeactivateProductsResponse,
  ProductActivityStatusFilter,
  ProductCatalogKpisResponse,
  ProductCatalogSupplierOption,
  ProductListResponse,
  RestoreProductsResponse,
  ProductSaleStatusFilter,
  ProductSortOption,
  ProductStockStatus,
} from "@/lib/products/catalog-types"
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"

import { ProductDetailSheet } from "@/components/products/product-detail-sheet"
import { DeactivateProductsDialog } from "@/components/products/deactivate-products-dialog"
import { ProductsKpiStrip } from "@/components/products/products-kpi-strip"
import { ProductsTable } from "@/components/products/products-table"
import { ProductsTableSkeleton } from "@/components/products/products-table-skeleton"
import { Button } from "@/components/ui/button"
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

async function fetchKpis() {
  const response = await fetch("/api/products/kpis")
  const payload = (await response.json()) as ProductCatalogKpisResponse & { error?: string }

  if (!response.ok) {
    throw new Error(payload.error || "No se pudieron cargar los KPIs del catálogo.")
  }

  return payload
}

export function ProductsPageClient({ initialCatalog, initialKpis, supplierOptions }: ProductsPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [catalog, setCatalog] = useState(initialCatalog)
  const [kpis, setKpis] = useState(initialKpis)
  const [filters, setFilters] = useState(() => buildInitialFilters(initialCatalog.appliedFilters))
  const [isPending, startTransition] = useTransition()
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [lastDeletedBatch, setLastDeletedBatch] = useState<{
    productIds: string[]
    expiresAt: string
  } | null>(null)
  const hasMountedRef = useRef(false)

  const activeProductId = searchParams.get("product")
  const debouncedSearch = useDebouncedValue(filters.search, 250)
  const debouncedCategory = useDebouncedValue(filters.category, 250)
  const debouncedBrand = useDebouncedValue(filters.brand, 250)

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

  const defaultFilters = useMemo(
    () => ({
      search: "",
      supplierId: "all",
      category: "",
      brand: "",
      stockStatus: "all",
      activityStatus: "active" as ProductActivityStatusFilter,
      saleStatus: "all" as ProductSaleStatusFilter,
      sort: "critical_stock" as ProductSortOption,
    }),
    [],
  )

  const selectedVisibleCount = useMemo(
    () => catalog.items.filter((item) => selectedIds.includes(item.id)).length,
    [catalog.items, selectedIds],
  )

  const effectiveFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
      category: debouncedCategory,
      brand: debouncedBrand,
    }),
    [filters, debouncedBrand, debouncedCategory, debouncedSearch],
  )

  const buildParamsFromFilters = useCallback((nextFilters: typeof filters) => {
    const params = new URLSearchParams()

    if (nextFilters.search.trim()) params.set("search", nextFilters.search.trim())
    if (nextFilters.supplierId !== "all") params.set("supplierId", nextFilters.supplierId)
    if (nextFilters.category.trim()) params.set("category", nextFilters.category.trim())
    if (nextFilters.brand.trim()) params.set("brand", nextFilters.brand.trim())
    if (nextFilters.stockStatus !== "all") params.set("stockStatus", nextFilters.stockStatus)
    if (nextFilters.activityStatus !== "active") params.set("activityStatus", nextFilters.activityStatus)
    if (nextFilters.saleStatus !== "all") params.set("saleStatus", nextFilters.saleStatus)
    if (nextFilters.sort !== "critical_stock") params.set("sort", nextFilters.sort)
    params.set("limit", "100")

    return params
  }, [])

  const buildBaseParams = useCallback(() => {
    return buildParamsFromFilters(effectiveFilters)
  }, [buildParamsFromFilters, effectiveFilters])

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
    setFilters(defaultFilters)
    setSelectedIds([])
  }

  function clearSelection() {
    setSelectedIds([])
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

  const refreshCatalogWithCurrentFilters = useCallback(async () => {
    const params = buildBaseParams()
    const nextCatalog = await fetchCatalog(params)
    setCatalog(nextCatalog)
    setSelectedIds([])

    try {
      const nextKpis = await fetchKpis()
      setKpis(nextKpis)
    } catch {
      // Keep the previous KPI snapshot if this auxiliary refresh fails.
    }
  }, [buildBaseParams])

  async function handleDeactivateSelected() {
    if (selectedIds.length === 0) {
      return
    }

    setIsDeactivating(true)

    try {
      const response = await fetch("/api/products/delete", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ productIds: selectedIds }),
      })

      const payload = (await response.json()) as DeactivateProductsResponse & { error?: string }

      if (!response.ok) {
        throw new Error(payload.error || "No se pudieron eliminar los productos.")
      }

      await refreshCatalogWithCurrentFilters()
      setIsDeactivateDialogOpen(false)
      const batch = {
        productIds: [...selectedIds],
        expiresAt: payload.expiresAt,
      }
      setLastDeletedBatch(batch)
      toast.success("Productos eliminados", {
        description: `${payload.processedCount} producto${payload.processedCount === 1 ? "" : "s"} eliminado${payload.processedCount === 1 ? "" : "s"}.`,
        action: {
          label: "Deshacer",
          onClick: () => {
            void restoreDeletedProducts(batch.productIds)
          },
        },
      })
    } catch (error) {
      toast.error("No se pudieron eliminar los productos", {
        description: error instanceof Error ? error.message : "Inténtalo nuevamente.",
      })
    } finally {
      setIsDeactivating(false)
    }
  }

  const restoreDeletedProducts = useCallback(async (productIds: string[]) => {
    if (productIds.length === 0) {
      return
    }

    try {
      const response = await fetch("/api/products/restore", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ productIds }),
      })

      const payload = (await response.json()) as RestoreProductsResponse & { error?: string }

      if (!response.ok) {
        throw new Error(payload.error || "No se pudieron restaurar los productos.")
      }

      await refreshCatalogWithCurrentFilters()
      setLastDeletedBatch(null)
      toast.success("Eliminación revertida", {
        description: `${payload.processedCount} producto${payload.processedCount === 1 ? "" : "s"} restaurado${payload.processedCount === 1 ? "" : "s"}.`,
      })
    } catch (error) {
      toast.error("No se pudo revertir la eliminación", {
        description: error instanceof Error ? error.message : "Inténtalo nuevamente.",
      })
    }
  }, [refreshCatalogWithCurrentFilters])

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    startTransition(async () => {
      try {
        const params = buildParamsFromFilters(effectiveFilters)
        const nextCatalog = await fetchCatalog(params)
        setCatalog(nextCatalog)
        setSelectedIds([])
      } catch (error) {
        toast.error("No se pudo actualizar el catálogo", {
          description: error instanceof Error ? error.message : "Inténtalo nuevamente.",
        })
      }
    })
  }, [buildParamsFromFilters, effectiveFilters, startTransition])

  useEffect(() => {
    const nextRouteParams = buildParamsFromFilters(effectiveFilters)

    if (activeProductId) {
      nextRouteParams.set("product", activeProductId)
    }

    router.replace(`/products?${nextRouteParams.toString()}`, { scroll: false })
  }, [activeProductId, buildParamsFromFilters, effectiveFilters, router])

  useEffect(() => {
    function handleUndo(event: KeyboardEvent) {
      const isUndoShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z"
      if (!isUndoShortcut || !lastDeletedBatch) {
        return
      }

      const target = event.target as HTMLElement | null
      if (target) {
        const tagName = target.tagName.toLowerCase()
        const isEditable =
          target.isContentEditable ||
          tagName === "input" ||
          tagName === "textarea" ||
          tagName === "select"

        if (isEditable) {
          return
        }
      }

      event.preventDefault()
      void restoreDeletedProducts(lastDeletedBatch.productIds)
    }

    window.addEventListener("keydown", handleUndo)
    return () => window.removeEventListener("keydown", handleUndo)
  }, [lastDeletedBatch, restoreDeletedProducts])

  return (
    <div className="space-y-8 animate-in fade-in-0 slide-in-from-top-2 duration-500">
      {/* Page header */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Inventario · Catálogo operativo
        </p>
        <h1 className="text-4xl font-bold leading-none tracking-tight text-foreground md:text-[2.75rem]">
          Productos
        </h1>
        <p className="max-w-[46rem] pt-0.5 text-sm leading-relaxed text-muted-foreground">
          Supervisá el inventario real, priorizá faltantes y mantené a mano la información clave de cada producto sin salir del flujo del catálogo.
        </p>
      </div>

      {/* KPI strip */}
      <ProductsKpiStrip kpis={kpis} />

      {/* Filter + table workspace */}
      <div className="space-y-4">
        {/* Filter bar */}
        <div className="overflow-hidden rounded-xl border border-border/60 bg-background/80 shadow-sm backdrop-blur-sm">
          <div className="p-4">
            {/* Primary row */}
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={filters.search}
                  onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                  placeholder="Buscar por nombre, código, marca o proveedor…"
                  className="h-9 pl-9"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 shrink-0 gap-2"
                onClick={() => setFiltersExpanded((v) => !v)}
              >
                <SlidersHorizontal className="size-3.5" />
                <span className="hidden sm:inline">Filtros</span>
                {activeFilterCount > 0 ? (
                  <span className="flex size-[18px] items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                    {activeFilterCount}
                  </span>
                ) : null}
                {filtersExpanded ? (
                  <ChevronUp className="size-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                )}
              </Button>

              <Select
                value={filters.sort}
                onValueChange={(value) => setFilters((current) => ({ ...current, sort: value as ProductSortOption }))}
              >
                <SelectTrigger className="h-9 w-[200px] shrink-0 text-sm">
                  <SelectValue placeholder="Ordenar por…" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {activeFilterCount > 0 || selectedIds.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label="Limpiar filtros y selección"
                  onClick={resetFilters}
                >
                  <X className="size-4" />
                </Button>
              ) : null}
            </div>

            {/* Expandable filters */}
            {filtersExpanded ? (
              <div className="mt-4 grid gap-2.5 border-t border-border/50 pt-4 sm:grid-cols-2 xl:grid-cols-3">
                <Select
                  value={filters.supplierId}
                  onValueChange={(value) => setFilters((current) => ({ ...current, supplierId: value }))}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Todos los proveedores" />
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

                <Input
                  value={filters.category}
                  onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
                  placeholder="Categoría"
                  className="h-9 text-sm"
                />

                <Input
                  value={filters.brand}
                  onChange={(event) => setFilters((current) => ({ ...current, brand: event.target.value }))}
                  placeholder="Marca"
                  className="h-9 text-sm"
                />

                <Select
                  value={filters.stockStatus}
                  onValueChange={(value) =>
                    setFilters((current) => ({ ...current, stockStatus: value as ProductStockStatus | "all" }))
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
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

                <Select
                  value={filters.activityStatus}
                  onValueChange={(value) =>
                    setFilters((current) => ({ ...current, activityStatus: value as ProductActivityStatusFilter }))
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
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

                <Select
                  value={filters.saleStatus}
                  onValueChange={(value) =>
                    setFilters((current) => ({ ...current, saleStatus: value as ProductSaleStatusFilter }))
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
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
              </div>
            ) : null}
          </div>

          {/* Status bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 bg-muted/10 px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>
                <span className="font-semibold tabular-nums text-foreground">{catalog.items.length}</span>{" "}
                producto{catalog.items.length !== 1 ? "s" : ""} cargado{catalog.items.length !== 1 ? "s" : ""}
              </span>
              {selectedIds.length > 0 ? (
                <span className="flex items-center gap-1.5">
                  <CheckCheck className="size-3.5 text-primary" />
                  <span className="font-semibold text-primary">
                    {selectedIds.length} seleccionado{selectedIds.length !== 1 ? "s" : ""}
                  </span>
                  {selectedVisibleCount !== selectedIds.length ? (
                    <span className="text-muted-foreground/70">
                      · {selectedVisibleCount} visible{selectedVisibleCount !== 1 ? "s" : ""}
                    </span>
                  ) : null}
                </span>
              ) : null}
              {isPending ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" />
                  Actualizando…
                </span>
              ) : null}
            </div>

            {selectedIds.length > 0 ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={clearSelection}
                >
                  Limpiar selección
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setIsDeactivateDialogOpen(true)}
                >
                  Eliminar seleccionados
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Accessibility live region */}
        <div aria-live="polite" className="sr-only">
          {catalog.items.length} productos visibles. {selectedIds.length} productos seleccionados.
        </div>

        {/* Table area */}
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

            <div className="flex flex-col items-center gap-1.5 py-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-5"
                onClick={() => void handleLoadMore()}
                disabled={!catalog.pageInfo.hasMore || isLoadingMore}
              >
                {isLoadingMore ? <Loader2 className="size-3.5 animate-spin" /> : null}
                {isLoadingMore
                  ? "Cargando…"
                  : catalog.pageInfo.hasMore
                    ? "Ver 100 más"
                    : "Todos los productos están cargados"}
              </Button>
              <p className="text-center text-[11px] text-muted-foreground/60">
                Lotes de hasta 100 productos por carga
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/5 px-6 py-16 text-center">
            <p className="text-base font-semibold text-foreground">
              {activeFilterCount > 0 ? "Sin resultados para estos filtros" : "El catálogo está vacío"}
            </p>
            <p className="mx-auto mt-2 max-w-[30rem] text-sm leading-relaxed text-muted-foreground">
              {activeFilterCount > 0
                ? "Ningún producto coincide con los filtros activos. Probá limpiarlos o ampliando los criterios."
                : "Cargá productos desde el flujo de incorporación para comenzar a poblar el catálogo."}
            </p>
            {activeFilterCount > 0 ? (
              <Button type="button" variant="outline" size="sm" className="mt-4" onClick={resetFilters}>
                Limpiar filtros
              </Button>
            ) : null}
          </div>
        )}
      </div>

      <ProductDetailSheet
        productId={activeProductId}
        open={Boolean(activeProductId)}
        onProductChanged={refreshCatalogWithCurrentFilters}
        onDeleteProduct={async (productId) => {
          const response = await fetch("/api/products/delete", {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({ productIds: [productId] }),
          })

          const payload = (await response.json()) as DeactivateProductsResponse & { error?: string }

          if (!response.ok) {
            throw new Error(payload.error || "No se pudo eliminar el producto.")
          }

          const batch = {
            productIds: [productId],
            expiresAt: payload.expiresAt,
          }

          setLastDeletedBatch(batch)
          syncProductQuery(null)
          await refreshCatalogWithCurrentFilters()
          toast.success("Producto eliminado", {
            description: "El producto fue eliminado.",
            action: {
              label: "Deshacer",
              onClick: () => {
                void restoreDeletedProducts(batch.productIds)
              },
            },
          })
        }}
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
