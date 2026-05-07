"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react"
import { toast } from "sonner"

import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import type { SupplierDeleteResult, SupplierListItem, SupplierListResult } from "@/lib/suppliers/types"
import { SUPPLIER_PAGE_SIZE_OPTIONS } from "@/lib/suppliers/validation"

import { DeleteSupplierDialog } from "@/components/suppliers/delete-supplier-dialog"
import { SupplierFormSheet } from "@/components/suppliers/supplier-form-sheet"
import { SuppliersTable } from "@/components/suppliers/suppliers-table"
import { SuppliersTableSkeleton } from "@/components/suppliers/suppliers-table-skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const EMPTY_RESULT: SupplierListResult = {
  items: [],
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  },
}

type SuppliersPageClientProps = {
  initialPageSize?: number
}

export function SuppliersPageClient({ initialPageSize = 10 }: SuppliersPageClientProps) {
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebouncedValue(searchInput, 350)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [data, setData] = useState<SupplierListResult>(EMPTY_RESULT)
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<SupplierListItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SupplierListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true)

    try {
      const searchParams = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      })

      if (debouncedSearch.trim().length > 0) {
        searchParams.set("search", debouncedSearch.trim())
      }

      const response = await fetch(`/api/suppliers?${searchParams.toString()}`)
      const payload = (await response.json()) as SupplierListResult & { error?: string }

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo cargar el listado de proveedores.")
      }

      setData(payload)
    } catch (error) {
      toast.error("No se pudo cargar proveedores", {
        id: "suppliers-fetch-error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo cargar el listado de proveedores.",
      })
      setData(EMPTY_RESULT)
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, pageSize])

  useEffect(() => {
    void fetchSuppliers()
  }, [fetchSuppliers])

  const emptyMessage = useMemo(() => {
    if (debouncedSearch.trim().length > 0) {
      return "No se encontraron proveedores para esa búsqueda."
    }

    return "Todavía no hay proveedores cargados."
  }, [debouncedSearch])

  function handleCreateClick() {
    setEditingSupplier(null)
    setFormOpen(true)
  }

  function handleEditClick(supplier: SupplierListItem) {
    setEditingSupplier(supplier)
    setFormOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return

    setIsDeleting(true)
    const toastId = toast.loading(`Eliminando proveedor ${deleteTarget.name}...`)

    try {
      const response = await fetch(`/api/suppliers/${deleteTarget.id}`, {
        method: "DELETE",
      })

      const payload = (await response.json()) as SupplierDeleteResult & { error?: string }
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo eliminar el proveedor.")
      }

      setDeleteTarget(null)
      toast.success("Proveedor procesado", {
        id: toastId,
        description:
          payload.mode === "soft-delete"
            ? "El proveedor quedó inactivo porque ya tiene relaciones en el sistema."
            : "Proveedor eliminado correctamente.",
      })
      await fetchSuppliers()
    } catch (error) {
      toast.error("No se pudo eliminar el proveedor", {
        id: toastId,
        description:
          error instanceof Error ? error.message : "No se pudo eliminar el proveedor.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleReactivate(supplier: SupplierListItem) {
    const toastId = toast.loading(`Reactivando proveedor ${supplier.name}...`)

    try {
      const response = await fetch(`/api/suppliers/${supplier.id}/reactivate`, {
        method: "POST",
      })

      const payload = (await response.json()) as { error?: string; supplier?: SupplierListItem }

      if (!response.ok || !payload.supplier) {
        throw new Error(payload.error || "No se pudo reactivar el proveedor.")
      }

      toast.success("Proveedor reactivado", {
        id: toastId,
        description: `Proveedor ${payload.supplier.name} reactivado correctamente.`,
      })
      await fetchSuppliers()
    } catch (error) {
      toast.error("No se pudo reactivar el proveedor", {
        id: toastId,
        description:
          error instanceof Error ? error.message : "No se pudo reactivar el proveedor.",
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-500 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Directorio
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Proveedores</h1>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Administra el directorio de proveedores, mantén sus datos al día y controla si continúan activos en el sistema.
          </p>
        </div>
        <Button type="button" onClick={handleCreateClick} className="shrink-0">
          <Plus className="size-4" />
          Nuevo proveedor
        </Button>
      </div>

      {/* Filter bar */}
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
              {SUPPLIER_PAGE_SIZE_OPTIONS.map((option) => (
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
        {/* Status bar */}
        <div className="flex items-center justify-between text-sm text-muted-foreground px-0.5">
          <span>
            {data.pagination.total}{" "}
            {data.pagination.total === 1 ? "proveedor" : "proveedores"} encontrados
          </span>
          <span>
            Página {data.pagination.page} de {data.pagination.totalPages}
          </span>
        </div>

        {isLoading ? (
          <SuppliersTableSkeleton />
        ) : data.items.length > 0 ? (
          <SuppliersTable
            items={data.items}
            onEdit={handleEditClick}
            onDelete={(supplier) => setDeleteTarget(supplier)}
            onReactivate={(supplier) => {
              void handleReactivate(supplier)
            }}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 px-6 py-14 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={isLoading || page <= 1}
          >
            <ChevronLeft className="size-4" />
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((current) => Math.min(data.pagination.totalPages, current + 1))
            }
            disabled={isLoading || page >= data.pagination.totalPages}
          >
            Siguiente
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <SupplierFormSheet
        open={formOpen}
        supplier={editingSupplier}
        onOpenChange={setFormOpen}
        onSaved={async (supplier, mode) => {
          toast.success(mode === "create" ? "Proveedor creado" : "Proveedor actualizado", {
            description:
              mode === "create"
                ? `Proveedor ${supplier.name} creado correctamente.`
                : `Proveedor ${supplier.name} actualizado correctamente.`,
          })
          await fetchSuppliers()
        }}
      />

      <DeleteSupplierDialog
        open={deleteTarget !== null}
        supplier={deleteTarget}
        isDeleting={isDeleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
        onConfirm={() => {
          void handleDeleteConfirm()
        }}
      />
    </div>
  )
}
