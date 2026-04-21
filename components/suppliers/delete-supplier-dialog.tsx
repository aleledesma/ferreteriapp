"use client"

import { Loader2, Trash2 } from "lucide-react"

import type { SupplierListItem } from "@/lib/suppliers/types"

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

type DeleteSupplierDialogProps = {
  open: boolean
  supplier: SupplierListItem | null
  isDeleting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteSupplierDialog({
  open,
  supplier,
  isDeleting,
  onOpenChange,
  onConfirm,
}: DeleteSupplierDialogProps) {
  const hasRelations =
    (supplier?.relatedPriceListsCount ?? 0) +
      (supplier?.relatedProductsCount ?? 0) >
    0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
          <AlertDialogDescription>
            {hasRelations
              ? "Este proveedor ya está siendo usado por listas o productos. Si continúas, quedará inactivo y se mantendrá en la base de datos."
              : "Este proveedor no tiene relaciones. Si continúas, se eliminará definitivamente."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
            }}
            className=" bg-transparent border-destructive/20 text-destructive/80 hover:border-destructive/35 hover:bg-destructive/8 hover:text-destructive"
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            {hasRelations ? "Desactivar proveedor" : "Eliminar definitivamente"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
