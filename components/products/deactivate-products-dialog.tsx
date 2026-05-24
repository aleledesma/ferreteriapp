"use client"

import { Loader2, Trash2 } from "lucide-react"

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

type DeactivateProductsDialogProps = {
  open: boolean
  selectedCount: number
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeactivateProductsDialog({
  open,
  selectedCount,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: DeactivateProductsDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar productos seleccionados?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminarán {selectedCount} producto{selectedCount === 1 ? "" : "s"} seleccionado{selectedCount === 1 ? "" : "s"}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
            }}
            className="border-destructive/20 bg-transparent text-destructive/80 hover:border-destructive/35 hover:bg-destructive/8 hover:text-destructive"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Eliminar productos
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
