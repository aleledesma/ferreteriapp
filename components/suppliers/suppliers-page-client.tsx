"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus, Search } from "lucide-react"

import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import type { SupplierDeleteResult, SupplierListItem, SupplierListResult } from "@/lib/suppliers/types"
import { SUPPLIER_PAGE_SIZE_OPTIONS } from "@/lib/suppliers/validation"

import { DeleteSupplierDialog } from "@/components/suppliers/delete-supplier-dialog"
import { SupplierFormSheet } from "@/components/suppliers/supplier-form-sheet"
import { SuppliersTable } from "@/components/suppliers/suppliers-table"
import { SuppliersTableSkeleton } from "@/components/suppliers/suppliers-table-skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Notice = {
  tone: "success" | "error"
  message: string
}

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
  const [notice, setNotice] = useState<Notice | null>(null)
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
      setNotice({
        tone: "error",
        message:
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
    setNotice(null)

    try {
      const response = await fetch(`/api/suppliers/${deleteTarget.id}`, {
        method: "DELETE",
      })

      const payload = (await response.json()) as SupplierDeleteResult & { error?: string }
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo eliminar el proveedor.")
      }

      setDeleteTarget(null)
      setNotice({
        tone: "success",
        message:
          payload.mode === "soft-delete"
            ? "El proveedor quedó inactivo porque ya tiene relaciones en el sistema."
            : "Proveedor eliminado correctamente.",
      })
      await fetchSuppliers()
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : "No se pudo eliminar el proveedor.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleReactivate(supplier: SupplierListItem) {
    setNotice(null)

    try {
      const response = await fetch(`/api/suppliers/${supplier.id}/reactivate`, {
        method: "POST",
      })

      const payload = (await response.json()) as { error?: string; supplier?: SupplierListItem }

      if (!response.ok || !payload.supplier) {
        throw new Error(payload.error || "No se pudo reactivar el proveedor.")
      }

      setNotice({
        tone: "success",
        message: `Proveedor ${payload.supplier.name} reactivado correctamente.`,
      })
      await fetchSuppliers()
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : "No se pudo reactivar el proveedor.",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/10 bg-background/85 shadow-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl">Proveedores</CardTitle>
            <CardDescription>
              Administra el directorio de proveedores, mantén sus datos al día y controla si continúan activos en el sistema.
            </CardDescription>
          </div>
          <Button type="button" onClick={handleCreateClick}>
            <Plus className="size-4" />
            Nuevo proveedor
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          {notice ? (
            <Alert
              variant={notice.tone === "error" ? "destructive" : "success"}
              className="animate-in fade-in-0 slide-in-from-top-2 duration-300"
            >
              <AlertDescription>{notice.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar por nombre, correo o teléfono"
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-3 self-end lg:self-auto">
              <span className="text-sm text-muted-foreground">Items por página</span>
              <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger className="w-[90px] bg-background shadow-xs">
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

          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              {data.pagination.total} proveedor{data.pagination.total === 1 ? "" : "es"} encontrados
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
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/15 px-6 py-12 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={isLoading || page <= 1}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPage((current) => Math.min(data.pagination.totalPages, current + 1))}
              disabled={isLoading || page >= data.pagination.totalPages}
            >
              Siguiente
            </Button>
          </div>
        </CardContent>
      </Card>

      <SupplierFormSheet
        open={formOpen}
        supplier={editingSupplier}
        onOpenChange={setFormOpen}
        onSaved={async (supplier, mode) => {
          setNotice({
            tone: "success",
            message:
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
