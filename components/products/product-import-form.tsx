"use client"

import { useMemo, useRef, useState } from "react"
import { FileSpreadsheet, Loader2, Sparkles, Trash2, UploadCloud } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type UploadEntry = {
  id: string
  file: File
  supplierName: string
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

export function ProductImportForm() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [entries, setEntries] = useState<UploadEntry[]>([])
  const [notice, setNotice] = useState<Notice | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)

  const summary = useMemo(() => {
    const totalFiles = entries.length
    const completeFiles = entries.filter((entry) => entry.supplierName.trim().length > 0).length
    const totalSize = entries.reduce((sum, entry) => sum + entry.file.size, 0)

    return {
      totalFiles,
      completeFiles,
      missingSupplierCount: totalFiles - completeFiles,
      totalSize,
    }
  }, [entries])

  const supplierGroups = useMemo(() => {
    const groups = new Map<string, UploadEntry[]>()

    for (const entry of entries) {
      const supplierName = entry.supplierName.trim()
      if (!supplierName) {
        continue
      }

      const currentGroup = groups.get(supplierName) ?? []
      currentGroup.push(entry)
      groups.set(supplierName, currentGroup)
    }

    return Array.from(groups.entries()).map(([supplierName, supplierEntries]) => ({
      supplierName,
      count: supplierEntries.length,
      totalSize: supplierEntries.reduce((total, entry) => total + entry.file.size, 0),
    }))
  }, [entries])

  function appendFiles(fileList: FileList | File[]) {
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
    setEntries((current) => [
      ...current,
      ...files.map((file) => ({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        supplierName: "",
      })),
    ])
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files?.length) {
      return
    }

    appendFiles(event.target.files)
    event.target.value = ""
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragActive(false)

    if (event.dataTransfer.files?.length) {
      appendFiles(event.dataTransfer.files)
    }
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragActive(true)
  }

  function handleDragLeave() {
    setIsDragActive(false)
  }

  function updateSupplierName(entryId: string, supplierName: string) {
    setEntries((current) =>
      current.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              supplierName,
            }
          : entry,
      ),
    )
  }

  function applySupplierToRemaining(entryId: string) {
    const sourceEntry = entries.find((entry) => entry.id === entryId)
    const supplierName = sourceEntry?.supplierName.trim()

    if (!supplierName) {
      return
    }

    setEntries((current) =>
      current.map((entry) =>
        entry.id !== entryId && entry.supplierName.trim().length === 0
          ? {
              ...entry,
              supplierName,
            }
          : entry,
      ),
    )
  }

  function removeEntry(entryId: string) {
    setEntries((current) => current.filter((entry) => entry.id !== entryId))
  }

  function clearEntries() {
    setEntries([])
    setNotice(null)
  }

  async function handleSubmit() {
    if (!entries.length) {
      setNotice({
        tone: "error",
        title: "Carga incompleta",
        message: "Agrega al menos un archivo para iniciar la carga masiva.",
      })
      return
    }

    const invalidEntry = entries.find((entry) => entry.supplierName.trim().length === 0)
    if (invalidEntry) {
      setNotice({
        tone: "error",
        title: "Proveedor faltante",
        message: `Completa el proveedor asociado al archivo ${invalidEntry.file.name}.`,
      })
      return
    }

    const formData = new FormData()
    entries.forEach((entry) => {
      formData.append("files", entry.file)
      formData.append("supplierNames", entry.supplierName.trim())
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
      setEntries([])
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

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Card className="border-primary/10 bg-background/85 shadow-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="size-5 text-primary" />
              Carga masiva de productos
            </CardTitle>
            <CardDescription>
              Sube una o varias listas de precios, indica el proveedor correspondiente y deja que el sistema las procese automáticamente con inteligencia artificial.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              role="button"
              tabIndex={0}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
              className={[
                "group cursor-pointer rounded-2xl border border-dashed p-8 text-center transition-all duration-300",
                isDragActive
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border/70 bg-muted/20 hover:border-primary/40 hover:bg-primary/5",
              ].join(" ")}
            >
              <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
                  <UploadCloud className="size-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-medium">Arrastra archivos aquí o haz clic para seleccionarlos</p>
                  <p className="text-sm text-muted-foreground">
                    Formatos soportados: {ACCEPTED_EXTENSIONS.join(", ").toUpperCase()}
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS.join(",")}
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />
            </div>

            {notice ? (
              <Alert
                variant={notice.tone === "error" ? "destructive" : "success"}
                className="animate-in fade-in-0 slide-in-from-top-2 duration-300"
              >
                <AlertDescription>
                  <span className="font-medium">{notice.title}.</span> {notice.message}
                  {notice.traceId ? (
                    <span className="mt-1 block text-xs text-muted-foreground">
                      ID de seguimiento: {notice.traceId}
                    </span>
                  ) : null}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-4">
              {entries.length === 0 ? (
                <div className="rounded-xl border border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
                  Todavía no agregaste archivos. Cuando subas una lista, aquí podrás asignarle el proveedor antes de iniciar la carga.
                </div>
              ) : (
                entries.map((entry, index) => {
                  const isReady = entry.supplierName.trim().length > 0

                  const sameSupplierCount = entries.filter(
                    (candidate) => candidate.supplierName.trim() === entry.supplierName.trim() && entry.supplierName.trim().length > 0,
                  ).length

                  return (
                    <Card
                      key={entry.id}
                      className="border-border/70 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md animate-in fade-in-0 slide-in-from-bottom-2"
                    >
                      <CardContent className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_260px_auto] md:items-center">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="size-4 text-primary" />
                            <p className="font-medium text-foreground">{entry.file.name}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">Archivo {index + 1}</Badge>
                            <Badge variant="outline">{formatBytes(entry.file.size)}</Badge>
                            <Badge variant={isReady ? "secondary" : "outline"}>
                              {isReady ? "Listo para enviar" : "Falta proveedor"}
                            </Badge>
                            {sameSupplierCount > 1 ? (
                              <Badge variant="secondary">Proveedor repetido en {sameSupplierCount} archivos</Badge>
                            ) : null}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Label htmlFor={`supplier-${entry.id}`}>Proveedor asociado</Label>
                            <button
                              type="button"
                              className="text-xs text-primary underline-offset-4 hover:underline"
                              onClick={() => applySupplierToRemaining(entry.id)}
                            >
                              Aplicar a archivos vacíos
                            </button>
                          </div>
                          <Input
                            id={`supplier-${entry.id}`}
                            value={entry.supplierName}
                            onChange={(event) => updateSupplierName(entry.id, event.target.value)}
                            placeholder="Ej. Ferretería Pepe"
                          />
                        </div>

                        <div className="flex justify-end md:justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeEntry(entry.id)}
                            className="text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <Card className="border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm animate-in fade-in-0 slide-in-from-right-2 duration-500">
          <CardHeader>
            <CardTitle>Resumen de la carga</CardTitle>
            <CardDescription>Revisa el estado antes de enviar los archivos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
              <span className="text-muted-foreground">Archivos</span>
              <span className="font-medium">{summary.totalFiles}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
              <span className="text-muted-foreground">Con proveedor</span>
              <span className="font-medium">{summary.completeFiles}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
              <span className="text-muted-foreground">Pendientes</span>
              <span className="font-medium">{summary.missingSupplierCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
              <span className="text-muted-foreground">Peso estimado</span>
              <span className="font-medium">{formatBytes(summary.totalSize)}</span>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-muted-foreground">
              El proceso corre en segundo plano. Puedes cargar varios archivos para un mismo proveedor: el sistema los agrupará antes de procesarlos.
            </div>

            {supplierGroups.length > 0 ? (
              <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-4">
                <p className="text-sm font-medium text-foreground">Agrupación por proveedor</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {supplierGroups.map((group) => (
                    <div key={group.supplierName} className="flex items-center justify-between gap-3 rounded-lg bg-background/80 px-3 py-2">
                      <div>
                        <p className="font-medium text-foreground">{group.supplierName}</p>
                        <p>{group.count} archivo(s)</p>
                      </div>
                      <Badge variant="outline">{formatBytes(group.totalSize)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              <Button
                type="button"
                className="w-full"
                onClick={handleSubmit}
                disabled={isSubmitting || entries.length === 0}
              >
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {isSubmitting ? "Iniciando carga..." : "Iniciar carga masiva"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={clearEntries}
                disabled={isSubmitting || entries.length === 0}
              >
                Limpiar archivos
              </Button>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
