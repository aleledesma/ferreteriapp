"use client"

import { Loader2, Trash2 } from "lucide-react"
import type { CustomerListItem } from "@/lib/customers/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type DeleteCustomerDialogProps = {
  open: boolean
  customer: CustomerListItem | null
  isDeleting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteCustomerDialog({
  open,
  customer,
  isDeleting,
  onOpenChange,
  onConfirm,
}: DeleteCustomerDialogProps) {

  const hasRelations = (customer?.relatedSalesCount ?? 0) > 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
          <AlertDialogDescription>
            {hasRelations
              ? "Este cliente ya tiene compras registradas. Si continúas, quedará inactivo y no aparecerá en las listas, pero se mantendrá en el historial de ventas."
              : "Este cliente no tiene compras registradas. Si continúas, se eliminará definitivamente de la base de datos."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
            }}
            className="bg-transparent border-destructive/20 text-destructive/80 hover:border-destructive/35 hover:bg-destructive/8 hover:text-destructive"
          >
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {hasRelations ? "Desactivar cliente" : "Eliminar definitivamente"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}