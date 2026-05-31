"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UploadCloud,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import type { ImportJobDto } from "@/lib/dal/import-jobs-dal"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// ── Helpers ────────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60)  return "Ahora"
  const mins = Math.floor(secs / 60)
  if (mins < 60)  return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

type FetchResult = { items: ImportJobDto[]; total: number; pages: number }

async function fetchJobsPage(page: number, pageSize: number): Promise<FetchResult> {
  const res = await fetch(`/api/import-jobs?page=${page}&pageSize=${pageSize}`)
  if (!res.ok) throw new Error("Error al cargar cargas")
  return res.json() as Promise<FetchResult>
}

// ── Fila compacta (widget) ─────────────────────────────────────────────────────

function CompactJobRow({ job }: { job: ImportJobDto }) {
  const total = job.productsCreated + job.productsUpdated

  return (
    <div className="flex items-start gap-2.5 px-4 py-2.5">
      <div className="mt-[3px] flex-none">
        {job.status === "IN_PROGRESS" && (
          <Loader2 className="size-3 animate-spin" style={{ color: "#3d6aff" }} />
        )}
        {job.status === "COMPLETED" && (
          <span className="inline-block size-2 rounded-full bg-emerald-500" />
        )}
        {job.status === "FAILED" && (
          <span className="inline-block size-2 rounded-full bg-red-400" />
        )}
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="truncate text-[12px] font-medium text-foreground leading-tight">
          {job.supplierNames}
        </p>
        <p className="mt-0.5 truncate text-[10px] leading-tight">
          {job.status === "IN_PROGRESS" && (
            <span className="text-muted-foreground">Procesando…</span>
          )}
          {job.status === "COMPLETED" && (
            <span className="text-muted-foreground">
              {total} producto{total !== 1 ? "s" : ""}
            </span>
          )}
          {job.status === "FAILED" && (
            <span className="text-red-500/70">
              {job.errorMessage?.slice(0, 45) ?? "Error desconocido"}
            </span>
          )}
        </p>
      </div>
      <span className="flex-none pt-[2px] text-[10px] text-muted-foreground/60">
        {relativeTime(job.createdAt)}
      </span>
    </div>
  )
}

// ── Fila completa (modal) ──────────────────────────────────────────────────────

function StatusChip({ status }: { status: ImportJobDto["status"] }) {
  if (status === "IN_PROGRESS") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{ background: "rgba(61,106,255,0.08)", color: "#3d6aff" }}>
        <Loader2 className="size-2.5 animate-spin" />
        En proceso
      </span>
    )
  }
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{ background: "rgba(5,150,105,0.10)", color: "#059669" }}>
        <CheckCircle2 className="size-2.5" />
        Completada
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626" }}>
      <XCircle className="size-2.5" />
      Fallida
    </span>
  )
}

function FullJobRow({ job }: { job: ImportJobDto }) {
  const total = job.productsCreated + job.productsUpdated
  const time  = job.completedAt ?? job.createdAt

  return (
    <div className="flex items-start gap-3 px-5 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-foreground">{job.supplierNames}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {job.status === "IN_PROGRESS" && "Procesando…"}
          {job.status === "COMPLETED" && `${total} procesados · ${job.productsCreated} nuevos · ${job.productsUpdated} actualizados`}
          {job.status === "FAILED" && (
            <span className="text-red-500/80">{job.errorMessage ?? "Error desconocido"}</span>
          )}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <StatusChip status={job.status} />
        <p className="mt-1 text-[10px] text-muted-foreground">{relativeTime(time)}</p>
      </div>
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────────────

function ImportJobsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [jobs, setJobs]       = useState<ImportJobDto[]>([])
  const [total, setTotal]     = useState(0)
  const [pages, setPages]     = useState(1)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(false)
  const PAGE_SIZE = 10

  const load = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const data = await fetchJobsPage(p, PAGE_SIZE)
      setJobs(data.items)
      setTotal(data.total)
      setPages(data.pages)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) void load(page)
  }, [open, page, load])

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="border-b border-border/50 px-6 py-4">
          <DialogTitle className="text-[15px] font-semibold">
            Historial de cargas masivas
          </DialogTitle>
          <p className="text-[12px] text-muted-foreground">
            {total} {total === 1 ? "carga registrada" : "cargas registradas"}
          </p>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-5 animate-spin text-muted-foreground/40" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <UploadCloud className="mb-3 size-8 opacity-30" />
              <p className="text-[13px]">Sin cargas registradas</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {jobs.map((job) => <FullJobRow key={job.id} job={job} />)}
            </div>
          )}
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-border/50 px-6 py-3">
            <p className="text-[12px] text-muted-foreground">
              Pág. <span className="font-semibold text-foreground">{page}</span> de{" "}
              <span className="font-semibold text-foreground">{pages}</span>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || loading}
                onClick={() => setPage(p => p - 1)}
                className="h-8 gap-1 rounded-lg border-border/60 px-3 text-[12px] shadow-none">
                <ChevronLeft className="size-3.5" />Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={page >= pages || loading}
                onClick={() => setPage(p => p + 1)}
                className="h-8 gap-1 rounded-lg border-border/60 px-3 text-[12px] shadow-none">
                Siguiente<ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Widget principal (compacto) ────────────────────────────────────────────────

const POLL_INTERVAL = 8_000
const WIDGET_SIZE   = 3

export function ImportJobsWidget() {
  const [jobs, setJobs]         = useState<ImportJobDto[]>([])
  const [total, setTotal]       = useState(0)
  const [isLoading, setLoading] = useState(true)
  const [modalOpen, setModal]   = useState(false)

  const prevJobsRef = useRef<ImportJobDto[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchJobs = useCallback(async () => {
    try {
      const data = await fetchJobsPage(1, WIDGET_SIZE)

      const prev = prevJobsRef.current
      for (const job of data.items) {
        const was = prev.find((p) => p.id === job.id)
        if (was?.status === "IN_PROGRESS") {
          if (job.status === "COMPLETED") {
            const count = job.productsCreated + job.productsUpdated
            toast.success("Carga finalizada", {
              description: `${count} producto${count !== 1 ? "s" : ""} procesados de ${job.supplierNames}.`,
            })
          } else if (job.status === "FAILED") {
            toast.error("Carga fallida", {
              description: job.errorMessage ?? "Ocurrió un error durante la importación.",
            })
          }
        }
      }
      prevJobsRef.current = data.items

      setJobs(data.items)
      setTotal(data.total)

      const hasActive = data.items.some((j) => j.status === "IN_PROGRESS")
      if (hasActive && !intervalRef.current) {
        intervalRef.current = setInterval(() => void fetchJobs(), POLL_INTERVAL)
      } else if (!hasActive && intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchJobs()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchJobs])

  const hasInProgress = jobs.some((j) => j.status === "IN_PROGRESS")

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background">

        {/* Header compacto */}
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <UploadCloud className="size-3.5 text-muted-foreground/60" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
              Cargas masivas
            </p>
          </div>
          {hasInProgress && <Loader2 className="size-3 animate-spin" style={{ color: "#3d6aff" }} />}
          {!hasInProgress && total > 0 && (
            <span className="text-[10px] text-muted-foreground">{total}</span>
          )}
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="size-3.5 animate-spin text-muted-foreground/30" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-6 text-center">
            <UploadCloud className="size-5 text-muted-foreground/20" />
            <p className="text-[11px] text-muted-foreground/60">Sin cargas registradas</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {jobs.map((job) => <CompactJobRow key={job.id} job={job} />)}
          </div>
        )}

        {/* "Ver más" */}
        {total > WIDGET_SIZE && (
          <button
            onClick={() => setModal(true)}
            className="w-full border-t border-border/50 px-4 py-2 text-left text-[11px] text-muted-foreground transition-colors hover:bg-muted/20 hover:text-foreground"
          >
            Ver historial completo ({total - WIDGET_SIZE} más)
          </button>
        )}
      </div>

      <ImportJobsModal open={modalOpen} onClose={() => setModal(false)} />
    </>
  )
}
