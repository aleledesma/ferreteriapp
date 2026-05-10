"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import type { CustomerListItem } from "@/lib/customers/types"

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

type CustomerFormSheetProps = {
  open: boolean
  customer: CustomerListItem | null
  onOpenChange: (open: boolean) => void
  onSaved: (customer: CustomerListItem, mode: "create" | "update") => void | Promise<void>
}

type CustomerFormValues = {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  notes: string
}

const EMPTY_VALUES: CustomerFormValues = {
  firstName: "",
  lastName: "",
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

export function CustomerFormSheet({ open, customer, onOpenChange, onSaved }: CustomerFormSheetProps) {
  const [values, setValues] = useState<CustomerFormValues>(EMPTY_VALUES)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const mode = useMemo(() => (customer ? "update" : "create"), [customer])

  useEffect(() => {
    if (!customer) {
      setValues(EMPTY_VALUES)
      return
    }

    setValues({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      address: customer.address ?? "",
      notes: customer.notes ?? "",
    })
  }, [customer])

  function updateField(field: keyof CustomerFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    const toastId = toast.loading(
      mode === "create" ? "Creando cliente..." : "Guardando cambios del cliente...",
    )

    try {
      const response = await fetch(
        mode === "create" ? "/api/customers" : `/api/customers/${customer?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(values),
        },
      )

      const payload = (await response.json()) as {
        error?: string
        customer?: CustomerListItem
      }

      if (!response.ok || !payload.customer) {
        throw new Error(payload.error || "No se pudo guardar el cliente.")
      }

      await onSaved(payload.customer, mode)
      onOpenChange(false)
    } catch (error) {
      toast.error(
        mode === "create" ? "No se pudo crear el cliente" : "No se pudo actualizar el cliente",
        {
          id: toastId,
          description: error instanceof Error ? error.message : "No se pudo guardar el cliente.",
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
            {mode === "create" ? "Nuevo cliente" : "Editar cliente"}
          </SheetTitle>
          <SheetDescription className="mt-0.5 text-sm text-muted-foreground">
            Completa los datos del cliente. Los cambios se guardan sin salir del listado.
          </SheetDescription>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            
            {/* Datos principales */}
            <div className="px-6 py-5">
              <SectionLabel>Datos principales</SectionLabel>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer-firstname">Nombre</Label>
                  <Input
                    id="customer-firstname"
                    value={values.firstName}
                    onChange={(event) => updateField("firstName", event.target.value)}
                    placeholder="Ej. Martín"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-lastname">Apellido</Label>
                  <Input
                    id="customer-lastname"
                    value={values.lastName}
                    onChange={(event) => updateField("lastName", event.target.value)}
                    placeholder="Ej. Pérez"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="customer-address">
                  Dirección <span className="text-muted-foreground/60">(opc.)</span>
                </Label>
                <Input
                  id="customer-address"
                  value={values.address}
                  onChange={(event) => updateField("address", event.target.value)}
                  placeholder="Calle y número"
                />
              </div>
            </div>

            {/* Contacto */}
            <div className="px-6 py-5">
              <SectionLabel>Contacto</SectionLabel>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer-email">
                    Correo <span className="text-muted-foreground/60">(opc.)</span>
                  </Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={values.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="cliente@ejemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-phone">
                    Teléfono <span className="text-muted-foreground/60">(opc.)</span>
                  </Label>
                  <Input
                    id="customer-phone"
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
                id="customer-notes"
                value={values.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Preferencias del cliente, cuit para facturar, etc."
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
                    ? "Crear cliente"
                    : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}