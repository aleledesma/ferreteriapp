import { ArrowUpRight, Barcode, PackageMinus, PackageSearch } from "lucide-react"

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
    case "sin_controlar":
      return "border-border/60 bg-muted/40 text-muted-foreground"
  }
}

function getStockLabel(stockStatus: ProductListItemDto["inventory"]["stockStatus"]) {
  switch (stockStatus) {
    case "sin_stock":
      return "Sin stock"
    case "stock_bajo":
      return "Stock bajo"
    case "stock_normal":
      return "Normal"
    case "sin_controlar":
      return "Sin controlar"
  }
}

function getStockNumberClass(stockStatus: ProductListItemDto["inventory"]["stockStatus"]) {
  switch (stockStatus) {
    case "sin_stock":
      return "text-destructive"
    case "stock_bajo":
      return "text-amber-600"
    case "stock_normal":
      return "text-foreground"
    case "sin_controlar":
      return "text-muted-foreground"
  }
}

export function ProductsTable({ items, activeProductId, onOpenDetail, selectedIds, onToggleSelection, onToggleAll }: ProductsTableProps) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id))

  return (
    <div className="space-y-4">
      {/* Mobile: card grid */}
      <div className="grid gap-3 lg:hidden">
        {items.map((product) => {
          const isSelected = selectedIds.includes(product.id)

          return (
            <div
              key={product.id}
              className={cn(
                "cursor-pointer rounded-xl border border-border/60 bg-background/90 p-4 shadow-sm transition-colors",
                "hover:bg-muted/20",
                product.inventory.stockStatus === "sin_stock" && !isSelected && "border-l-[3px] border-l-destructive bg-destructive/[0.02]",
                product.inventory.stockStatus === "stock_bajo" && !isSelected && "border-l-[3px] border-l-amber-500 bg-amber-500/[0.02]",
                isSelected && "border-primary/30 bg-primary/5",
                activeProductId === product.id && "ring-1 ring-primary/30",
              )}
              onClick={() => onOpenDetail(product.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate font-semibold text-foreground">{product.name}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <PackageSearch className="size-3" />
                      {product.supplierProductCode}
                    </span>
                    {product.barcode ? (
                      <span className="inline-flex items-center gap-1">
                        <Barcode className="size-3" />
                        {product.barcode}
                      </span>
                    ) : null}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(event) => onToggleSelection(product.id, event.target.checked)}
                  onClick={(event) => event.stopPropagation()}
                  aria-label={`Seleccionar ${product.name}`}
                  className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-border"
                />
              </div>

              <div className="mt-3 grid gap-3 rounded-lg border border-border/50 bg-muted/10 p-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Proveedor</p>
                  <p className="mt-0.5 truncate text-sm font-medium text-foreground">{product.supplier.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Precio venta</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{formatCurrency(product.pricing.salePrice)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Stock</p>
                  <p className={cn("mt-0.5 text-xl font-bold tabular-nums leading-none", getStockNumberClass(product.inventory.stockStatus))}>
                    {product.inventory.stock ?? "—"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">mín. {product.inventory.minStock}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Estado</p>
                    <div className="mt-1 space-y-1">
                      <Badge variant="outline" className={cn("text-[11px] font-medium", getStockBadgeClasses(product.inventory.stockStatus))}>
                        {product.inventory.stockStatus === "sin_stock" ? <PackageMinus className="size-3" /> : null}
                        {getStockLabel(product.inventory.stockStatus)}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className={cn("inline-block size-1.5 rounded-full", product.flags.isDeleted ? "bg-destructive" : product.flags.isActive ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                        {product.flags.isDeleted ? "Eliminado" : product.flags.isActive ? "Activo" : "Inactivo"}
                        {product.flags.isForSale && product.flags.isActive ? <span className="text-muted-foreground/60">· En venta</span> : null}
                      </div>
                    </div>
                  </div>
              </div>

              {product.brand || product.categoryName ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {product.brand ? (
                    <Badge variant="outline" className="h-[22px] px-2 text-[10px] font-normal">
                      {product.brand}
                    </Badge>
                  ) : null}
                  {product.categoryName ? (
                    <Badge variant="outline" className="h-[22px] px-2 text-[10px] font-normal">
                      {product.categoryName}
                    </Badge>
                  ) : null}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-xl border border-border/60 bg-background/85 shadow-sm lg:block">
        <Table className="table-fixed min-w-[1080px]">
          <TableHeader>
            <TableRow className="border-b border-border/60 bg-muted/20 hover:bg-muted/20">
              <TableHead className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(event) => onToggleAll(event.target.checked)}
                  aria-label="Seleccionar productos visibles"
                  className="size-4 rounded border-border"
                />
              </TableHead>
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Producto
              </TableHead>
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Proveedor
              </TableHead>
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Precio
              </TableHead>
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Stock
              </TableHead>
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Estado
              </TableHead>
              <TableHead className="w-12 px-3 py-3" />
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
                    "group cursor-pointer transition-colors hover:bg-muted/25",
                    product.inventory.stockStatus === "sin_stock" && !isSelected && "bg-destructive/[0.025] hover:bg-destructive/[0.04]",
                    product.inventory.stockStatus === "stock_bajo" && !isSelected && "bg-amber-500/[0.02] hover:bg-amber-500/[0.035]",
                    isSelected && "bg-primary/[0.06] hover:bg-primary/[0.08]",
                    isActiveRow && "!bg-primary/[0.07]",
                  )}
                  onClick={() => onOpenDetail(product.id)}
                >
                  <TableCell className="w-12 px-4 py-3 align-middle">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(event) => onToggleSelection(product.id, event.target.checked)}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Seleccionar ${product.name}`}
                      className="size-4 cursor-pointer rounded border-border"
                    />
                  </TableCell>

                  <TableCell className="w-[33%] px-4 py-3 align-middle whitespace-normal">
                    <div className="space-y-1">
                      <p className="line-clamp-2 break-words text-sm font-medium leading-snug text-foreground">
                        {product.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <PackageSearch className="size-3" />
                          {product.supplierProductCode}
                        </span>
                        {product.barcode ? (
                          <span className="inline-flex items-center gap-1">
                            <Barcode className="size-3" />
                            {product.barcode}
                          </span>
                        ) : null}
                      </div>
                      {product.brand || product.categoryName ? (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {product.brand ? (
                            <Badge variant="outline" className="h-[20px] px-1.5 text-[10px] font-normal">
                              {product.brand}
                            </Badge>
                          ) : null}
                          {product.categoryName ? (
                            <Badge variant="outline" className="h-[20px] px-1.5 text-[10px] font-normal">
                              {product.categoryName}
                            </Badge>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>

                  <TableCell className="w-[18%] px-4 py-3 align-middle whitespace-normal">
                    <p className="truncate text-sm font-medium text-foreground" title={product.supplier.name}>
                      {product.supplier.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(product.updatedAt))}
                    </p>
                  </TableCell>

                  <TableCell className="w-[14%] px-4 py-3 align-middle whitespace-normal">
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(product.pricing.salePrice)}
                    </p>
                    <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                      {formatCurrency(product.pricing.costPrice)}
                    </p>
                  </TableCell>

                  <TableCell className="w-[10%] px-4 py-3 align-middle whitespace-normal">
                    <p className={cn("text-xl font-bold tabular-nums leading-none", getStockNumberClass(product.inventory.stockStatus))}>
                      {product.inventory.stock ?? "—"}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">mín. {product.inventory.minStock}</p>
                  </TableCell>

                  <TableCell className="w-[15%] px-4 py-3 align-middle whitespace-normal">
                    <div className="space-y-1.5">
                      <Badge
                        variant="outline"
                        className={cn("w-fit text-[11px] font-medium", getStockBadgeClasses(product.inventory.stockStatus))}
                      >
                        {product.inventory.stockStatus === "sin_stock" ? <PackageMinus className="size-3" /> : null}
                        {getStockLabel(product.inventory.stockStatus)}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span
                          className={cn(
                            "inline-block size-1.5 rounded-full",
                            product.flags.isDeleted ? "bg-destructive" : product.flags.isActive ? "bg-emerald-500" : "bg-muted-foreground/40",
                          )}
                        />
                        {product.flags.isDeleted ? "Eliminado" : product.flags.isActive ? "Activo" : "Inactivo"}
                        {product.flags.isForSale && product.flags.isActive ? (
                          <span className="text-muted-foreground/60">· En venta</span>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="w-12 px-3 py-3 text-right align-middle">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground/40 opacity-0 transition-all hover:text-foreground group-hover:opacity-100"
                      onClick={(event) => {
                        event.stopPropagation()
                        onOpenDetail(product.id)
                      }}
                      aria-label={`Ver detalle de ${product.name}`}
                      tabIndex={-1}
                    >
                      <ArrowUpRight className="size-3.5" />
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
