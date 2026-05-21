"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, Filter, Loader2, Plus, ReceiptText, Search, Tag, User } from "lucide-react"

import { SaleDetailSheet } from "@/components/sales/sale-detail-sheet"
import { Button } from "@/components/ui/button"

type SaleListItem = {
  id: string
  createdAt: string
  total: number | string
  customer: {
    firstName: string
    lastName: string
  } | null
  _count?: {
    items: number
  }
}

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<SaleListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  useEffect(() => {
    async function loadSales() {
      setIsLoading(true)

      try {
        const dateToFull = dateTo ? `${dateTo}T23:59:59` : ""
        const query = new URLSearchParams({
          page: page.toString(),
          search,
          startDate: dateFrom,
          endDate: dateToFull,
        })

        const response = await fetch(`/api/sales?${query.toString()}`)
        const data = await response.json()

        setSales(data.items || [])
        setTotalPages(data.pages || 1)
        setTotalItems(data.total || 0)
      } catch (error) {
        console.error("Error cargando ventas:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(() => {
      loadSales()
    }, 500)

    return () => clearTimeout(timer)
  }, [dateFrom, dateTo, page, search])

  return (
    <main className="min-h-full bg-[radial-gradient(circle_at_top,_var(--color-primary)/5,_transparent_35%),linear-gradient(180deg,var(--color-background),color-mix(in_oklab,var(--color-muted)_45%,transparent))] p-4 md:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Módulo de Ventas</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Historial de Tickets</h1>
          </div>

          <Button asChild size="lg" className="h-12 w-full font-semibold shadow-md sm:w-auto">
            <Link href="/sales/new">
              <Plus className="mr-2 size-5" />
              Nueva Venta
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 items-end gap-4 rounded-xl border border-border/60 bg-background p-4 shadow-sm lg:grid-cols-4">
          <div className="space-y-1.5 lg:col-span-2">
            <label className="ml-1 text-[10px] font-bold uppercase text-muted-foreground">Buscar Ticket o Cliente</label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Nombre, apellido o código..."
                className="w-full rounded-lg border border-border bg-muted/5 py-2 pr-10 pl-10 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-[10px] font-bold uppercase text-muted-foreground">Desde</label>
            <input
              type="date"
              className="w-full rounded-lg border border-border bg-muted/5 p-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value)
                setPage(1)
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-[10px] font-bold uppercase text-muted-foreground">Hasta</label>
            <input
              type="date"
              className="w-full rounded-lg border border-border bg-muted/5 p-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ReceiptText className="size-4" />
              {totalItems} Ventas encontradas
            </h2>
            {search || dateFrom || dateTo ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("")
                  setDateFrom("")
                  setDateTo("")
                  setPage(1)
                }}
                className="h-7 text-[10px] font-bold uppercase text-primary"
              >
                Limpiar Filtros
              </Button>
            ) : null}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="mb-4 size-8 animate-spin text-primary/60" />
              <p className="text-sm font-medium">Filtrando registros...</p>
            </div>
          ) : sales.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <Filter className="mx-auto mb-4 size-12 text-muted-foreground/20" />
              <h3 className="text-lg font-semibold text-foreground">Sin resultados</h3>
              <p className="mt-1 text-sm text-muted-foreground">Probá cambiando las fechas o el texto de búsqueda.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {sales.map((sale) => (
                <div key={sale.id} className="group p-5 transition-colors hover:bg-muted/30">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                        <Calendar className="size-3.5" />
                        {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(sale.createdAt))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold tracking-tight text-foreground">Ticket #{sale.id.slice(-6).toUpperCase()}</span>
                        <div className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Cobrado
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="size-3.5" />
                        <span className="font-medium text-foreground/80">
                          {sale.customer ? `${sale.customer.lastName}, ${sale.customer.firstName}` : "Consumidor Final"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-8 md:justify-end">
                      <div className="text-left md:text-right">
                        <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground md:justify-end">
                          <Tag className="size-3" />
                          {sale._count?.items || 0} artículos
                        </div>
                        <div className="text-2xl font-black tabular-nums text-primary">${Number(sale.total).toLocaleString("es-AR")}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedSaleId(sale.id)
                          setIsSheetOpen(true)
                        }}
                        className="bg-muted shadow-sm transition-all hover:bg-primary hover:text-white"
                      >
                        <ArrowRight className="size-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border/60 bg-muted/10 px-6 py-4">
            <p className="text-xs text-muted-foreground">
              Página <span className="font-semibold text-foreground">{page}</span> de <span className="font-semibold text-foreground">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || isLoading} onClick={() => setPage((prev) => prev - 1)} className="h-8 px-3 text-xs">
                <ChevronLeft className="mr-1 size-3.5" />
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages || isLoading} onClick={() => setPage((prev) => prev + 1)} className="h-8 px-3 text-xs">
                Siguiente
                <ChevronRight className="ml-1 size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <SaleDetailSheet saleId={selectedSaleId} open={isSheetOpen} onOpenChange={setIsSheetOpen} />
      </div>
    </main>
  )
}
