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
  initialStock?: number | null
  minStock?: number
  isActive?: boolean
  isForSale?: boolean
  listPrice?: number | null
  offerPrice?: number | null
  vatRate?: number | null
}

export type ManualProductInput = {
  priceListId: string
  confirmUpdates?: boolean
  product: ManualBatchProductInput
}

export type ManualExistingProductConflict = {
  productId: string
  supplierProductCode: string
  current: {
    name: string
    costPrice: number
    salePrice: number
    stock: number | null
    minStock: number
    isActive: boolean
    isForSale: boolean
  }
  incoming: {
    name: string
    costPrice: number
    salePrice: number
    stockToAdd: number | null
    resultingStock: number | null
    minStock: number
    isActive: boolean
    isForSale: boolean
  }
}

export type ManualProductResult = {
  priceListId: string
  supplierId: string
  updatedExistingProduct: boolean
  productId: string
  stockMovementsCreated: number
}
