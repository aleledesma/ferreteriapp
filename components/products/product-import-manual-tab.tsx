"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { ManualProductUpdateDialog } from "@/components/products/manual-product-update-dialog"
import { SupplierFormSheet } from "@/components/suppliers/supplier-form-sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useSuppliers } from "@/lib/hooks/use-suppliers"
import type {
  CreateManualSupplierPriceListInput,
  ManualExistingProductConflict,
  ManualProductInput,
  ManualProductResult,
  ManualSupplierPriceListItem,
} from "@/lib/products/manual-product-types"
import type { SupplierListItem } from "@/lib/suppliers/types"

type PriceListMode = "existing" | "new"

type ManualProductDraft = {
  supplierProductCode: string
  name: string
  description: string
  brand: string
  categoryCode: string
  categoryName: string
  barcode: string
  costPrice: string
  salePrice: string
  initialStock: string
  minStock: string
  listPrice: string
  offerPrice: string
  vatRate: string
  isActive: boolean
  isForSale: boolean
}

const EMPTY_PRICE_LISTS: ManualSupplierPriceListItem[] = []

function createEmptyDraft(): ManualProductDraft {
  return {
    supplierProductCode: "",
    name: "",
    description: "",
    brand: "",
    categoryCode: "",
    categoryName: "",
    barcode: "",
    costPrice: "0",
    salePrice: "0",
    initialStock: "",
    minStock: "0",
    listPrice: "",
    offerPrice: "",
    vatRate: "",
    isActive: true,
    isForSale: true,
  }
}

function parseOptionalNumber(value: string) {
  const normalized = value.trim()
  if (normalized.length === 0) return null
  return Number(normalized)
}


function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70">
      {children}
    </p>
  )
}

function buildManualProductPayload(
  priceListId: string,
  product: ManualProductDraft,
  confirmUpdates: boolean,
): ManualProductInput {
  return {
    priceListId,
    confirmUpdates,
    product: {
      supplierProductCode: product.supplierProductCode.trim(),
      name: product.name.trim(),
      description: product.description.trim() || null,
      brand: product.brand.trim() || null,
      categoryCode: product.categoryCode.trim() || null,
      categoryName: product.categoryName.trim() || null,
      barcode: product.barcode.trim() || null,
      costPrice: Number(product.costPrice),
      salePrice: Number(product.salePrice),
      initialStock: product.initialStock.trim() === "" ? null : Number(product.initialStock),
      minStock: Number(product.minStock),
      listPrice: parseOptionalNumber(product.listPrice),
      offerPrice: parseOptionalNumber(product.offerPrice),
      vatRate: parseOptionalNumber(product.vatRate),
      isActive: product.isActive,
      isForSale: product.isForSale,
    },
  }
}

export function ProductImportManualTab() {
  const { suppliers, setSuppliers, isLoading, error, refetch } = useSuppliers({
    pageSize: 100,
  })
  const [selectedSupplierId, setSelectedSupplierId] = useState("")
  const [priceListMode, setPriceListMode] = useState<PriceListMode>("existing")
  const [priceLists, setPriceLists] = useState<ManualSupplierPriceListItem[]>(EMPTY_PRICE_LISTS)
  const [isLoadingPriceLists, setIsLoadingPriceLists] = useState(false)
  const [selectedPriceListId, setSelectedPriceListId] = useState("")
  const [newPriceListName, setNewPriceListName] = useState("")
  const [product, setProduct] = useState<ManualProductDraft>(createEmptyDraft())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSupplierSheetOpen, setIsSupplierSheetOpen] = useState(false)
  const [conflict, setConflict] = useState<ManualExistingProductConflict | null>(null)
  const [isConflictOpen, setIsConflictOpen] = useState(false)
  const [pendingPriceListId, setPendingPriceListId] = useState<string | null>(null)

  const availablePriceLists = useMemo(
    () =>
      priceLists.filter(
        (priceList) =>
          priceList.sourceType === "MANUAL" && priceList.status === "DRAFT",
      ),
    [priceLists],
  )

  useEffect(() => {
    if (!error) return

    toast.error("No se pudo cargar proveedores", {
      id: "manual-product-suppliers-error",
      description: error,
    })
  }, [error])

  useEffect(() => {
    async function loadPriceLists() {
      if (!selectedSupplierId) {
        setPriceLists(EMPTY_PRICE_LISTS)
        setSelectedPriceListId("")
        return
      }

      setIsLoadingPriceLists(true)

      try {
        const response = await fetch(`/api/suppliers/${selectedSupplierId}/price-lists`)
        const payload = (await response.json()) as {
          items?: ManualSupplierPriceListItem[]
          error?: string
        }

        if (!response.ok) {
          throw new Error(payload.error || "No se pudieron cargar las listas de precios.")
        }

        setPriceLists(payload.items ?? EMPTY_PRICE_LISTS)
      } catch (loadError) {
        toast.error("No se pudieron cargar las listas", {
          id: "manual-price-lists-error",
          description:
            loadError instanceof Error
              ? loadError.message
              : "No se pudieron cargar las listas del proveedor seleccionado.",
        })
        setPriceLists(EMPTY_PRICE_LISTS)
      } finally {
        setIsLoadingPriceLists(false)
      }
    }

    void loadPriceLists()
  }, [selectedSupplierId])

  useEffect(() => {
    if (priceListMode === "new") {
      setSelectedPriceListId("")
    }
  }, [priceListMode])

  function updateProductField<K extends keyof ManualProductDraft>(
    field: K,
    value: ManualProductDraft[K],
  ) {
    setProduct((current) => ({ ...current, [field]: value }))
  }

  async function ensureManualPriceList() {
    if (priceListMode === "existing") {
      if (!selectedPriceListId) {
        throw new Error("Selecciona una lista de precios existente.")
      }
      return selectedPriceListId
    }

    if (!selectedSupplierId) {
      throw new Error("Selecciona un proveedor antes de crear la lista manual.")
    }

    if (!newPriceListName.trim()) {
      throw new Error("El nombre de la nueva lista es obligatorio.")
    }

    const payload: CreateManualSupplierPriceListInput = {
      name: newPriceListName.trim(),
    }

    const response = await fetch(`/api/suppliers/${selectedSupplierId}/price-lists`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })

    const body = (await response.json()) as {
      error?: string
      priceList?: ManualSupplierPriceListItem
    }

    if (!response.ok || !body.priceList) {
      throw new Error(body.error || "No se pudo crear la lista de precios manual.")
    }

    setPriceLists((current) => [body.priceList!, ...current])
    setSelectedPriceListId(body.priceList.id)
    setPriceListMode("existing")
    setNewPriceListName("")

    return body.priceList.id
  }

  async function submitProduct(confirmUpdates: boolean, fixedPriceListId?: string) {
    if (!selectedSupplierId) {
      throw new Error("Selecciona un proveedor para la carga manual.")
    }

    const priceListId = fixedPriceListId ?? (await ensureManualPriceList())
    setPendingPriceListId(priceListId)

    const response = await fetch("/api/products/manual", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildManualProductPayload(priceListId, product, confirmUpdates)),
    })

    const payload = (await response.json()) as {
      error?: string
      result?: ManualProductResult
      code?: string
      conflicts?: ManualExistingProductConflict[]
    }

    if (
      response.status === 409 &&
      payload.code === "MANUAL_PRODUCT_CONFLICT" &&
      payload.conflicts?.[0]
    ) {
      setConflict(payload.conflicts[0])
      setIsConflictOpen(true)
      return null
    }

    if (!response.ok || !payload.result) {
      throw new Error(payload.error || "No se pudo guardar el producto manualmente.")
    }

    return payload.result
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    const toastId = toast.loading("Guardando producto...")

    try {
      const result = await submitProduct(false)
      if (!result) {
        toast.dismiss(toastId)
        return
      }

      toast.success(result.updatedExistingProduct ? "Producto actualizado" : "Producto creado", {
        id: toastId,
        description: result.updatedExistingProduct
          ? "El producto se actualizó correctamente."
          : "El producto se creó correctamente.",
      })
      setProduct(createEmptyDraft())
      setPendingPriceListId(null)
    } catch (submitError) {
      toast.error("No se pudo guardar el producto", {
        id: toastId,
        description:
          submitError instanceof Error
            ? submitError.message
            : "Ocurrió un error inesperado al guardar el producto.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleConfirmConflictUpdate() {
    if (!pendingPriceListId) {
      setIsConflictOpen(false)
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading("Actualizando producto existente...")

    try {
      const result = await submitProduct(true, pendingPriceListId)
      if (!result) {
        toast.dismiss(toastId)
        return
      }

      setIsConflictOpen(false)
      setConflict(null)
      toast.success("Producto actualizado", {
        id: toastId,
        description: "Se actualizó el producto existente y se sumó el stock indicado.",
      })
      setProduct(createEmptyDraft())
      setPendingPriceListId(null)
    } catch (confirmError) {
      toast.error("No se pudo confirmar la actualización", {
        id: toastId,
        description:
          confirmError instanceof Error
            ? confirmError.message
            : "Ocurrió un error inesperado al actualizar el producto.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="mx-auto w-full max-w-5xl">
        {/* Contexto */}
        <div className="overflow-hidden rounded-t-2xl border border-border/60 bg-background/90 shadow-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
          <div className="border-b border-border/50 px-6 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Contexto
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Selecciona el proveedor y la lista de precios antes de completar el producto.
            </p>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 xl:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="manual-supplier">Proveedor</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSupplierSheetOpen(true)}
                  className="h-auto py-0 text-xs text-primary"
                >
                  <Plus className="size-3" />
                  Crear proveedor
                </Button>
              </div>
              {isLoading ? (
                <Skeleton className="h-10 w-full rounded-xl" />
              ) : (
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger id="manual-supplier" className="w-full bg-background">
                    <SelectValue placeholder="Selecciona un proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers
                      .filter((supplier) => supplier.isActive)
                      .map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-price-list-mode">Lista de precios</Label>
              <Select
                value={priceListMode}
                onValueChange={(value) => setPriceListMode(value as PriceListMode)}
              >
                <SelectTrigger id="manual-price-list-mode" className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="existing">Usar lista existente</SelectItem>
                  <SelectItem value="new">Crear lista manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {priceListMode === "existing" ? (
              <div className="space-y-2">
                <Label htmlFor="manual-price-list-existing">Lista disponible</Label>
                {isLoadingPriceLists ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <Select value={selectedPriceListId} onValueChange={setSelectedPriceListId}>
                    <SelectTrigger id="manual-price-list-existing" className="w-full bg-background">
                      <SelectValue placeholder="Selecciona una lista" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePriceLists.map((priceList) => (
                        <SelectItem key={priceList.id} value={priceList.id}>
                          {priceList.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="manual-price-list-name">Nombre de la nueva lista</Label>
                <Input
                  id="manual-price-list-name"
                  value={newPriceListName}
                  onChange={(event) => setNewPriceListName(event.target.value)}
                  placeholder="Ej. Lista manual abril"
                />
              </div>
            )}
          </div>
        </div>

        {/* Producto */}
        <div className="overflow-hidden rounded-b-2xl border border-t-0 border-border/60 bg-background/90 shadow-sm">
          <div className="border-b border-border/50 px-6 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Producto
            </p>
          </div>

          <div className="divide-y divide-border/40">
            {/* Identificación */}
            <div className="p-6">
              <SectionLabel>Identificación</SectionLabel>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="product-code">Código del proveedor</Label>
                  <Input
                    id="product-code"
                    value={product.supplierProductCode}
                    onChange={(event) => updateProductField("supplierProductCode", event.target.value)}
                    placeholder="Ej. A-100"
                  />
                </div>
                <div className="space-y-2 md:col-span-1 xl:col-span-3">
                  <Label htmlFor="product-name">Nombre</Label>
                  <Input
                    id="product-name"
                    value={product.name}
                    onChange={(event) => updateProductField("name", event.target.value)}
                    placeholder="Nombre del producto"
                  />
                </div>
                <div className="space-y-2 md:col-span-2 xl:col-span-4">
                  <Label htmlFor="product-description">Descripción</Label>
                  <Textarea
                    id="product-description"
                    value={product.description}
                    onChange={(event) => updateProductField("description", event.target.value)}
                    placeholder="Descripción técnica o comercial"
                    className="resize-none"
                    rows={2}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="product-barcode">Código de barras</Label>
                  <Input
                    id="product-barcode"
                    value={product.barcode}
                    onChange={(event) => updateProductField("barcode", event.target.value)}
                    placeholder="EAN / código de barras"
                  />
                </div>
              </div>
            </div>

            {/* Clasificación */}
            <div className="p-6">
              <SectionLabel>Clasificación</SectionLabel>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="product-brand">Marca</Label>
                  <Input
                    id="product-brand"
                    value={product.brand}
                    onChange={(event) => updateProductField("brand", event.target.value)}
                    placeholder="Marca"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-category-code">Código categoría</Label>
                  <Input
                    id="product-category-code"
                    value={product.categoryCode}
                    onChange={(event) => updateProductField("categoryCode", event.target.value)}
                    placeholder="Ej. CEO-272"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="product-category-name">Categoría</Label>
                  <Input
                    id="product-category-name"
                    value={product.categoryName}
                    onChange={(event) => updateProductField("categoryName", event.target.value)}
                    placeholder="Nombre de la categoría"
                  />
                </div>
              </div>
            </div>

            {/* Precios */}
            <div className="p-6">
              <SectionLabel>Precios</SectionLabel>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="space-y-2">
                  <Label htmlFor="product-cost">Costo</Label>
                  <Input
                    id="product-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={product.costPrice}
                    onChange={(event) => updateProductField("costPrice", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-sale">Venta</Label>
                  <Input
                    id="product-sale"
                    type="number"
                    min="0"
                    step="0.01"
                    value={product.salePrice}
                    onChange={(event) => updateProductField("salePrice", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-list-price">
                    Lista <span className="text-muted-foreground/60">(opc.)</span>
                  </Label>
                  <Input
                    id="product-list-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={product.listPrice}
                    onChange={(event) => updateProductField("listPrice", event.target.value)}
                    placeholder="—"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-offer-price">
                    Oferta <span className="text-muted-foreground/60">(opc.)</span>
                  </Label>
                  <Input
                    id="product-offer-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={product.offerPrice}
                    onChange={(event) => updateProductField("offerPrice", event.target.value)}
                    placeholder="—"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-vat">
                    IVA % <span className="text-muted-foreground/60">(opc.)</span>
                  </Label>
                  <Input
                    id="product-vat"
                    type="number"
                    min="0"
                    step="0.01"
                    value={product.vatRate}
                    onChange={(event) => updateProductField("vatRate", event.target.value)}
                    placeholder="—"
                  />
                </div>
              </div>
            </div>

            {/* Inventario */}
            <div className="p-6">
              <SectionLabel>Inventario</SectionLabel>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="product-stock">
                    Stock inicial{" "}
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  </Label>
                  <Input
                    id="product-stock"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Dejar vacío = sin controlar"
                    value={product.initialStock}
                    onChange={(event) => updateProductField("initialStock", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-min-stock">Stock mínimo</Label>
                  <Input
                    id="product-min-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={product.minStock}
                    onChange={(event) => updateProductField("minStock", event.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Configuración */}
            <div className="p-6">
              <SectionLabel>Configuración</SectionLabel>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/80 px-4 py-3.5 transition-colors hover:bg-muted/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">Producto activo</p>
                    <p className="text-xs text-muted-foreground">Visible en el sistema y disponible para operar</p>
                  </div>
                  <Switch
                    checked={product.isActive}
                    onCheckedChange={(checked) => updateProductField("isActive", checked)}
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/80 px-4 py-3.5 transition-colors hover:bg-muted/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">Disponible para la venta</p>
                    <p className="text-xs text-muted-foreground">Se muestra en el punto de venta y puede incluirse en pedidos</p>
                  </div>
                  <Switch
                    checked={product.isForSale}
                    onCheckedChange={(checked) => updateProductField("isForSale", checked)}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/50 px-6 py-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setProduct(createEmptyDraft())}
              disabled={isSubmitting}
            >
              Limpiar formulario
            </Button>
            <Button
              type="button"
              className="min-w-44"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {isSubmitting ? "Guardando..." : "Guardar producto"}
            </Button>
          </div>
        </div>
      </div>

      <SupplierFormSheet
        open={isSupplierSheetOpen}
        supplier={null}
        onOpenChange={setIsSupplierSheetOpen}
        onSaved={async (supplier: SupplierListItem) => {
          setSuppliers((current) => {
            const next = [...current, supplier]
            return next.sort((a, b) => a.name.localeCompare(b.name, "es"))
          })
          setSelectedSupplierId(supplier.id)
          toast.success("Proveedor creado", {
            description: `Proveedor ${supplier.name} creado correctamente.`,
          })
          await refetch()
        }}
      />

      <ManualProductUpdateDialog
        open={isConflictOpen}
        conflict={conflict}
        isSubmitting={isSubmitting}
        onOpenChange={setIsConflictOpen}
        onConfirm={() => {
          void handleConfirmConflictUpdate()
        }}
      />
    </>
  )
}
