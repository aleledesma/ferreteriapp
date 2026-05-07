"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowRightCircle,
  FileSpreadsheet,
  FolderPlus,
  Loader2,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react"
import { toast } from "sonner"

import { SupplierFormSheet } from "@/components/suppliers/supplier-form-sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type {
  SupplierListItem,
  SupplierListResult,
} from "@/lib/suppliers/types"

type UploadFileEntry = {
  id: string
  file: File
}

type SupplierUploadGroup = {
  id: string
  supplierId: string
  files: UploadFileEntry[]
}

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"]

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function getFileExtension(fileName: string) {
  const lastDot = fileName.lastIndexOf(".")
  return lastDot >= 0 ? fileName.slice(lastDot).toLowerCase() : ""
}

function isSupportedFile(file: File) {
  return ACCEPTED_EXTENSIONS.includes(getFileExtension(file.name))
}

function createUploadFileEntry(file: File): UploadFileEntry {
  return {
    id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
    file,
  }
}

function createSupplierGroup(): SupplierUploadGroup {
  return {
    id: crypto.randomUUID(),
    supplierId: "",
    files: [],
  }
}

export function ProductImportForm() {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [groups, setGroups] = useState<SupplierUploadGroup[]>([])
  const [suppliers, setSuppliers] = useState<SupplierListItem[]>([])
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSupplierSheetOpen, setIsSupplierSheetOpen] = useState(false)
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null)

  useEffect(() => {
    async function loadSuppliers() {
      setIsLoadingSuppliers(true)

      try {
        const response = await fetch("/api/suppliers?page=1&pageSize=50")
        const payload = (await response.json()) as SupplierListResult & {
          error?: string
        }

        if (!response.ok) {
          throw new Error(
            payload.error || "No se pudo cargar el listado de proveedores.",
          )
        }

        setSuppliers(payload.items)
      } catch (error) {
        toast.error("No se pudo cargar proveedores", {
          id: "product-import-suppliers-error",
          description:
            error instanceof Error
              ? error.message
              : "No se pudo cargar el listado de proveedores disponibles.",
        })
      } finally {
        setIsLoadingSuppliers(false)
      }
    }

    void loadSuppliers()
  }, [])

  const activeSuppliers = useMemo(
    () => suppliers.filter((supplier) => supplier.isActive),
    [suppliers],
  )

  const summary = useMemo(() => {
    const totalGroups = groups.length
    const totalFiles = groups.reduce(
      (total, group) => total + group.files.length,
      0,
    )
    const totalSize = groups.reduce(
      (total, group) =>
        total +
        group.files.reduce(
          (groupTotal, entry) => groupTotal + entry.file.size,
          0,
        ),
      0,
    )
    const readyGroups = groups.filter(
      (group) => group.supplierId.length > 0 && group.files.length > 0,
    ).length
    const incompleteGroups = groups.filter(
      (group) => group.supplierId.length === 0 || group.files.length === 0,
    ).length

    return { totalGroups, totalFiles, totalSize, readyGroups, incompleteGroups }
  }, [groups])

  function addSupplierGroup() {
    setGroups((current) => [...current, createSupplierGroup()])
  }

  function removeSupplierGroup(groupId: string) {
    setGroups((current) => current.filter((group) => group.id !== groupId))
  }

  function updateGroupSupplier(groupId: string, supplierId: string) {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId ? { ...group, supplierId } : group,
      ),
    )
  }

  function removeFile(groupId: string, fileId: string) {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? { ...group, files: group.files.filter((entry) => entry.id !== fileId) }
          : group,
      ),
    )
  }

  function appendFilesToGroup(groupId: string, fileList: FileList | File[]) {
    const files = Array.from(fileList)
    const invalidFile = files.find((file) => !isSupportedFile(file))

    if (invalidFile) {
      toast.warning("Formato no soportado", {
        description: `El archivo ${invalidFile.name} no es compatible. Usa XLSX, XLS o CSV.`,
      })
      return
    }

    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? { ...group, files: [...group.files, ...files.map(createUploadFileEntry)] }
          : group,
      ),
    )
  }

  function openCreateSupplier(groupId: string) {
    setTargetGroupId(groupId)
    setIsSupplierSheetOpen(true)
  }

  function createGroupAndOpenSupplierSheet() {
    const group = createSupplierGroup()
    setGroups((current) => [...current, group])
    openCreateSupplier(group.id)
  }

  async function handleSubmit() {
    if (!groups.length) {
      toast.info("Carga incompleta", {
        description: "Agrega al menos un proveedor antes de iniciar la carga masiva.",
      })
      return
    }

    const invalidGroup = groups.find(
      (group) => group.supplierId.length === 0 || group.files.length === 0,
    )

    if (invalidGroup) {
      toast.warning("Grupo incompleto", {
        description:
          invalidGroup.supplierId.length === 0
            ? "Selecciona un proveedor para cada grupo antes de continuar."
            : "Cada proveedor debe tener al menos un archivo cargado.",
      })
      return
    }

    const formData = new FormData()
    groups.forEach((group) => {
      const supplier = suppliers.find((entry) => entry.id === group.supplierId)
      if (!supplier) return

      group.files.forEach((entry) => {
        formData.append("files", entry.file)
        formData.append("supplierNames", supplier.name)
      })
    })

    setIsSubmitting(true)
    const toastId = toast.loading("Enviando archivos para su procesamiento...")

    try {
      const response = await fetch("/api/price-lists/ingest", {
        method: "POST",
        body: formData,
      })

      const payload = (await response.json()) as {
        error?: string
        message?: string
        traceId?: string | null
      }

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo iniciar la carga masiva.")
      }

      toast.success("Carga iniciada", {
        id: toastId,
        description: [
          payload.message || "Los archivos fueron enviados correctamente para su procesamiento.",
          payload.traceId ? `ID de seguimiento: ${payload.traceId}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      })
      setGroups([])
    } catch (error) {
      toast.error("No se pudo iniciar la carga", {
        id: toastId,
        description:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado al enviar los archivos.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function clearAll() {
    setGroups([])
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Main area */}
        <div className="space-y-4">
          {isLoadingSuppliers ? (
            <div className="space-y-4">
              <Skeleton className="h-36 w-full rounded-2xl" />
              <Skeleton className="h-36 w-full rounded-2xl" />
            </div>
          ) : groups.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl border border-dashed border-primary/20 bg-[linear-gradient(145deg,color-mix(in_oklab,var(--color-primary)_8%,transparent),transparent_60%),linear-gradient(180deg,color-mix(in_oklab,var(--color-muted)_40%,transparent),transparent)] px-6 py-16 text-center shadow-sm">
              <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <div className="mx-auto flex max-w-lg flex-col items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10">
                  <UploadCloud className="size-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-foreground">
                    Comienza agregando un proveedor
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Cada proveedor tiene su propio bloque de archivos. Así podés cargar varias listas para un mismo proveedor sin mezclar el flujo.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <Badge variant="outline" className="border-primary/20 bg-background/70 text-primary">
                    XLSX / XLS / CSV
                  </Badge>
                  <Badge variant="outline" className="border-border/60 bg-background/70">
                    Procesamiento asistido
                  </Badge>
                </div>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <Button type="button" onClick={addSupplierGroup} className="shadow-sm">
                    <Plus className="size-4" />
                    Agregar proveedor existente
                  </Button>
                  <Button type="button" variant="outline" onClick={createGroupAndOpenSupplierSheet}>
                    Crear proveedor nuevo
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {summary.totalGroups} bloque(s) · {summary.totalFiles} archivo(s)
                </p>
                <Button type="button" variant="outline" size="sm" onClick={addSupplierGroup}>
                  <FolderPlus className="size-4" />
                  Agregar proveedor
                </Button>
              </div>

              {groups.map((group, index) => {
                const selectedSupplier = suppliers.find(
                  (supplier) => supplier.id === group.supplierId,
                )
                const usedSupplierIds = groups
                  .filter((candidate) => candidate.id !== group.id)
                  .map((candidate) => candidate.supplierId)
                  .filter((value) => value.length > 0)

                return (
                  <div
                    key={group.id}
                    className="overflow-hidden rounded-2xl border border-border/60 bg-background/90 shadow-sm animate-in fade-in-0 slide-in-from-bottom-2"
                  >
                    <div className="relative flex items-center justify-between gap-4 border-b border-border/50 px-5 py-4">
                      <div className="absolute left-0 top-0 h-full w-[3px] rounded-r-full bg-primary/60" />
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="border-primary/20 bg-background/80 text-primary">
                          Grupo {index + 1}
                        </Badge>
                        {selectedSupplier ? (
                          <span className="text-sm font-medium text-foreground">{selectedSupplier.name}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground/60">Proveedor pendiente</span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSupplierGroup(group.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        Quitar
                      </Button>
                    </div>

                    <div className="space-y-5 p-5">
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-foreground">Proveedor</p>
                          <Select
                            value={group.supplierId}
                            onValueChange={(value) => updateGroupSupplier(group.id, value)}
                          >
                            <SelectTrigger className="w-full bg-background">
                              <SelectValue placeholder="Selecciona un proveedor" />
                            </SelectTrigger>
                            <SelectContent>
                              {activeSuppliers.map((supplier) => (
                                <SelectItem
                                  key={supplier.id}
                                  value={supplier.id}
                                  disabled={
                                    usedSupplierIds.includes(supplier.id) &&
                                    supplier.id !== group.supplierId
                                  }
                                >
                                  {supplier.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => openCreateSupplier(group.id)}
                        >
                          <Plus className="size-4" />
                          Nuevo proveedor
                        </Button>
                      </div>

                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => fileInputRefs.current[group.id]?.click()}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault()
                          if (event.dataTransfer.files?.length) {
                            appendFilesToGroup(group.id, event.dataTransfer.files)
                          }
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            fileInputRefs.current[group.id]?.click()
                          }
                        }}
                        className="group cursor-pointer rounded-2xl border border-dashed border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.02),transparent_60%)] px-6 py-8 text-center transition-all duration-200 hover:border-primary/40 hover:bg-primary/5"
                      >
                        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10 transition-transform duration-200 group-hover:scale-105">
                            <UploadCloud className="size-5" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium text-foreground">
                              Agregar archivos para{" "}
                              {selectedSupplier?.name ?? "este proveedor"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {ACCEPTED_EXTENSIONS.join(", ").toUpperCase()} · haz clic o arrastra
                            </p>
                          </div>
                        </div>

                        <input
                          ref={(node) => {
                            fileInputRefs.current[group.id] = node
                          }}
                          type="file"
                          accept={ACCEPTED_EXTENSIONS.join(",")}
                          multiple
                          className="hidden"
                          onChange={(event) => {
                            if (!event.target.files?.length) return
                            appendFilesToGroup(group.id, event.target.files)
                            event.target.value = ""
                          }}
                        />
                      </div>

                      {group.files.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{group.files.length} archivo(s)</span>
                            <span>
                              {formatBytes(
                                group.files.reduce((total, entry) => total + entry.file.size, 0),
                              )}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {group.files.map((entry) => (
                              <div
                                key={entry.id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/80 px-4 py-2.5 transition-colors hover:border-primary/20"
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <FileSpreadsheet className="size-4 shrink-0 text-primary" />
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-foreground">{entry.file.name}</p>
                                    <p className="text-xs text-muted-foreground">{formatBytes(entry.file.size)}</p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeFile(group.id, entry.id)}
                                  className="size-7 shrink-0 text-muted-foreground/50 hover:text-destructive"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="rounded-xl border border-border/50 bg-muted/10 px-4 py-4 text-center text-sm text-muted-foreground">
                          Este bloque todavía no tiene archivos asociados.
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/90 shadow-sm animate-in fade-in-0 slide-in-from-right-2 duration-500">
            <div className="border-b border-border/50 px-5 py-4">
              <p className="text-sm font-semibold text-foreground">Resumen</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Estado general de la carga</p>
            </div>

            <div className="grid grid-cols-2 gap-px bg-border/40">
              <div className="bg-background px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Proveedores
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                  {summary.totalGroups}
                </p>
              </div>
              <div className="bg-background px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Archivos
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                  {summary.totalFiles}
                </p>
              </div>
            </div>

            <div className="divide-y divide-border/40 px-5">
              <div className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-muted-foreground">Listos</span>
                <span className={cn("font-medium tabular-nums", summary.readyGroups > 0 ? "text-emerald-700" : "text-foreground")}>
                  {summary.readyGroups}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-muted-foreground">Incompletos</span>
                <span className={cn("font-medium tabular-nums", summary.incompleteGroups > 0 ? "text-amber-700" : "text-foreground")}>
                  {summary.incompleteGroups}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-muted-foreground">Peso estimado</span>
                <span className="font-medium tabular-nums text-foreground">{formatBytes(summary.totalSize)}</span>
              </div>
            </div>

            <div className="border-t border-border/50 px-5 py-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Cómo funciona
              </p>
              <ol className="space-y-2.5">
                {[
                  "Agrega un proveedor al flujo.",
                  "Sube todas las listas que correspondan a ese proveedor.",
                  "Repite el proceso con los demás proveedores.",
                ].map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                    <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="border-t border-border/50 px-5 py-4 space-y-2">
              <Button
                type="button"
                className="w-full"
                onClick={handleSubmit}
                disabled={isSubmitting || groups.length === 0}
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowRightCircle className="size-4" />
                )}
                {isSubmitting ? "Iniciando carga..." : "Iniciar carga masiva"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={clearAll}
                disabled={isSubmitting || groups.length === 0}
              >
                Limpiar todo
              </Button>
            </div>
          </div>
        </aside>
      </div>

      <SupplierFormSheet
        open={isSupplierSheetOpen}
        supplier={null}
        onOpenChange={(open) => {
          setIsSupplierSheetOpen(open)
          if (!open) {
            setTargetGroupId(null)
          }
        }}
        onSaved={async (supplier) => {
          setSuppliers((current) => {
            const next = [...current, supplier]
            return next.sort((a, b) => a.name.localeCompare(b.name, "es"))
          })

          if (targetGroupId) {
            setGroups((current) =>
              current.map((group) =>
                group.id === targetGroupId
                  ? { ...group, supplierId: supplier.id }
                  : group,
              ),
            )
          }

          toast.success("Proveedor creado", {
            description: `Proveedor ${supplier.name} creado correctamente y listo para asociar archivos.`,
          })
        }}
      />
    </>
  )
}
