"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    color?: string
  }
>

type ChartContextValue = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextValue | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used inside <ChartContainer />")
  }

  return context
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const entries = Object.entries(config).filter(([, value]) => value.color)

  if (entries.length === 0) {
    return null
  }

  const css = entries
    .map(([key, value]) => `  --color-${key}: ${value.color};`)
    .join("\n")

  return <style dangerouslySetInnerHTML={{ __html: `[data-chart=${id}] {\n${css}\n}` }} />
}

type ChartContainerProps = React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"]
}

function ChartContainer({ id, className, children, config, ...props }: ChartContainerProps) {
  const reactId = React.useId()
  const chartId = React.useMemo(() => id ?? `chart-${reactId.replace(/:/g, "")}`, [id, reactId])

  return (
    <ChartContext.Provider value={{ config }}>
      <div data-chart={chartId} className={cn("text-xs", className)} {...props}>
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip
const ChartLegend = RechartsPrimitive.Legend

type ChartTooltipContentProps = {
  active?: boolean
  payload?: Array<{
    color?: string
    dataKey?: string | number
    name?: string | number
    value?: string | number | null
    payload?: Record<string, unknown> & { fill?: string }
  }>
  label?: string | number
  hideLabel?: boolean
}

function ChartTooltipContent({ active, payload, label, hideLabel }: ChartTooltipContentProps) {
  const { config } = useChart()

  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="min-w-[180px] rounded-xl border border-border/60 bg-background/95 px-3 py-2.5 shadow-xl backdrop-blur-sm">
      {!hideLabel && label !== undefined ? (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {String(label)}
        </p>
      ) : null}

      <div className="space-y-1.5">
        {payload.map((item) => {
          const key = String(item.dataKey ?? item.name ?? "value")
          const meta = config[key]
          const itemColor = item.color ?? item.payload?.fill ?? "var(--color-foreground)"

          return (
            <div key={key} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: itemColor }} />
                <span>{meta?.label ?? item.name ?? key}</span>
              </div>
              <span className="font-semibold text-foreground tabular-nums">
                {typeof item.value === "number" ? item.value.toLocaleString("es-AR") : String(item.value ?? "—")}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
}
