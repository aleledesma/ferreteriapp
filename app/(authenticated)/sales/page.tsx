"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  ReceiptText,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react"

import { SaleDetailSheet } from "@/components/sales/sale-detail-sheet"
import { Button } from "@/components/ui/button"

type SaleListItem = {
  id: string
  createdAt: string
  total: number | string
  customer: { firstName: string; lastName: string } | null
  _count?: { items: number }
}

export default function SalesHistoryPage() {
  const [sales, setSales]               = useState<SaleListItem[]>([])
  const [isLoading, setIsLoading]       = useState(true)
  const [page, setPage]                 = useState(1)
  const [totalPages, setTotalPages]     = useState(1)
  const [totalItems, setTotalItems]     = useState(0)
  const [search, setSearch]             = useState("")
  const [dateFrom, setDateFrom]         = useState("")
  const [dateTo, setDateTo]             = useState("")
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen]   = useState(false)

  // Refs para debounce de búsqueda y cancelación de requests
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef       = useRef<AbortController | null>(null)

  const loadSales = useCallback(async (opts: {
    page: number
    search: string
    dateFrom: string
    dateTo: string
  }) => {
    // Cancela el request anterior si sigue en vuelo
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    try {
      const query = new URLSearchParams({ page: opts.page.toString() })
      if (opts.search.trim())  query.set("search",    opts.search.trim())
      if (opts.dateFrom)       query.set("startDate", opts.dateFrom)
      if (opts.dateTo)         query.set("endDate",   `${opts.dateTo}T23:59:59`)

      const response = await fetch(`/api/sales?${query.toString()}`, {
        signal: controller.signal,
      })
      const data = await response.json()
      setSales(data.items || [])
      setTotalPages(data.pages || 1)
      setTotalItems(data.total || 0)
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Error cargando ventas:", err)
      }
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }, [])

  // Carga inicial
  useEffect(() => {
    void loadSales({ page: 1, search: "", dateFrom: "", dateTo: "" })
  }, [loadSales])

  // Búsqueda de texto: debounce 350ms, resetea página
  function handleSearchChange(value: string) {
    setSearch(value)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setPage(1)
      void loadSales({ page: 1, search: value, dateFrom, dateTo })
    }, 350)
  }

  // Fechas: inmediato, resetea página
  function handleDateFromChange(value: string) {
    setDateFrom(value)
    setPage(1)
    void loadSales({ page: 1, search, dateFrom: value, dateTo })
  }

  function handleDateToChange(value: string) {
    setDateTo(value)
    setPage(1)
    void loadSales({ page: 1, search, dateFrom, dateTo: value })
  }

  // Paginación: inmediato
  function goToPage(newPage: number) {
    setPage(newPage)
    void loadSales({ page: newPage, search, dateFrom, dateTo })
  }

  const hasFilters = !!(search || dateFrom || dateTo)

  function clearFilters() {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    setSearch("")
    setDateFrom("")
    setDateTo("")
    setPage(1)
    void loadSales({ page: 1, search: "", dateFrom: "", dateTo: "" })
  }

  function openDetail(id: string) {
    setSelectedSaleId(id)
    setIsSheetOpen(true)
  }

  return (
    <main className="min-h-full bg-muted/25 p-4 md:p-6 xl:p-8">
      <div className="mx-auto w-full max-w-[1400px] space-y-5">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
              Punto de venta
            </p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground leading-none">
              Historial de ventas
            </h1>
          </div>
          <Button
            asChild
            size="sm"
            className="h-9 gap-1.5 rounded-lg text-[13px] shadow-none"
          >
            <Link href="/sales/new">
              <Plus className="size-3.5" />
              Nueva venta
            </Link>
          </Button>
        </header>

        {/* ── Filtros ─────────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
          <div className="flex items-center gap-2 border-b border-border/50 px-5 py-3.5">
            <SlidersHorizontal className="size-3.5 text-muted-foreground/50" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
              Filtros
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors hover:bg-muted/60"
                style={{ color: "#3d6aff" }}
              >
                <X className="size-3" />
                Limpiar
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="text"
                  placeholder="Nombre, apellido o código de ticket…"
                  className="h-9 w-full rounded-lg border border-border/60 bg-muted/20 pl-9 pr-3 text-[13px] outline-none transition-all placeholder:text-muted-foreground/40 focus:border-[#3d6aff]/40 focus:bg-background focus:ring-2 focus:ring-[#3d6aff]/10"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">
                Desde
              </label>
              <input
                type="date"
                className="h-9 w-full rounded-lg border border-border/60 bg-muted/20 px-3 text-[13px] outline-none transition-all focus:border-[#3d6aff]/40 focus:bg-background focus:ring-2 focus:ring-[#3d6aff]/10"
                value={dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">
                Hasta
              </label>
              <input
                type="date"
                className="h-9 w-full rounded-lg border border-border/60 bg-muted/20 px-3 text-[13px] outline-none transition-all focus:border-[#3d6aff]/40 focus:bg-background focus:ring-2 focus:ring-[#3d6aff]/10"
                value={dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Tabla ───────────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-border/60 bg-background">

          {/* Cabecera de tabla */}
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                Registros
              </p>
              <p className="mt-0.5 text-[13px] font-semibold text-foreground">
                {isLoading
                  ? "Cargando…"
                  : `${totalItems} ${totalItems === 1 ? "venta" : "ventas"}`}
              </p>
            </div>
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ background: "rgba(61,106,255,0.07)", color: "#3d6aff" }}
            >
              {page} / {totalPages}
            </span>
          </div>

          {/* Contenido */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="mb-3 size-5 animate-spin opacity-40" />
              <p className="text-[13px]">Cargando registros…</p>
            </div>
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <ReceiptText className="mb-4 size-10 text-muted-foreground/20" />
              <p className="text-[14px] font-medium text-muted-foreground">Sin ventas para mostrar</p>
              <p className="mt-1 text-[12px] text-muted-foreground/60">
                {hasFilters
                  ? "Probá ajustando los filtros."
                  : "Las ventas registradas aparecerán acá."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                        Ticket
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                        Art.
                      </th>
                      <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                        Total
                      </th>
                      <th className="w-12 px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {sales.map((sale) => (
                      <tr
                        key={sale.id}
                        className="group cursor-pointer transition-colors hover:bg-muted/20"
                        onClick={() => openDetail(sale.id)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[12px] font-semibold tracking-wider text-foreground">
                              #{sale.id.slice(-6).toUpperCase()}
                            </span>
                            <span
                              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                              style={{ background: "rgba(5,150,105,0.10)", color: "#059669" }}
                            >
                              cobrado
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-[12px] text-foreground">
                            {new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(new Date(sale.createdAt))}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {new Intl.DateTimeFormat("es-AR", { timeStyle: "short" }).format(new Date(sale.createdAt))}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          {sale.customer ? (
                            <span className="text-[13px] text-foreground">
                              {sale.customer.lastName}, {sale.customer.firstName}
                            </span>
                          ) : (
                            <span className="text-[13px] text-muted-foreground">Consumidor final</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
                            {sale._count?.items ?? 0}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="font-mono text-[14px] font-semibold tabular-nums text-foreground">
                            ${Number(sale.total).toLocaleString("es-AR")}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <div className="flex size-7 items-center justify-center rounded-lg text-muted-foreground/40 transition-all group-hover:bg-muted group-hover:text-foreground">
                            <ChevronRight className="size-4" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y divide-border/40 md:hidden">
                {sales.map((sale) => (
                  <button
                    key={sale.id}
                    className="w-full p-4 text-left transition-colors hover:bg-muted/20 active:bg-muted/30"
                    onClick={() => openDetail(sale.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12px] font-semibold tracking-wider text-foreground">
                            #{sale.id.slice(-6).toUpperCase()}
                          </span>
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase"
                            style={{ background: "rgba(5,150,105,0.10)", color: "#059669" }}
                          >
                            cobrado
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] text-muted-foreground">
                          {new Intl.DateTimeFormat("es-AR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(sale.createdAt))}
                        </p>
                        <p className="mt-0.5 text-[13px] text-foreground">
                          {sale.customer
                            ? `${sale.customer.lastName}, ${sale.customer.firstName}`
                            : "Consumidor final"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-mono text-[14px] font-semibold tabular-nums text-foreground">
                          ${Number(sale.total).toLocaleString("es-AR")}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {sale._count?.items ?? 0} art.
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Paginación */}
          <div className="flex items-center justify-between border-t border-border/50 px-5 py-3.5">
            <p className="text-[12px] text-muted-foreground">
              Pág. <span className="font-semibold text-foreground">{page}</span> de{" "}
              <span className="font-semibold text-foreground">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => goToPage(page - 1)}
                className="h-8 gap-1 rounded-lg border-border/60 px-3 text-[12px] shadow-none"
              >
                <ChevronLeft className="size-3.5" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isLoading}
                onClick={() => goToPage(page + 1)}
                className="h-8 gap-1 rounded-lg border-border/60 px-3 text-[12px] shadow-none"
              >
                Siguiente
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <SaleDetailSheet
          saleId={selectedSaleId}
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
        />
      </div>
    </main>
  )
}
