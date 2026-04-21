import { PencilLine, RotateCcw, Trash2 } from "lucide-react"

import type { SupplierListItem } from "@/lib/suppliers/types"

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
    <div className="overflow-hidden rounded-xl border border-border/70 bg-background shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4 py-4">Proveedor</TableHead>
            <TableHead className="px-4 py-4">Contacto</TableHead>
            <TableHead className="px-4 py-4">Estado</TableHead>
            <TableHead className="px-4 py-4">En uso</TableHead>
            <TableHead className="px-4 py-4">Creado</TableHead>
            <TableHead className="px-4 py-4 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((supplier) => {
            const usageCount = supplier.relatedPriceListsCount + supplier.relatedProductsCount

            return (
              <TableRow key={supplier.id} className="transition-colors hover:bg-muted/30">
                <TableCell className="max-w-[280px] px-4 py-4 align-top lg:max-w-[340px]">
                  <div className="space-y-1 min-w-0">
                    <p className="font-medium text-foreground">{supplier.name}</p>
                    <p
                      className="line-clamp-2 break-words text-sm text-muted-foreground"
                      title={supplier.address ?? "Sin dirección"}
                    >
                      {supplier.address ?? "Sin dirección"}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="max-w-[240px] px-4 py-4 align-top lg:max-w-[280px]">
                  <div className="min-w-0 space-y-1 text-sm">
                    <p className="truncate" title={supplier.email ?? "Sin correo"}>
                      {supplier.email ?? "Sin correo"}
                    </p>
                    <p className="truncate text-muted-foreground" title={supplier.phone ?? "Sin teléfono"}>
                      {supplier.phone ?? "Sin teléfono"}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4 align-top">
                  <Badge variant={supplier.isActive ? "secondary" : "outline"}>
                    {supplier.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-4 align-top">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Listas: {supplier.relatedPriceListsCount}</Badge>
                    <Badge variant="outline">Productos: {supplier.relatedProductsCount}</Badge>
                    {usageCount === 0 ? <Badge variant="outline">Libre</Badge> : null}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4 align-top text-sm text-muted-foreground">
                  {formatDate(supplier.createdAt)}
                </TableCell>
                <TableCell className="px-4 py-4 align-top text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {supplier.isActive ? (
                      <>
                        <Button type="button" variant="outline" size="sm" onClick={() => onEdit(supplier)}>
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
