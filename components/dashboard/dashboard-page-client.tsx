"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  AlertTriangle,
  DollarSign,
  ReceiptText,
  PackagePlus,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import type { DashboardData } from "@/lib/dal/dashboard-dal"
import { ImportJobsWidget } from "@/components/dashboard/import-jobs-widget"
import { cn } from "@/lib/utils"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  accent:      "#3d6aff",
  accentBg:    "rgba(61,106,255,0.07)",
  accentBorder:"rgba(61,106,255,0.20)",
  warn:        "#d97706",
  warnBg:      "rgba(217,119,6,0.08)",
  warnBorder:  "rgba(217,119,6,0.20)",
  ok:          "#059669",
  okBg:        "rgba(5,150,105,0.08)",
  muted:       "#94a3b8",
  mutedBg:     "rgba(148,163,184,0.07)",
} as const

const STOCK_META: Record<string, { fill: string; bg: string; text: string }> = {
  Normal:       { fill: T.ok,    bg: T.okBg,   text: T.ok      },
  "Stock bajo": { fill: T.warn,  bg: T.warnBg, text: T.warn    },
  "Sin stock":  { fill: T.muted, bg: T.mutedBg, text: "#64748b" },
}

const revenueConfig  = { revenue:   { label: "Ingresos", color: T.accent  } }
const productsConfig = { unitsSold: { label: "Unidades", color: "#64748b" } }

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmtCurrency(v: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(v)
}

function fmtDateTime(v: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day:    "2-digit",
    month:  "short",
    hour:   "2-digit",
    minute: "2-digit",
  }).format(new Date(v))
}

function fmtYAxis(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `$${Math.round(v / 1_000)}k`
  return `$${v}`
}

/**
 * Calcula la variación porcentual entre `current` y `previous`.
 * Retorna `null` si `previous` es 0 (sin datos para comparar).
 */
function computeTrend(current: number, previous: number) {
  if (previous === 0) return null
  const pct = ((current - previous) / previous) * 100
  const abs = Math.abs(pct)
  return {
    up:  pct >= 0,
    pct: abs > 999 ? ">999%" : `${abs.toFixed(1)}%`,
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function EyebrowLabel({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
      {children}
    </p>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-0.5 text-[13px] font-semibold text-foreground">{children}</p>
  )
}

function EmptySlot({ children }: { children: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border/50 text-[12px] text-muted-foreground">
      {children}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
type Props = { data: DashboardData; userName: string }
type Period = "7d" | "30d"

export function DashboardPageClient({ data, userName }: Props) {
  const [period, setPeriod] = useState<Period>("7d")

  // ── Series activa según período seleccionado ─────────────────────────────
  const activeSeries   = period === "7d" ? data.revenueSeries : data.revenueSeries30d
  const periodRevenue  = activeSeries.reduce((s, p) => s + p.revenue, 0)
  const periodSales    = activeSeries.reduce((s, p) => s + p.salesCount, 0)
  const periodLabel    = period === "7d" ? "7 días" : "30 días"

  const stockTotal     = data.stockDistribution.reduce((s, p) => s + p.value, 0)
  const hasCritical    = data.summary.criticalStockCount > 0

  // ── Tendencias ────────────────────────────────────────────────────────────
  const trendToday  = computeTrend(data.summary.revenueToday,    data.summary.prevRevenueToday)
  const trendSales  = computeTrend(data.summary.salesTodayCount, data.summary.prevSalesTodayCount)
  const trendMonth  = computeTrend(data.summary.revenueMonth,    data.summary.prevRevenueMonth)

  // ── KPI definitions ───────────────────────────────────────────────────────
  const kpis = [
    {
      key:         "revenue-today",
      label:       "Ingresos de hoy",
      value:       fmtCurrency(data.summary.revenueToday),
      sub:         `${data.summary.salesTodayCount} venta${data.summary.salesTodayCount === 1 ? "" : "s"} completadas`,
      Icon:        DollarSign,
      variant:     "primary" as const,
      trend:       trendToday,
      trendLabel:  "vs. ayer",
      href:        "/sales",
    },
    {
      key:         "sales-today",
      label:       "Ventas de hoy",
      value:       data.summary.salesTodayCount.toLocaleString("es-AR"),
      sub:         "Operaciones del día",
      Icon:        ShoppingCart,
      variant:     "neutral" as const,
      trend:       trendSales,
      trendLabel:  "vs. ayer",
      href:        "/sales",
    },
    {
      key:         "revenue-month",
      label:       "Ingresos del mes",
      value:       fmtCurrency(data.summary.revenueMonth),
      sub:         "Acumulado del mes en curso",
      Icon:        TrendingUp,
      variant:     "neutral" as const,
      trend:       trendMonth,
      trendLabel:  "vs. mes ant.",
      href:        "/sales",
    },
    {
      key:         "stock-critical",
      label:       "Stock crítico",
      value:       data.summary.criticalStockCount.toLocaleString("es-AR"),
      sub:         "Productos con faltantes o reposición próxima",
      Icon:        AlertTriangle,
      variant:     hasCritical ? ("warn" as const) : ("neutral" as const),
      trend:       null,  // sin tendencia para stock
      trendLabel:  "",
      href:        "/products?stockStatus=sin_stock",
    },
  ]

  const variantStyles = {
    primary: { border: T.accentBorder, iconBg: T.accentBg,  iconColor: T.accent, numColor: undefined, topBar: true  },
    warn:    { border: T.warnBorder,   iconBg: T.warnBg,    iconColor: T.warn,   numColor: "#92400e", topBar: false },
    neutral: { border: "transparent",  iconBg: T.mutedBg,   iconColor: T.muted,  numColor: undefined, topBar: false },
  }

  return (
    <main className="min-h-full bg-muted/25 p-4 md:p-6 xl:p-8">
      <div className="mx-auto max-w-7xl space-y-5">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <header className="flex flex-wrap items-start justify-between gap-4 pb-1">
          <div>
            <EyebrowLabel>Panel de control</EyebrowLabel>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground leading-none">
              Hola, {userName}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 rounded-lg border-border/60 text-[13px] shadow-none"
            >
              <Link href="/products/new">
                <PackagePlus className="size-3.5" />
                Cargar producto
              </Link>
            </Button>
            <Button asChild size="sm" className="h-9 gap-1.5 rounded-lg text-[13px] shadow-none">
              <Link href="/sales/new">
                <ReceiptText className="size-3.5" />
                Nueva venta
              </Link>
            </Button>
          </div>
        </header>

        {/* ── KPI strip ─────────────────────────────────────────────────────── */}
        {/* Feature 3: cards clickeables que navegan a la sección relevante    */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map(({ key, label, value, sub, Icon, variant, trend, trendLabel, href }) => {
            const s = variantStyles[variant]
            return (
              <Link
                key={key}
                href={href}
                className={cn(
                  "group relative block overflow-hidden rounded-xl border bg-background px-4 py-4",
                  "transition-colors hover:bg-muted/20",
                )}
                style={{ borderColor: s.border }}
              >
                {s.topBar && (
                  <div
                    className="absolute inset-x-0 top-0 h-[2px]"
                    style={{ background: T.accent }}
                  />
                )}

                {/* Label + icono */}
                <div className="flex items-start justify-between gap-2">
                  <EyebrowLabel>{label}</EyebrowLabel>
                  <span
                    className="flex-none rounded-md p-1.5"
                    style={{ background: s.iconBg }}
                  >
                    <Icon className="size-3.5" style={{ color: s.iconColor }} />
                  </span>
                </div>

                {/* Número principal */}
                <p
                  className="mt-2 font-mono text-[1.65rem] font-semibold leading-none tracking-tight text-foreground"
                  style={{ color: s.numColor }}
                >
                  {value}
                </p>

                {/* Feature 2: indicador de tendencia */}
                {trend ? (
                  <div className="mt-2 flex items-center gap-1">
                    {trend.up ? (
                      <TrendingUp className="size-3 shrink-0" style={{ color: T.ok }} />
                    ) : (
                      <TrendingDown className="size-3 shrink-0" style={{ color: T.warn }} />
                    )}
                    <span
                      className="text-[11px] font-semibold"
                      style={{ color: trend.up ? T.ok : T.warn }}
                    >
                      {trend.pct}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{trendLabel}</span>
                  </div>
                ) : (
                  <div className="mt-2 h-[18px]" /> /* spacer para alinear altura de cards */
                )}

                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{sub}</p>
              </Link>
            )
          })}
        </section>

        {/* ── Revenue chart + Stock health ──────────────────────────────────── */}
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_330px]">

          {/* Feature 1: gráfico con selector de período */}
          <div className="rounded-xl border border-border/60 bg-background p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <EyebrowLabel>Facturación</EyebrowLabel>
                <SectionTitle>Ingresos — últimos {periodLabel}</SectionTitle>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {fmtCurrency(periodRevenue)} en {periodSales} venta{periodSales === 1 ? "" : "s"}
                </p>
              </div>

              {/* Toggle 7d / 30d */}
              <div className="flex items-center gap-0.5 rounded-lg border border-border/50 bg-muted/30 p-1">
                {(["7d", "30d"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                      period === p
                        ? "bg-background text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {p === "7d" ? "7 días" : "30 días"}
                  </button>
                ))}
              </div>
            </div>

            <ChartContainer config={revenueConfig} className="h-[240px] w-full">
              <AreaChart
                data={activeSeries}
                margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={T.accent} stopOpacity={0.14} />
                    <stop offset="100%" stopColor={T.accent} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="2 4"
                  stroke="rgba(0,0,0,0.05)"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  interval={period === "7d" ? 0 : "preserveStartEnd"}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={fmtYAxis}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={T.accent}
                  strokeWidth={2}
                  fill="url(#revGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: T.accent, stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ChartContainer>
          </div>

          {/* Stock health donut */}
          <div className="rounded-xl border border-border/60 bg-background p-5">
            <EyebrowLabel>Inventario</EyebrowLabel>
            <SectionTitle>Salud del stock</SectionTitle>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {stockTotal} productos en catálogo
            </p>

            <ChartContainer config={{}} className="mx-auto mt-4 h-[160px] max-w-[160px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={data.stockDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {data.stockDistribution.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STOCK_META[entry.name]?.fill ?? T.muted}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>

            <div className="mt-5 space-y-2">
              {data.stockDistribution.map((entry) => {
                const m   = STOCK_META[entry.name]
                const pct = stockTotal > 0
                  ? Math.round((entry.value / stockTotal) * 100)
                  : 0
                return (
                  <div
                    key={entry.name}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5"
                    style={{ background: m?.bg ?? T.mutedBg }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ background: m?.fill ?? T.muted }} />
                      <span className="text-[12px] text-muted-foreground">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-[12px] font-semibold"
                        style={{ color: m?.text ?? "#64748b" }}
                      >
                        {entry.value}
                      </span>
                      <span className="w-8 text-right text-[10px] text-muted-foreground">
                        {pct}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Top products + Low stock ───────────────────────────────────────── */}
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(260px,1fr)]">

          <div className="rounded-xl border border-border/60 bg-background p-5">
            <EyebrowLabel>Desempeño</EyebrowLabel>
            <SectionTitle>Productos más vendidos</SectionTitle>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Por unidades — últimos 30 días
            </p>

            {data.topProducts.length > 0 ? (
              <ChartContainer config={productsConfig} className="mt-4 h-[270px] w-full">
                <BarChart
                  data={data.topProducts}
                  layout="vertical"
                  margin={{ left: 8, right: 20, top: 4, bottom: 0 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray="2 4"
                    stroke="rgba(0,0,0,0.05)"
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={134}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="unitsSold" radius={4} fill={T.accent} fillOpacity={0.80} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="mt-4">
                <EmptySlot>Sin datos de ventas suficientes</EmptySlot>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-background p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <EyebrowLabel>Alerta de stock</EyebrowLabel>
                <SectionTitle>Productos a reponer</SectionTitle>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Faltantes o reposición próxima
                </p>
              </div>
              {hasCritical && (
                <span
                  className="mt-0.5 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: T.warnBg, color: T.warn }}
                >
                  {data.summary.criticalStockCount} crítico{data.summary.criticalStockCount === 1 ? "" : "s"}
                </span>
              )}
            </div>

            <div className="mt-4 space-y-2">
              {data.lowStockProducts.length > 0 ? (
                data.lowStockProducts.map((product) => {
                  const isOut = product.status === "sin_stock"
                  return (
                    <Link
                      key={product.id}
                      href={`/products?product=${encodeURIComponent(product.id)}`}
                      className="flex items-center justify-between rounded-xl border border-border/50 px-3 py-3 transition-colors hover:bg-muted/20 hover:border-border/80"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-medium text-foreground">
                          {product.name}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {product.supplierName}
                        </p>
                      </div>
                      <div className="ml-3 flex-none text-right">
                        <p
                          className="font-mono text-[13px] font-semibold"
                          style={{ color: isOut ? "#94a3b8" : T.warn }}
                        >
                          {product.stock}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          mín. {product.minStock}
                        </p>
                      </div>
                    </Link>
                  )
                })
              ) : (
                <EmptySlot>No hay productos críticos</EmptySlot>
              )}
            </div>
          </div>
        </section>

        {/* ── Import jobs ───────────────────────────────────────────────────── */}
        <ImportJobsWidget />

        {/* ── Recent sales ──────────────────────────────────────────────────── */}
        <section className="overflow-hidden rounded-xl border border-border/60 bg-background">
          <div className="border-b border-border/50 px-5 py-4">
            <EyebrowLabel>Historial</EyebrowLabel>
            <SectionTitle>Ventas recientes</SectionTitle>
          </div>

          {data.recentSales.length > 0 ? (
            <div className="divide-y divide-border/40">
              {data.recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/20"
                >
                  <div
                    className="flex size-8 flex-none items-center justify-center rounded-lg font-mono text-[10px] font-bold"
                    style={{ background: T.accentBg, color: T.accent }}
                  >
                    {sale.id.slice(-2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-foreground">
                      {sale.customerName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {sale.itemsCount} artículo{sale.itemsCount === 1 ? "" : "s"}
                      {" · "}
                      {fmtDateTime(sale.saleDate)}
                    </p>
                  </div>
                  <p className="flex-none font-mono text-[14px] font-semibold text-foreground">
                    {fmtCurrency(sale.total)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center text-[12px] text-muted-foreground">
              Sin ventas registradas
            </div>
          )}
        </section>

      </div>
    </main>
  )
}
