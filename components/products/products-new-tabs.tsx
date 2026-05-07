"use client"

import { useState } from "react"
import { DatabaseZap, PencilRuler } from "lucide-react"

import { ProductImportManualTab } from "@/components/products/product-import-manual-tab"
import { ProductImportMassiveTab } from "@/components/products/product-import-massive-tab"
import { cn } from "@/lib/utils"

type TabId = "massive" | "manual"

const TABS = [
  { id: "massive" as const, label: "Carga masiva", icon: DatabaseZap },
  { id: "manual" as const, label: "Carga manual", icon: PencilRuler },
]

export function ProductsNewTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("massive")

  return (
    <div>
      <div role="tablist" className="flex border-b border-border/60">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "cursor-pointer -mb-px flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border/50 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="pt-6">
        {activeTab === "massive" ? <ProductImportMassiveTab /> : <ProductImportManualTab />}
      </div>
    </div>
  )
}
