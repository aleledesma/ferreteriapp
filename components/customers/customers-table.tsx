import { PencilLine, RotateCcw, Trash2 } from "lucide-react"
import type { CustomerListItem } from "@/lib/customers/types"
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

type CustomersTableProps = {
  items: CustomerListItem[]
  onEdit: (customer: CustomerListItem) => void
  onDelete: (customer: CustomerListItem) => void
  onReactivate: (customer: CustomerListItem) => void
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(value))
}

export function CustomersTable({ items, onEdit, onDelete, onReactivate }: CustomersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-background/85 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border/60 bg-muted/20 hover:bg-muted/20">
            <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Cliente</TableHead>
            <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Contacto</TableHead>
            <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Estado</TableHead>
            <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Actividad</TableHead>
            <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Registrado</TableHead>
            <TableHead className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((customer) => (
            <TableRow key={customer.id} className="transition-colors hover:bg-muted/25">
              <TableCell className="max-w-[280px] px-4 py-4 align-middle lg:max-w-[340px]">
                <div className="min-w-0 space-y-0.5">
                  <p className="font-medium text-foreground">{customer.firstName} {customer.lastName}</p>
                  {customer.address && <p className="line-clamp-1 break-words text-xs text-muted-foreground">{customer.address}</p>}
                </div>
              </TableCell>
              <TableCell className="max-w-[220px] px-4 py-4 align-middle">
                <div className="min-w-0 space-y-0.5 text-sm">
                  <p className="truncate text-foreground">{customer.email ?? <span className="text-muted-foreground/50">—</span>}</p>
                  <p className="truncate text-xs text-muted-foreground">{customer.phone ?? <span className="text-muted-foreground/40">—</span>}</p>
                </div>
              </TableCell>
              <TableCell className="px-4 py-4 align-middle">
                <div className="flex items-center gap-1.5">
                  <span className={cn("inline-block size-1.5 rounded-full", customer.isActive ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                  <span className={cn("text-sm", customer.isActive ? "text-foreground" : "text-muted-foreground")}>
                    {customer.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-4 py-4 align-middle">
                {customer.relatedSalesCount === 0 ? (
                  <span className="text-xs text-muted-foreground/50">Sin compras</span>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    <span>{customer.relatedSalesCount} compra{customer.relatedSalesCount !== 1 ? "s" : ""}</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="px-4 py-4 align-middle text-sm text-muted-foreground">{formatDate(customer.createdAt)}</TableCell>
              <TableCell className="px-4 py-4 align-middle text-right">
                <div className="flex items-center justify-end gap-2">
                  {customer.isActive ? (
                    <>
                      <Button type="button" variant="outline" size="sm" onClick={() => onEdit(customer)}>
                        <PencilLine className="size-4" /> Editar
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => onDelete(customer)} className="border-destructive/20 text-destructive/80 hover:bg-destructive/8 hover:text-destructive">
                        <Trash2 className="size-4" /> Eliminar
                      </Button>
                    </>
                  ) : (
                    <Button type="button" variant="outline" size="sm" onClick={() => onReactivate(customer)} className="border-emerald-500/20 text-emerald-700 hover:bg-emerald-500/8">
                      <RotateCcw className="size-4" /> Reactivar
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}