import { ArrowUpRight, Barcode, Eye, PackageMinus, PackageSearch } from "lucide-react"

import type { ProductListItemDto } from "@/lib/products/catalog-types"
import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type ProductsTableProps = {
  items: ProductListItemDto[]
  activeProductId?: string | null
  onOpenDetail: (productId: string) => void
  selectedIds: string[]
  onToggleSelection: (productId: string, checked: boolean) => void
  onToggleAll: (checked: boolean) => void
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(Number(value))
}

function getStockBadgeClasses(stockStatus: ProductListItemDto["inventory"]["stockStatus"]) {
  switch (stockStatus) {
    case "sin_stock":
      return "border-destructive/20 bg-destructive/8 text-destructive"
    case "stock_bajo":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700"
    case "stock_normal":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
  }
}

function getStockLabel(stockStatus: ProductListItemDto["inventory"]["stockStatus"]) {
  switch (stockStatus) {
    case "sin_stock":
      return "Sin stock"
    case "stock_bajo":
      return "Stock bajo"
    case "stock_normal":
      return "Stock normal"
  }
}

export function ProductsTable({ items, activeProductId, onOpenDetail, selectedIds, onToggleSelection, onToggleAll }: ProductsTableProps) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id))

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:hidden">
        {items.map((product) => {
          const isSelected = selectedIds.includes(product.id)

          return (
            <div
              key={product.id}
              className={cn(
                "rounded-2xl border border-border/60 bg-background/90 p-4 shadow-sm transition-colors",
                isSelected && "border-primary/30 bg-primary/5",
                activeProductId === product.id && "ring-1 ring-primary/20",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-semibold text-foreground">{product.name}</p>
                  <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <PackageSearch className="size-3.5" />
                      {product.supplierProductCode}
                    </span>
                    {product.barcode ? (
                      <span className="inline-flex items-center gap-1">
                        <Barcode className="size-3.5" />
                        {product.barcode}
                      </span>
                    ) : null}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(event) => onToggleSelection(product.id, event.target.checked)}
                  aria-label={`Seleccionar ${product.name}`}
                  className="mt-1 size-4 rounded border-border"
                />
              </div>

              <div className="mt-3 grid gap-3 rounded-xl border border-border/50 bg-muted/10 p-3 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Proveedor</p>
                  <p className="mt-1 truncate text-sm font-medium text-foreground">{product.supplier.name}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Precio venta</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{formatCurrency(product.pricing.salePrice)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Stock</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{product.inventory.stock}</p>
                  <p className="text-xs text-muted-foreground">Mínimo {product.inventory.minStock}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Estado</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge variant="outline" className={getStockBadgeClasses(product.inventory.stockStatus)}>
                      {product.inventory.stockStatus === "sin_stock" ? <PackageMinus className="size-3.5" /> : null}
                      {getStockLabel(product.inventory.stockStatus)}
                    </Badge>
                    <Badge variant={product.flags.isActive ? "secondary" : "outline"}>
                      {product.flags.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {product.brand ? <Badge variant="outline">{product.brand}</Badge> : null}
                {product.categoryName ? <Badge variant="outline">{product.categoryName}</Badge> : null}
                <Badge variant={product.flags.isForSale ? "secondary" : "outline"}>
                  {product.flags.isForSale ? "En venta" : "No en venta"}
                </Badge>
              </div>

              <div className="mt-4 flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => onOpenDetail(product.id)}>
                  <Eye className="size-4" />
                  Ver detalle
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-border/60 bg-background/85 shadow-sm lg:block">
      <Table className="table-fixed min-w-[1080px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 px-4 py-4">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(event) => onToggleAll(event.target.checked)}
                aria-label="Seleccionar productos visibles"
                className="size-4 rounded border-border"
              />
            </TableHead>
            <TableHead className="px-4 py-4">Producto</TableHead>
            <TableHead className="px-4 py-4">Proveedor</TableHead>
            <TableHead className="px-4 py-4">Precio</TableHead>
            <TableHead className="px-4 py-4">Stock</TableHead>
            <TableHead className="px-4 py-4">Estado</TableHead>
            <TableHead className="px-4 py-4 text-right">Detalle</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((product) => {
            const isActiveRow = activeProductId === product.id
            const isSelected = selectedIds.includes(product.id)

            return (
              <TableRow
                key={product.id}
                data-selected={isSelected ? "true" : undefined}
                className={cn(
                  "transition-colors hover:bg-muted/30 data-[selected=true]:bg-primary/5",
                  isActiveRow && "bg-primary/5",
                )}
              >
                <TableCell className="px-4 py-4 align-top">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(event) => onToggleSelection(product.id, event.target.checked)}
                    aria-label={`Seleccionar ${product.name}`}
                    className="size-4 rounded border-border"
                  />
                </TableCell>
                <TableCell className="w-[33%] px-4 py-4 align-top whitespace-normal">
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <p className="line-clamp-2 break-words font-medium leading-tight text-foreground">{product.name}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <PackageSearch className="size-3.5" />
                          {product.supplierProductCode}
                        </span>
                        {product.barcode ? (
                          <span className="inline-flex items-center gap-1">
                            <Barcode className="size-3.5" />
                            {product.barcode}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {product.brand ? <Badge variant="outline">{product.brand}</Badge> : null}
                      {product.categoryName ? <Badge variant="outline">{product.categoryName}</Badge> : null}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="w-[18%] px-4 py-4 align-top whitespace-normal">
                  <div className="space-y-1 min-w-0">
                    <p className="truncate font-medium text-foreground" title={product.supplier.name}>{product.supplier.name}</p>
                    <p className="text-sm text-muted-foreground">Actualizado {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(product.updatedAt))}</p>
                  </div>
                </TableCell>

                <TableCell className="w-[14%] px-4 py-4 align-top whitespace-normal">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{formatCurrency(product.pricing.salePrice)}</p>
                    <p className="text-sm text-muted-foreground">Costo {formatCurrency(product.pricing.costPrice)}</p>
                  </div>
                </TableCell>

                <TableCell className="w-[10%] px-4 py-4 align-top whitespace-normal">
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-foreground">{product.inventory.stock}</p>
                    <p className="text-xs text-muted-foreground">Mínimo {product.inventory.minStock}</p>
                  </div>
                </TableCell>

                <TableCell className="w-[17%] px-4 py-4 align-top whitespace-normal">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={getStockBadgeClasses(product.inventory.stockStatus)}>
                      {product.inventory.stockStatus === "sin_stock" ? <PackageMinus className="size-3.5" /> : null}
                      {getStockLabel(product.inventory.stockStatus)}
                    </Badge>
                    <Badge variant={product.flags.isActive ? "secondary" : "outline"}>
                      {product.flags.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                    <Badge variant={product.flags.isForSale ? "secondary" : "outline"}>
                      {product.flags.isForSale ? "En venta" : "No en venta"}
                    </Badge>
                  </div>
                </TableCell>

                <TableCell className="w-[12%] px-4 py-4 text-right align-top whitespace-normal">
                  <Button type="button" variant="outline" size="sm" onClick={() => onOpenDetail(product.id)}>
                    <Eye className="size-4" />
                    <span className="hidden xl:inline">Ver detalle</span>
                    <ArrowUpRight className="size-4 opacity-60 xl:hidden" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      </div>
    </div>
  )
}
