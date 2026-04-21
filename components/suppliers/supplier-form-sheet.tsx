"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Save } from "lucide-react"

import type { SupplierListItem } from "@/lib/suppliers/types"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"

type SupplierFormSheetProps = {
  open: boolean
  supplier: SupplierListItem | null
  onOpenChange: (open: boolean) => void
  onSaved: (supplier: SupplierListItem, mode: "create" | "update") => void | Promise<void>
}

type SupplierFormValues = {
  name: string
  email: string
  phone: string
  address: string
  notes: string
}

const EMPTY_VALUES: SupplierFormValues = {
  name: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
}

export function SupplierFormSheet({ open, supplier, onOpenChange, onSaved }: SupplierFormSheetProps) {
  const [values, setValues] = useState<SupplierFormValues>(EMPTY_VALUES)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const mode = useMemo(() => (supplier ? "update" : "create"), [supplier])

  useEffect(() => {
    if (!supplier) {
      setValues(EMPTY_VALUES)
      setErrorMessage(null)
      return
    }

    setValues({
      name: supplier.name,
      email: supplier.email ?? "",
      phone: supplier.phone ?? "",
      address: supplier.address ?? "",
      notes: supplier.notes ?? "",
    })
    setErrorMessage(null)
  }, [supplier])

  function updateField(field: keyof SupplierFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const response = await fetch(mode === "create" ? "/api/suppliers" : `/api/suppliers/${supplier?.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const payload = (await response.json()) as {
        error?: string
        supplier?: SupplierListItem
      }

      if (!response.ok || !payload.supplier) {
        throw new Error(payload.error || "No se pudo guardar el proveedor.")
      }

      await onSaved(payload.supplier, mode)
      onOpenChange(false)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo guardar el proveedor.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-2xl flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "Nuevo proveedor" : "Editar proveedor"}</SheetTitle>
          <SheetDescription>
            Completa los datos principales del proveedor. Los cambios se guardan sin salir del listado.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 px-6 py-4">
          {errorMessage ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="supplier-name">Nombre</Label>
              <Input
                id="supplier-name"
                value={values.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Ej. Ferretería Pepe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-email">Correo</Label>
              <Input
                id="supplier-email"
                type="email"
                value={values.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="contacto@proveedor.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-phone">Teléfono</Label>
              <Input
                id="supplier-phone"
                value={values.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="Ej. 11 5555-5555"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="supplier-address">Dirección</Label>
              <Input
                id="supplier-address"
                value={values.address}
                onChange={(event) => updateField("address", event.target.value)}
                placeholder="Dirección o ubicación principal"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="supplier-notes">Notas</Label>
              <Textarea
                id="supplier-notes"
                value={values.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Observaciones internas, condiciones comerciales, etc."
              />
            </div>
          </div>

          <SheetFooter className="px-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {isSubmitting ? "Guardando..." : mode === "create" ? "Crear proveedor" : "Guardar cambios"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
