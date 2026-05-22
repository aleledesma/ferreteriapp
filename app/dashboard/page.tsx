"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Receipt, AlertTriangle, Loader2 } from "lucide-react"

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week")
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/reports?range=${timeRange}`)
        if (!response.ok) throw new Error("Error en la respuesta")
        const resData = await response.json()
        setData(resData)
      } catch (error) {
        console.error("Error al cargar las métricas:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadDashboardData()
  }, [timeRange])

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes y Estadísticas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Métricas
          </p>
        </div>

        {/* SELECTOR TEMPORAL */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border shadow-sm">
          <button
            onClick={() => setTimeRange("day")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              timeRange === "day" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setTimeRange("week")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              timeRange === "week" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Esta Semana
          </button>
          <button
            onClick={() => setTimeRange("month")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              timeRange === "month" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Este Mes
          </button>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="h-96 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Conectando con la base de datos de la ferretería...</p>
        </div>
      ) : (
        <>
          {/* Indicadores de Rendimiento */}
          <div className="grid gap-4 md:grid-cols-2">
            
            <Card className="shadow-sm border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Obtenidos</CardTitle>
                <DollarSign className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(data?.summary?.totalRevenue || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Recaudación acumulada</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tickets Emitidos</CardTitle>
                <Receipt className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.summary?.salesCount || 0} vtas.</div>
                <p className="text-xs text-muted-foreground mt-1">Transacciones en caja</p>
              </CardContent>
            </Card>

          </div>

          {/* GRÁFICOS Y DETALLES */}
          <div className="grid gap-4 md:grid-cols-3">
            
            <Card className="md:col-span-2 shadow-sm border">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Evolución de Ventas</CardTitle>
                <CardDescription>Visualización de ingresos agrupados por jornada.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {/* GRÁFICO DE VENTAS */}
              </CardContent>
            </Card>

            <div className="space-y-4">
              {/* ARTÍCULOS ESTRELLA */}
              <Card className="shadow-sm border">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Artículos Estrella</CardTitle>
                  <CardDescription>Top 5 productos con mayor rotación.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data?.topProducts && data.topProducts.length > 0 ? (
                      data.topProducts.map((product: any, index: number) => (
                        <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                          <div className="space-y-1 max-w-[170px]">
                            <p className="text-sm font-medium leading-none truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.quantity} uds. vendidas</p>
                          </div>
                          <div className="text-sm font-semibold">
                            ${Number(product.totalSales).toLocaleString("es-AR")}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Sin registros de venta.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* LISTADO DE PRODUCTOS CON STOCK CRÍTICO */}
              <Card className="shadow-sm border">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-amber-700 flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-600" />
                    Detalle de Reposición
                  </CardTitle>
                  <CardDescription>Artículos con 5 unidades o menos.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(data?.lowStockProducts)?.length > 0 ? (
                      data.lowStockProducts.map((product: any, index: number) => (
                        <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                          <p className="text-sm font-medium truncate max-w-[180px]">{product.name}</p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            product.stock === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {product.stock === 0 ? "Sin Stock" : `${product.stock} uds.`}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">¡Todo el inventario está al día!</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}