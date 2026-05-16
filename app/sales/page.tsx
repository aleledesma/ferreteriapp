"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Plus, ReceiptText, Calendar, User, Tag, ArrowRight, 
  Loader2, ChevronLeft, ChevronRight, Search, X, Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SaleDetailSheet } from "@/components/sales/sale-detail-sheet"

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<any[]>([]) // Lista de tickets
  const [isLoading, setIsLoading] = useState(true) // Estado de carga
  
  // ESTADOS PARA PAGINACIÓN, BÚSQUEDA Y FECHAS
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // ESTADOS PARA EL DETALLE
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  useEffect(() => {
    async function loadSales() {
      setIsLoading(true)
      try {
        const dateToFull = dateTo ? `${dateTo}T23:59:59` : ""
        const query = new URLSearchParams({
          page: page.toString(),
          search: search,
          startDate: dateFrom,
          endDate: dateToFull
        })

        const res = await fetch(`/api/sales?${query.toString()}`)
        const data = await res.json()
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
  }, [page, search, dateFrom, dateTo]) // Reacciona a cualquier cambio de filtro

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-primary)/5,_transparent_35%),linear-gradient(180deg,var(--color-background),color-mix(in_oklab,var(--color-muted)_45%,transparent))] p-4 md:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Módulo de Ventas
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Historial de Tickets
            </h1>
          </div>
          
          <Button asChild size="lg" className="h-12 w-full sm:w-auto font-semibold shadow-md">
            <Link href="/sales/new">
              <Plus className="mr-2 size-5" />
              Nueva Venta
            </Link>
          </Button>
        </div>

        {/* PANEL DE FILTROS */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end bg-background p-4 rounded-xl border border-border/60 shadow-sm">
          {/* BUSCADOR POR TEXTO */}
          <div className="lg:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Buscar Ticket o Cliente</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Nombre, apellido o código..."
                className="w-full pl-10 pr-10 py-2 rounded-lg border border-border bg-muted/5 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          {/* FECHA DESDE */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Desde</label>
            <input
              type="date"
              className="w-full p-2 rounded-lg border border-border bg-muted/5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            />
          </div>

          {/* FECHA HASTA */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Hasta</label>
            <input
              type="date"
              className="w-full p-2 rounded-lg border border-border bg-muted/5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* CONTENEDOR DE LA LISTA */}
        <div className="rounded-xl border border-border/60 bg-background shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border/60 bg-muted/20 flex justify-between items-center">
            <h2 className="font-medium flex items-center gap-2 text-muted-foreground text-sm">
              <ReceiptText className="size-4" /> 
              {totalItems} Ventas encontradas
            </h2>
            {(search || dateFrom || dateTo) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); setPage(1); }}
                className="h-7 text-[10px] uppercase font-bold text-primary"
              >
                Limpiar Filtros
              </Button>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="size-8 animate-spin mb-4 text-primary/60" />
              <p className="text-sm font-medium">Filtrando registros...</p>
            </div>
          ) : sales.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <Filter className="mx-auto mb-4 size-12 text-muted-foreground/20" />
              <h3 className="text-lg font-semibold text-foreground">Sin resultados</h3>
              <p className="text-sm text-muted-foreground mt-1">Probá cambiando las fechas o el texto de búsqueda.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {sales.map((sale) => (
                <div key={sale.id} className="group p-5 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                        <Calendar className="size-3.5" />
                        {new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(sale.createdAt))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-foreground tracking-tight">
                          Ticket #{sale.id.slice(-6).toUpperCase()}
                        </span>
                        <div className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">
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

                    <div className="flex items-center justify-between md:justify-end gap-8">
                      <div className="text-left md:text-right">
                        <div className="flex items-center md:justify-end gap-1.5 text-muted-foreground text-[11px] mb-1">
                          <Tag className="size-3" />
                          {sale._count?.items || 0} artículos
                        </div>
                        <div className="text-2xl font-black text-primary tabular-nums">
                          ${Number(sale.total).toLocaleString("es-AR")}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { setSelectedSaleId(sale.id); setIsSheetOpen(true); }}
                        className="bg-muted hover:bg-primary hover:text-white transition-all shadow-sm"
                      >
                        <ArrowRight className="size-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PAGINACIÓN */}
          <div className="flex items-center justify-between px-6 py-4 bg-muted/10 border-t border-border/60">
            <p className="text-xs text-muted-foreground">
              Página <span className="font-semibold text-foreground">{page}</span> de <span className="font-semibold text-foreground">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage(prev => prev - 1)}
                className="h-8 px-3 text-xs"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage(prev => prev + 1)}
                className="h-8 px-3 text-xs"
              >
                Siguiente
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