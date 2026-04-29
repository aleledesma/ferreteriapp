"use client"

import { DatabaseZap, PencilRuler } from "lucide-react"

import { ProductImportManualTab } from "@/components/products/product-import-manual-tab"
import { ProductImportMassiveTab } from "@/components/products/product-import-massive-tab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ProductsNewTabs() {
  return (
    <Tabs defaultValue="massive" className="space-y-6">
      <TabsList>
        <TabsTrigger value="massive" className="gap-2">
          <DatabaseZap className="size-4" />
          Carga masiva
        </TabsTrigger>
        <TabsTrigger value="manual" className="gap-2">
          <PencilRuler className="size-4" />
          Carga manual
        </TabsTrigger>
      </TabsList>

      <TabsContent value="massive">
        <ProductImportMassiveTab />
      </TabsContent>

      <TabsContent value="manual">
        <ProductImportManualTab />
      </TabsContent>
    </Tabs>
  )
}
