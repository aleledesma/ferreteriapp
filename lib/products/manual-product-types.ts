export type ManualSupplierPriceListItem = {
  id: string
  supplierId: string
  uploadedByUserId: string | null
  sourceType: "IMPORTED" | "MANUAL"
  status: "DRAFT" | "PROCESSED" | "FAILED" | "ARCHIVED"
  name: string
  sourceFileName: string | null
  effectiveAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  itemsCount: number
}

export type ManualSupplierPriceListListResult = {
  items: ManualSupplierPriceListItem[]
}

export type CreateManualSupplierPriceListInput = {
  name: string
  effectiveAt?: string | null
  notes?: string | null
}

export type ManualBatchProductInput = {
  supplierProductCode: string
  name: string
  description?: string | null
  brand?: string | null
  categoryCode?: string | null
  categoryName?: string | null
  barcode?: string | null
  costPrice: number
  salePrice: number
  initialStock: number
  minStock?: number
  isActive?: boolean
  isForSale?: boolean
  listPrice?: number | null
  offerPrice?: number | null
  vatRate?: number | null
}

export type ManualProductBatchInput = {
  priceListId: string
  confirmUpdates?: boolean
  products: ManualBatchProductInput[]
}

export type ManualExistingProductConflict = {
  productId: string
  supplierProductCode: string
  current: {
    name: string
    costPrice: number
    salePrice: number
    stock: number
    minStock: number
    isActive: boolean
    isForSale: boolean
  }
  incoming: {
    name: string
    costPrice: number
    salePrice: number
    stockToAdd: number
    resultingStock: number
    minStock: number
    isActive: boolean
    isForSale: boolean
  }
}

export type ManualProductBatchResult = {
  priceListId: string
  supplierId: string
  updatedExistingProducts: boolean
  productsCreated: number
  productsUpdated: number
  itemsImported: number
  stockMovementsCreated: number
}
