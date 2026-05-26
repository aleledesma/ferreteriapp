export type RawSpreadsheetRow = Record<string, string | number | boolean | null>

export type SupplierPricingImportSettings = {
  saleMarginPercentage: number
  keepExistingSalePrice: boolean
}

export type SupplierUploadBatch = {
  supplierName: string
  sourceFileName: string
  uploadedByUserId: string
  pricing: SupplierPricingImportSettings
  rows: RawSpreadsheetRow[]
}

export type N8nIngestPayload = Array<{
  proveedor: string
  metadata: {
    sourceFileName: string
    uploadedByUserId: string
    saleMarginPercentage: number
    keepExistingSalePrice: boolean
  }
  productos: RawSpreadsheetRow[]
}>

export type NormalizedProduct = {
  supplierName: string
  sku: string | null
  supplierSku: string | null
  name: string | null
  brand: string | null
  category: string | null
  listPrice: number | null
  offerPrice: number | null
  taxRate: number | null
  barcode: string | null
  originalProduct: Record<string, unknown> | null
  confidence: number | null
  warnings: string[]
}

export type N8nNormalizationResponse = {
  ok: boolean
  stage: string
  error: string | null
  traceId?: string | null
  supplierContexts?: Record<string, SupplierImportContext>
  totalProviders: number
  totalNormalizedProducts: number
  normalizedProducts: NormalizedProduct[]
  providerResults: Array<{
    supplierName: string | null
    pipelineOk: boolean
    stage: string
    error: string | null
    normalizedCount: number
    warnings: string[]
  }>
}

export type SupplierImportContext = {
  sourceFileName?: string
  uploadedByUserId?: string
  saleMarginPercentage?: number
  keepExistingSalePrice?: boolean
}

export type PersistNormalizedImportInput = {
  normalizedProducts: NormalizedProduct[]
  providerResults?: N8nNormalizationResponse["providerResults"]
  supplierContexts?: Record<string, SupplierImportContext>
}

export type PersistNormalizedImportResult = {
  suppliersProcessed: number
  totalProductsCreated: number
  totalProductsUpdated: number
  totalItemsImported: number
  totalItemsSkipped: number
  suppliers: Array<{
    supplierName: string
    priceListId: string
    productsCreated: number
    productsUpdated: number
    itemsImported: number
    itemsSkipped: number
  }>
}
