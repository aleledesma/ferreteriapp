"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react"
import { toast } from "sonner"

import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import type { CustomerDeleteResult, CustomerListItem, CustomerListResult } from "@/lib/customers/types"
import { CUSTOMER_PAGE_SIZE_OPTIONS } from "@/lib/customers/validation"

import { DeleteCustomerDialog } from "@/components/customers/delete-customer-dialog"
import { CustomerFormSheet } from "@/components/customers/customer-form-sheet"
import { CustomersTable } from "@/components/customers/customers-table"
import { CustomersTableSkeleton } from "@/components/customers/customers-table-skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const EMPTY_RESULT: CustomerListResult = {
  items: [],
  pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
}

type CustomersPageClientProps = {
  initialPageSize?: number
}

export function CustomersPageClient({ initialPageSize = 10 }: CustomersPageClientProps) {
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebouncedValue(searchInput, 350)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [data, setData] = useState<CustomerListResult>(EMPTY_RESULT)
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerListItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CustomerListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true)
    try {
      const searchParams = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      })

      if (debouncedSearch.trim().length > 0) {
        searchParams.set("search", debouncedSearch.trim())
      }

      const response = await fetch(`/api/customers?${searchParams.toString()}`)
      const payload = (await response.json()) as CustomerListResult & { error?: string }

      if (!response.ok) throw new Error(payload.error || "Error al cargar clientes.")
      setData(payload)
    } catch (error) {
      toast.error("Error", { description: "No se pudo cargar el listado." })
      setData(EMPTY_RESULT)
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, pageSize])

  useEffect(() => {
    void fetchCustomers()
  }, [fetchCustomers])

  function handleCreateClick() {
    setEditingCustomer(null)
    setFormOpen(true)
  }

  function handleEditClick(customer: CustomerListItem) {
    setEditingCustomer(customer)
    setFormOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return

    setIsDeleting(true)
    const toastId = toast.loading(`Procesando a ${deleteTarget.firstName}...`)

    try {
      const response = await fetch(`/api/customers/${deleteTarget.id}`, {
        method: "DELETE",
      })

      const payload = (await response.json()) as CustomerDeleteResult & { error?: string }
      if (!response.ok) throw new Error(payload.error || "No se pudo eliminar.")

      setDeleteTarget(null)
      
      toast.success("Operación exitosa", {
        id: toastId,
        description: payload.mode === "soft-delete"
            ? "El cliente quedó inactivo porque ya tiene ventas registradas."
            : "Cliente eliminado definitivamente de la base de datos.",
      })
      
      await fetchCustomers()
    } catch (error) {
      toast.error("Error", {
        id: toastId,
        description: error instanceof Error ? error.message : "No se pudo eliminar.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // --- ¡ACÁ ESTÁ LA MAGIA PARA REACTIVAR! ---
  async function handleReactivate(customer: CustomerListItem) {
    const toastId = toast.loading(`Reactivando a ${customer.firstName}...`)

    try {
      const response = await fetch(`/api/customers/${customer.id}/reactivate`, {
        method: "POST",
      })

      const payload = (await response.json()) as { error?: string; customer?: CustomerListItem }
      if (!response.ok || !payload.customer) throw new Error(payload.error || "No se pudo reactivar.")

      toast.success("Cliente reactivado", {
        id: toastId,
        description: `El cliente ${payload.customer.firstName} vuelve a estar activo.`,
      })
      await fetchCustomers()
    } catch (error) {
      toast.error("Error", {
        id: toastId,
        description: error instanceof Error ? error.message : "No se pudo reactivar.",
      })
    }
  }

  const emptyMessage = useMemo(() => {
    if (debouncedSearch.trim().length > 0) return "No se encontraron clientes para esa búsqueda."
    return "Todavía no hay clientes cargados."
  }, [debouncedSearch])

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-500 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Directorio
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Clientes</h1>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Administra el directorio de clientes, mantén sus datos al día y controla su historial de compras.
          </p>
        </div>
        <Button type="button" onClick={handleCreateClick} className="shrink-0">
          <Plus className="size-4 mr-2" />
          Nuevo cliente
        </Button>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-background/80 p-4 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre, correo o teléfono…"
            className="pl-9 bg-background"
          />
        </div>
        <div className="flex items-center gap-2.5 self-end lg:self-auto">
          <span className="text-sm text-muted-foreground">Por página</span>
          <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="w-[80px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CUSTOMER_PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-3 duration-500">
        <div className="flex items-center justify-between text-sm text-muted-foreground px-0.5">
          <span>{data.pagination.total} {data.pagination.total === 1 ? "cliente" : "clientes"} encontrados</span>
          <span>Página {data.pagination.page} de {data.pagination.totalPages}</span>
        </div>

        {isLoading ? (
          <CustomersTableSkeleton />
        ) : data.items.length > 0 ? (
          <CustomersTable
            items={data.items}
            onEdit={handleEditClick}
            onDelete={(customer) => setDeleteTarget(customer)}
            onReactivate={(customer) => { void handleReactivate(customer) }}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 px-6 py-14 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <Button
            type="button" variant="outline" size="sm"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={isLoading || page <= 1}
          >
            <ChevronLeft className="size-4 mr-1" /> Anterior
          </Button>
          <Button
            type="button" variant="outline" size="sm"
            onClick={() => setPage((current) => Math.min(data.pagination.totalPages, current + 1))}
            disabled={isLoading || page >= data.pagination.totalPages}
          >
            Siguiente <ChevronRight className="size-4 ml-1" />
          </Button>
        </div>
      </div>

      <CustomerFormSheet
        open={formOpen}
        customer={editingCustomer}
        onOpenChange={setFormOpen}
        onSaved={async (customer, mode) => {
          toast.success(mode === "create" ? "Cliente creado" : "Cliente actualizado", {
            description: mode === "create"
                ? `El cliente ${customer.firstName} fue registrado correctamente.`
                : `Los datos de ${customer.firstName} fueron actualizados.`,
          })
          await fetchCustomers()
        }}
      />

      <DeleteCustomerDialog
        open={deleteTarget !== null}
        customer={deleteTarget}
        isDeleting={isDeleting}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onConfirm={() => {
          void handleDeleteConfirm()
        }}
      />
    </div>
  )
}