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

import { SupplierFormSheet } from "@/components/suppliers/supplier-form-sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

type Notice = {
  tone: "success" | "error"
  title: string
  message: string
  traceId?: string | null
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
  const [notice, setNotice] = useState<Notice | null>(null)
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
        setNotice({
          tone: "error",
          title: "No se pudo cargar proveedores",
          message:
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

    return {
      totalGroups,
      totalFiles,
      totalSize,
      readyGroups,
      incompleteGroups,
    }
  }, [groups])

  function addSupplierGroup() {
    setGroups((current) => [...current, createSupplierGroup()])
    setNotice(null)
  }

  function removeSupplierGroup(groupId: string) {
    setGroups((current) => current.filter((group) => group.id !== groupId))
  }

  function updateGroupSupplier(groupId: string, supplierId: string) {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              supplierId,
            }
          : group,
      ),
    )
  }

  function removeFile(groupId: string, fileId: string) {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              files: group.files.filter((entry) => entry.id !== fileId),
            }
          : group,
      ),
    )
  }

  function appendFilesToGroup(groupId: string, fileList: FileList | File[]) {
    const files = Array.from(fileList)
    const invalidFile = files.find((file) => !isSupportedFile(file))

    if (invalidFile) {
      setNotice({
        tone: "error",
        title: "Formato no soportado",
        message: `El archivo ${invalidFile.name} no es compatible. Usa XLSX, XLS o CSV.`,
      })
      return
    }

    setNotice(null)
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              files: [...group.files, ...files.map(createUploadFileEntry)],
            }
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
      setNotice({
        tone: "error",
        title: "Carga incompleta",
        message:
          "Agrega al menos un proveedor antes de iniciar la carga masiva.",
      })
      return
    }

    const invalidGroup = groups.find(
      (group) => group.supplierId.length === 0 || group.files.length === 0,
    )

    if (invalidGroup) {
      setNotice({
        tone: "error",
        title: "Grupo incompleto",
        message:
          invalidGroup.supplierId.length === 0
            ? "Selecciona un proveedor para cada grupo antes de continuar."
            : "Cada proveedor debe tener al menos un archivo cargado.",
      })
      return
    }

    const formData = new FormData()
    groups.forEach((group) => {
      const supplier = suppliers.find((entry) => entry.id === group.supplierId)
      if (!supplier) {
        return
      }

      group.files.forEach((entry) => {
        formData.append("files", entry.file)
        formData.append("supplierNames", supplier.name)
      })
    })

    setIsSubmitting(true)
    setNotice(null)

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

      setNotice({
        tone: "success",
        title: "Carga iniciada",
        message:
          payload.message ||
          "Los archivos fueron enviados correctamente para su procesamiento con inteligencia artificial.",
        traceId: payload.traceId,
      })
      setGroups([])
    } catch (error) {
      setNotice({
        tone: "error",
        title: "No se pudo iniciar la carga",
        message:
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
    setNotice(null)
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card className="overflow-hidden border-primary/10 bg-background/88 shadow-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
            <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  Carga masiva de productos
                </CardTitle>
                <CardDescription>
                  Organiza la carga por proveedor: selecciona un proveedor
                  existente, agrupa allí todos sus archivos y deja que el
                  sistema los procese automáticamente con inteligencia
                  artificial.
                </CardDescription>
              </div>
              {groups.length !== 0 && (
                <Button
                  type="button"
                  onClick={addSupplierGroup}
                  className="shadow-sm"
                >
                  <FolderPlus className="size-4" />
                  Agregar archivos para otro proveedor
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.02))]">
              {notice ? (
                <Alert
                  variant={notice.tone === "error" ? "destructive" : "success"}
                  className="animate-in fade-in-0 slide-in-from-top-2 duration-300"
                >
                  <AlertDescription>
                    <span className="font-medium">{notice.title}.</span>{" "}
                    {notice.message}
                    {notice.traceId ? (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        ID de seguimiento: {notice.traceId}
                      </span>
                    ) : null}
                  </AlertDescription>
                </Alert>
              ) : null}

              {isLoadingSuppliers ? (
                <div className="space-y-4">
                  <Skeleton className="h-36 w-full rounded-3xl" />
                  <Skeleton className="h-36 w-full rounded-3xl" />
                </div>
              ) : groups.length === 0 ? (
                <div className="relative overflow-hidden rounded-3xl border border-dashed border-primary/20 bg-[linear-gradient(145deg,color-mix(in_oklab,var(--color-primary)_8%,transparent),transparent_60%),linear-gradient(180deg,color-mix(in_oklab,var(--color-muted)_40%,transparent),transparent)] px-6 py-14 text-center shadow-sm">
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
                        Cada proveedor tendrá su propio bloque de archivos. Así
                        podrás cargar varias listas para un mismo proveedor sin
                        mezclar el flujo.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <Badge
                        variant="outline"
                        className="border-primary/20 bg-background/70 text-primary"
                      >
                        XLSX / XLS / CSV
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-border/60 bg-background/70"
                      >
                        Procesamiento asistido
                      </Badge>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                      <Button
                        type="button"
                        onClick={addSupplierGroup}
                        className="shadow-sm"
                      >
                        <Plus className="size-4" />
                        Agregar listas para un proveedor existente
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={createGroupAndOpenSupplierSheet}
                      >
                        Crear proveedor nuevo
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {groups.map((group, index) => {
                    const selectedSupplier = suppliers.find(
                      (supplier) => supplier.id === group.supplierId,
                    )
                    const usedSupplierIds = groups
                      .filter((candidate) => candidate.id !== group.id)
                      .map((candidate) => candidate.supplierId)
                      .filter((value) => value.length > 0)

                    return (
                      <Card
                        key={group.id}
                        className="overflow-hidden border-border/70 shadow-xs animate-in fade-in-0 slide-in-from-bottom-2"
                      >
                        <CardHeader className="relative gap-4 border-b bg-[linear-gradient(135deg,rgba(255,255,255,0.02),transparent_60%),linear-gradient(180deg,transparent,rgba(255,255,255,0.02))] lg:flex-row lg:items-start lg:justify-between">
                          <div className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-primary/60" />
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className="border-primary/20 bg-background/80 text-primary"
                              >
                                Grupo {index + 1}
                              </Badge>
                              {selectedSupplier ? (
                                <Badge variant="secondary">
                                  {selectedSupplier.name}
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  Proveedor pendiente
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg">
                              Proveedor {index + 1}
                            </CardTitle>
                            <CardDescription>
                              Selecciona un proveedor y agrega aquí todas las
                              listas que correspondan a ese mismo proveedor.
                            </CardDescription>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSupplierGroup(group.id)}
                            className="self-start text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                            Quitar bloque
                          </Button>
                        </CardHeader>
                        <CardContent className="space-y-5 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.015))] pt-6">
                          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-foreground">
                                Proveedor
                              </p>
                              <Select
                                value={group.supplierId}
                                onValueChange={(value) =>
                                  updateGroupSupplier(group.id, value)
                                }
                              >
                                <SelectTrigger className="w-full bg-background shadow-xs">
                                  <SelectValue placeholder="Selecciona un proveedor existente" />
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
                              Crear proveedor nuevo
                            </Button>
                          </div>

                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() =>
                              fileInputRefs.current[group.id]?.click()
                            }
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              event.preventDefault()
                              if (event.dataTransfer.files?.length) {
                                appendFilesToGroup(
                                  group.id,
                                  event.dataTransfer.files,
                                )
                              }
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault()
                                fileInputRefs.current[group.id]?.click()
                              }
                            }}
                            className="group cursor-pointer rounded-3xl border border-dashed border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.02),transparent_60%)] px-6 py-9 text-center transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5"
                          >
                            <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10 transition-transform duration-300 group-hover:scale-105">
                                <UploadCloud className="size-6" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-base font-medium text-foreground">
                                  Agregar archivos para{" "}
                                  {selectedSupplier?.name ?? "este proveedor"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Puedes subir una o varias listas. Formatos
                                  soportados:{" "}
                                  {ACCEPTED_EXTENSIONS.join(", ").toUpperCase()}
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
                                if (!event.target.files?.length) {
                                  return
                                }

                                appendFilesToGroup(group.id, event.target.files)
                                event.target.value = ""
                              }}
                            />
                          </div>

                          {group.files.length > 0 ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>
                                  {group.files.length} archivo(s) cargado(s)
                                </span>
                                <span>
                                  {formatBytes(
                                    group.files.reduce(
                                      (total, entry) => total + entry.file.size,
                                      0,
                                    ),
                                  )}
                                </span>
                              </div>

                              <div className="space-y-2">
                                {group.files.map((entry) => (
                                  <div
                                    key={entry.id}
                                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/90 px-4 py-3 shadow-xs transition-all duration-200 hover:border-primary/20 hover:shadow-sm"
                                  >
                                    <div className="min-w-0 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <FileSpreadsheet className="size-4 text-primary" />
                                        <p className="truncate font-medium text-foreground">
                                          {entry.file.name}
                                        </p>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {formatBytes(entry.file.size)}
                                      </p>
                                    </div>

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        removeFile(group.id, entry.id)
                                      }
                                      className="text-muted-foreground hover:text-destructive"
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-border/70 bg-muted/15 px-4 py-6 text-center text-sm text-muted-foreground">
                              Este proveedor todavía no tiene archivos
                              asociados.
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm animate-in fade-in-0 slide-in-from-right-2 duration-500">
            <CardHeader>
              <CardTitle>Resumen de la carga</CardTitle>
              <CardDescription>
                Revisa el estado general antes de enviar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 shadow-xs">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Proveedores
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {summary.totalGroups}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 shadow-xs">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Archivos
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {summary.totalFiles}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-muted-foreground">Proveedores</span>
                <span className="font-medium">{summary.totalGroups}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-muted-foreground">Archivos</span>
                <span className="font-medium">{summary.totalFiles}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-muted-foreground">Bloques listos</span>
                <span className="font-medium">{summary.readyGroups}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-muted-foreground">
                  Bloques incompletos
                </span>
                <span className="font-medium">{summary.incompleteGroups}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-muted-foreground">Peso estimado</span>
                <span className="font-medium">
                  {formatBytes(summary.totalSize)}
                </span>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-muted-foreground shadow-xs">
                Selecciona proveedores existentes o crea uno nuevo en el
                momento. Después podrás subir varias listas dentro del mismo
                bloque del proveedor para mantener la carga ordenada y clara.
              </div>

              <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4 shadow-xs">
                <p className="text-sm font-medium text-foreground">
                  Formato de trabajo recomendado
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                      1
                    </span>
                    <span>Agrega un proveedor al flujo.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                      2
                    </span>
                    <span>
                      Sube todas las listas que correspondan a ese proveedor.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                      3
                    </span>
                    <span>Repite el proceso con los demás proveedores.</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
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
            </CardContent>
          </Card>
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
                  ? {
                      ...group,
                      supplierId: supplier.id,
                    }
                  : group,
              ),
            )
          }

          setNotice({
            tone: "success",
            title: "Proveedor creado",
            message: `Proveedor ${supplier.name} creado correctamente y listo para asociar archivos.`,
          })
        }}
      />
    </>
  )
}
