import { PencilLine, RotateCcw, Trash2 } from "lucide-react"

import type { SupplierListItem } from "@/lib/suppliers/types"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type SuppliersTableProps = {
  items: SupplierListItem[]
  onEdit: (supplier: SupplierListItem) => void
  onDelete: (supplier: SupplierListItem) => void
  onReactivate: (supplier: SupplierListItem) => void
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
  }).format(new Date(value))
}

export function SuppliersTable({ items, onEdit, onDelete, onReactivate }: SuppliersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-background/85 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border/60 bg-muted/20 hover:bg-muted/20">
            <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Proveedor
            </TableHead>
            <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Contacto
            </TableHead>
            <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Estado
            </TableHead>
            <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              En uso
            </TableHead>
            <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Creado
            </TableHead>
            <TableHead className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((supplier) => {
            const usageCount = supplier.relatedPriceListsCount + supplier.relatedProductsCount

            return (
              <TableRow key={supplier.id} className="transition-colors hover:bg-muted/25">
                <TableCell className="max-w-[280px] px-4 py-4 align-middle lg:max-w-[340px]">
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-medium text-foreground">{supplier.name}</p>
                    {supplier.address ? (
                      <p
                        className="line-clamp-1 break-words text-xs text-muted-foreground"
                        title={supplier.address}
                      >
                        {supplier.address}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="max-w-[220px] px-4 py-4 align-middle">
                  <div className="min-w-0 space-y-0.5 text-sm">
                    <p className="truncate text-foreground" title={supplier.email ?? undefined}>
                      {supplier.email ?? <span className="text-muted-foreground/50">—</span>}
                    </p>
                    <p
                      className="truncate text-xs text-muted-foreground"
                      title={supplier.phone ?? undefined}
                    >
                      {supplier.phone ?? <span className="text-muted-foreground/40">—</span>}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4 align-middle">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-block size-1.5 rounded-full",
                        supplier.isActive ? "bg-emerald-500" : "bg-muted-foreground/40",
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm",
                        supplier.isActive ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {supplier.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4 align-middle">
                  {usageCount === 0 ? (
                    <span className="text-xs text-muted-foreground/50">Sin relaciones</span>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      <span>{supplier.relatedPriceListsCount} lista{supplier.relatedPriceListsCount !== 1 ? "s" : ""}</span>
                      <span className="mx-1.5 text-muted-foreground/40">·</span>
                      <span>{supplier.relatedProductsCount} producto{supplier.relatedProductsCount !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="px-4 py-4 align-middle text-sm text-muted-foreground">
                  {formatDate(supplier.createdAt)}
                </TableCell>
                <TableCell className="px-4 py-4 align-middle text-right">
                  <div className="flex items-center justify-end gap-2">
                    {supplier.isActive ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(supplier)}
                        >
                          <PencilLine className="size-4" />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(supplier)}
                          className="border-destructive/20 text-destructive/80 hover:border-destructive/35 hover:bg-destructive/8 hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                          Eliminar
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onReactivate(supplier)}
                        className="border-emerald-500/20 text-emerald-700 hover:border-emerald-500/35 hover:bg-emerald-500/8 hover:text-emerald-800"
                      >
                        <RotateCcw className="size-4" />
                        Reactivar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
