"use client"

import { Loader2, RefreshCcw } from "lucide-react"

import type { ManualExistingProductConflict } from "@/lib/products/manual-product-types"

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

type ManualProductUpdateDialogProps = {
  open: boolean
  conflict: ManualExistingProductConflict | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ManualProductUpdateDialog({
  open,
  conflict,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: ManualProductUpdateDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Producto existente detectado</AlertDialogTitle>
          <AlertDialogDescription>
            El producto ya existe para este proveedor. Si continúas, se actualizarán los datos y el stock se sumará al valor actual.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {conflict ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4 text-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Actual</p>
              <div className="mt-2 space-y-1 text-foreground">
                <p className="font-medium">{conflict.current.name}</p>
                <p>Stock actual: {conflict.current.stock}</p>
                <p>Costo: {conflict.current.costPrice}</p>
                <p>Venta: {conflict.current.salePrice}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-primary">Resultado</p>
              <div className="mt-2 space-y-1 text-foreground">
                <p className="font-medium">{conflict.incoming.name}</p>
                <p>Stock a sumar: {conflict.incoming.stockToAdd}</p>
                <p>Stock final: {conflict.incoming.resultingStock}</p>
                <p>Costo: {conflict.incoming.costPrice}</p>
                <p>Venta: {conflict.incoming.salePrice}</p>
              </div>
            </div>
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
            }}
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
            {isSubmitting ? "Actualizando..." : "Actualizar producto"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
