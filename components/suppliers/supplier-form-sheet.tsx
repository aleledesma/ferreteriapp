"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import type { SupplierListItem } from "@/lib/suppliers/types"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70">
      {children}
    </p>
  )
}

export function SupplierFormSheet({ open, supplier, onOpenChange, onSaved }: SupplierFormSheetProps) {
  const [values, setValues] = useState<SupplierFormValues>(EMPTY_VALUES)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const mode = useMemo(() => (supplier ? "update" : "create"), [supplier])

  useEffect(() => {
    if (!supplier) {
      setValues(EMPTY_VALUES)
      return
    }

    setValues({
      name: supplier.name,
      email: supplier.email ?? "",
      phone: supplier.phone ?? "",
      address: supplier.address ?? "",
      notes: supplier.notes ?? "",
    })
  }, [supplier])

  function updateField(field: keyof SupplierFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    const toastId = toast.loading(
      mode === "create" ? "Creando proveedor..." : "Guardando cambios del proveedor...",
    )

    try {
      const response = await fetch(
        mode === "create" ? "/api/suppliers" : `/api/suppliers/${supplier?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(values),
        },
      )

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
      toast.error(
        mode === "create" ? "No se pudo crear el proveedor" : "No se pudo actualizar el proveedor",
        {
          id: toastId,
          description: error instanceof Error ? error.message : "No se pudo guardar el proveedor.",
        },
      )
      return
    } finally {
      setIsSubmitting(false)
    }

    toast.dismiss(toastId)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-lg flex-col overflow-hidden p-0 sm:max-w-xl">
        {/* Sticky header */}
        <div className="shrink-0 border-b border-border/50 px-6 py-5">
          <SheetTitle className="text-lg font-semibold">
            {mode === "create" ? "Nuevo proveedor" : "Editar proveedor"}
          </SheetTitle>
          <SheetDescription className="mt-0.5 text-sm text-muted-foreground">
            Completa los datos del proveedor. Los cambios se guardan sin salir del listado.
          </SheetDescription>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {/* Datos principales */}
            <div className="px-6 py-5">
              <SectionLabel>Datos principales</SectionLabel>
              <div className="space-y-4">
                <div className="space-y-2">
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
                  <Label htmlFor="supplier-address">
                    Dirección <span className="text-muted-foreground/60">(opc.)</span>
                  </Label>
                  <Input
                    id="supplier-address"
                    value={values.address}
                    onChange={(event) => updateField("address", event.target.value)}
                    placeholder="Dirección o ubicación principal"
                  />
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div className="px-6 py-5">
              <SectionLabel>Contacto</SectionLabel>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supplier-email">
                    Correo <span className="text-muted-foreground/60">(opc.)</span>
                  </Label>
                  <Input
                    id="supplier-email"
                    type="email"
                    value={values.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="contacto@proveedor.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier-phone">
                    Teléfono <span className="text-muted-foreground/60">(opc.)</span>
                  </Label>
                  <Input
                    id="supplier-phone"
                    value={values.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    placeholder="Ej. 11 5555-5555"
                  />
                </div>
              </div>
            </div>

            {/* Notas */}
            <div className="px-6 py-5">
              <SectionLabel>Notas internas</SectionLabel>
              <Textarea
                id="supplier-notes"
                value={values.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Observaciones internas, condiciones comerciales, etc."
                className="resize-none"
                rows={4}
              />
            </div>
          </div>

          {/* Sticky footer */}
          <div className="shrink-0 border-t border-border/50 px-6 py-4">
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-36">
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {isSubmitting
                  ? "Guardando..."
                  : mode === "create"
                    ? "Crear proveedor"
                    : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
