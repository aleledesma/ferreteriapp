import { SaleStatus } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { deriveStockStatus } from "@/lib/products/catalog-validation"

type RevenuePoint = {
  dateKey: string
  label: string
  revenue: number
  salesCount: number
}

type TopProductPoint = {
  name: string
  unitsSold: number
  revenue: number
}

type StockDistributionPoint = {
  name: string
  value: number
  fill: string
}

type LowStockItem = {
  id: string
  name: string
  supplierName: string
  stock: number
  minStock: number
  status: "sin_stock" | "stock_bajo"
}

type RecentSaleItem = {
  id: string
  saleDate: string
  total: number
  itemsCount: number
  customerName: string
}

export type DashboardData = {
  summary: {
    revenueToday: number
    salesTodayCount: number
    revenueMonth: number
    criticalStockCount: number
    /** Ingresos de ayer — para tendencia */
    prevRevenueToday: number
    /** Ventas de ayer — para tendencia */
    prevSalesTodayCount: number
    /** Ingresos del mes anterior hasta el mismo día — para tendencia */
    prevRevenueMonth: number
  }
  /** Serie diaria de los últimos 7 días */
  revenueSeries: RevenuePoint[]
  /** Serie diaria de los últimos 30 días */
  revenueSeries30d: RevenuePoint[]
  topProducts: TopProductPoint[]
  stockDistribution: StockDistributionPoint[]
  lowStockProducts: LowStockItem[]
  recentSales: RecentSaleItem[]
}

// ─── Helpers de fechas ─────────────────────────────────────────────────────────

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function shiftDays(date: Date, delta: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + delta)
  return next
}

/** Primer día del mes anterior */
function startOfPrevMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1)
}

/**
 * Límite exclusivo para "mes anterior, mismo período transcurrido".
 * Calcula el mismo día-del-mes en el mes anterior (cappado al último día de ese
 * mes si el mes anterior es más corto) y devuelve el inicio del día siguiente.
 */
function prevMonthSameDayExclusive(date: Date) {
  const m = date.getMonth() - 1
  const y = m < 0 ? date.getFullYear() - 1 : date.getFullYear()
  const month = m < 0 ? 11 : m
  const lastDayOfPrevMonth = new Date(y, month + 1, 0).getDate()
  const day = Math.min(date.getDate(), lastDayOfPrevMonth)
  return new Date(y, month, day + 1, 0, 0, 0)
}

function toNumber(value: { toString(): string } | number | null | undefined) {
  if (value == null) return 0
  return typeof value === "number" ? value : Number(value.toString())
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

/** Etiqueta para la serie de 7 días: "lun 23" */
function chartLabel7d(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
  }).format(date)
}

/** Etiqueta para la serie de 30 días: "23/05" */
function chartLabel30d(date: Date) {
  const d = String(date.getDate()).padStart(2, "0")
  const m = String(date.getMonth() + 1).padStart(2, "0")
  return `${d}/${m}`
}

// ─── Query principal ───────────────────────────────────────────────────────────

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date()

  const todayStart        = startOfDay(now)
  const yesterdayStart    = startOfDay(shiftDays(now, -1))
  const monthStart        = startOfMonth(now)
  const lastMonthStart    = startOfPrevMonth(now)
  const lastMonthEnd      = prevMonthSameDayExclusive(now)
  const last30DaysStart   = startOfDay(shiftDays(now, -29))
  const last7DaysStart    = startOfDay(shiftDays(now, -6))

  const [
    todaySummary,
    yesterdaySummary,
    monthSummary,
    lastMonthSamePeriod,
    recentSalesWindow,
    recentSales,
    products,
  ] = await Promise.all([
    // Hoy
    prisma.sale.aggregate({
      where: { status: SaleStatus.COMPLETED, saleDate: { gte: todayStart } },
      _count: { _all: true },
      _sum:   { total: true },
    }),
    // Ayer (comparación de tendencia)
    prisma.sale.aggregate({
      where: {
        status:   SaleStatus.COMPLETED,
        saleDate: { gte: yesterdayStart, lt: todayStart },
      },
      _count: { _all: true },
      _sum:   { total: true },
    }),
    // Mes actual
    prisma.sale.aggregate({
      where: { status: SaleStatus.COMPLETED, saleDate: { gte: monthStart } },
      _sum: { total: true },
    }),
    // Mes anterior, mismo período transcurrido (comparación de tendencia)
    prisma.sale.aggregate({
      where: {
        status:   SaleStatus.COMPLETED,
        saleDate: { gte: lastMonthStart, lt: lastMonthEnd },
      },
      _sum: { total: true },
    }),
    // Ventana de 30 días: alimenta series de gráfico y top products
    prisma.sale.findMany({
      where: {
        status:   SaleStatus.COMPLETED,
        saleDate: { gte: last30DaysStart },
      },
      orderBy: { saleDate: "asc" },
      select: {
        id:      true,
        saleDate: true,
        total:   true,
        items: {
          select: {
            quantity: true,
            subtotal: true,
            product: {
              select: { id: true, name: true },
            },
          },
        },
      },
    }),
    // Últimas 5 ventas para el listado
    prisma.sale.findMany({
      where:   { status: SaleStatus.COMPLETED },
      orderBy: { saleDate: "desc" },
      take:    5,
      select: {
        id:      true,
        saleDate: true,
        total:   true,
        customer: { select: { firstName: true, lastName: true } },
        _count:  { select: { items: true } },
      },
    }),
    // Productos activos para distribución de stock
    prisma.product.findMany({
      where:  { deletedAt: null },
      select: {
        id:       true,
        name:     true,
        stock:    true,
        minStock: true,
        isActive: true,
        supplier: { select: { name: true } },
      },
    }),
  ])

  // ─── Series de ingresos ──────────────────────────────────────────────────────

  const revenueSeries = Array.from({ length: 7 }, (_, index) => {
    const pointDate = shiftDays(last7DaysStart, index)
    return { dateKey: dateKey(pointDate), label: chartLabel7d(pointDate), revenue: 0, salesCount: 0 }
  })

  const revenueSeries30d = Array.from({ length: 30 }, (_, index) => {
    const pointDate = shiftDays(last30DaysStart, index)
    return { dateKey: dateKey(pointDate), label: chartLabel30d(pointDate), revenue: 0, salesCount: 0 }
  })

  const revenueMap7d  = new Map(revenueSeries.map((p)     => [p.dateKey, p]))
  const revenueMap30d = new Map(revenueSeries30d.map((p)  => [p.dateKey, p]))
  const topProductsMap = new Map<string, TopProductPoint>()

  for (const sale of recentSalesWindow) {
    const key = dateKey(sale.saleDate)

    // Serie 30d (todas las ventas del window)
    const p30 = revenueMap30d.get(key)
    if (p30) {
      p30.revenue    += toNumber(sale.total)
      p30.salesCount += 1
    }

    // Serie 7d (solo últimos 7 días)
    if (sale.saleDate >= last7DaysStart) {
      const p7 = revenueMap7d.get(key)
      if (p7) {
        p7.revenue    += toNumber(sale.total)
        p7.salesCount += 1
      }
    }

    // Top products
    for (const item of sale.items) {
      const existing = topProductsMap.get(item.product.id)
      const revenue  = toNumber(item.subtotal)
      if (existing) {
        existing.unitsSold += item.quantity
        existing.revenue   += revenue
        continue
      }
      topProductsMap.set(item.product.id, {
        name:      item.product.name,
        unitsSold: item.quantity,
        revenue,
      })
    }
  }

  // ─── Stock ──────────────────────────────────────────────────────────────────

  let inStockCount    = 0
  let lowStockCount   = 0
  let outOfStockCount = 0

  const lowStockProducts = products
    .map((product) => {
      const status = deriveStockStatus(product.stock, product.minStock)

      if (status === "stock_normal") { inStockCount++;  return null }
      if (status === "stock_bajo")    lowStockCount++
      if (status === "sin_stock")     outOfStockCount++

      return {
        id:           product.id,
        name:         product.name,
        supplierName: product.supplier.name,
        stock:        product.stock,
        minStock:     product.minStock,
        status,
      } satisfies LowStockItem
    })
    .filter((p): p is LowStockItem => p !== null)
    .sort((a, b) => {
      const score = (i: LowStockItem) => (i.status === "sin_stock" ? 0 : 1)
      const byStatus = score(a) - score(b)
      if (byStatus !== 0) return byStatus
      return a.stock - b.stock
    })
    .slice(0, 5)

  const stockDistribution: StockDistributionPoint[] = [
    { name: "Normal",     value: inStockCount,    fill: "var(--color-chart-1)" },
    { name: "Stock bajo", value: lowStockCount,   fill: "var(--color-chart-4)" },
    { name: "Sin stock",  value: outOfStockCount, fill: "var(--color-destructive)" },
  ]

  const topProducts = Array.from(topProductsMap.values())
    .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
    .slice(0, 5)

  return {
    summary: {
      revenueToday:        toNumber(todaySummary._sum.total),
      salesTodayCount:     todaySummary._count._all,
      revenueMonth:        toNumber(monthSummary._sum.total),
      criticalStockCount:  lowStockCount + outOfStockCount,
      prevRevenueToday:    toNumber(yesterdaySummary._sum.total),
      prevSalesTodayCount: yesterdaySummary._count._all,
      prevRevenueMonth:    toNumber(lastMonthSamePeriod._sum.total),
    },
    revenueSeries,
    revenueSeries30d,
    topProducts,
    stockDistribution,
    lowStockProducts,
    recentSales: recentSales.map((sale) => ({
      id:           sale.id,
      saleDate:     sale.saleDate.toISOString(),
      total:        toNumber(sale.total),
      itemsCount:   sale._count.items,
      customerName: sale.customer
        ? `${sale.customer.lastName}, ${sale.customer.firstName}`
        : "Consumidor final",
    })),
  }
}
