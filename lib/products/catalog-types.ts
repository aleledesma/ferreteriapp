export type ProductStockStatus = "sin_controlar" | "sin_stock" | "stock_bajo" | "stock_normal"

export type ProductActivityStatusFilter = "active" | "inactive" | "all"
export type ProductSaleStatusFilter = "for_sale" | "not_for_sale" | "all"
export type ProductSortOption =
  | "critical_stock"
  | "name"
  | "updated_at"
  | "sale_price"
  | "stock"
  | "supplier"

export type ProductCatalogFilters = {
  search: string | null
  supplierId: string | null
  category: string | null
  brand: string | null
  stockStatus: ProductStockStatus | null
  activityStatus: ProductActivityStatusFilter
  saleStatus: ProductSaleStatusFilter
  sort: ProductSortOption
  cursor: string | null
  limit: number
}

export type ProductListItemDto = {
  id: string
  name: string
  supplierProductCode: string
  barcode: string | null
  brand: string | null
  categoryName: string | null
  supplier: {
    id: string
    name: string
  }
  pricing: {
    costPrice: string
    salePrice: string
  }
  inventory: {
    stock: number | null
    minStock: number
    stockStatus: ProductStockStatus
  }
  flags: {
    isActive: boolean
    isForSale: boolean
    isDeleted: boolean
  }
  deletion: {
    deletedAt: string | null
    deleteExpiresAt: string | null
  }
  updatedAt: string
}

export type ProductListResponse = {
  items: ProductListItemDto[]
  pageInfo: {
    nextCursor: string | null
    hasMore: boolean
    pageSize: number
  }
  appliedFilters: Omit<ProductCatalogFilters, "cursor" | "limit"> & {
    search: string | null
    supplierId: string | null
    category: string | null
    brand: string | null
    stockStatus: ProductStockStatus | null
  }
}

export type ProductCatalogKpisResponse = {
  totalProducts: number
  activeProducts: number
  lowStockProducts: number
  outOfStockProducts: number
}

export type ProductCatalogSupplierOption = {
  id: string
  name: string
}

export type ProductStockMovementDto = {
  id: string
  type: string
  quantityDelta: number
  previousStock: number | null
  nextStock: number | null
  notes: string | null
  createdAt: string
  createdBy: {
    id: string
    name: string | null
    email: string | null
  } | null
}

export type ProductDetailDto = {
  id: string
  name: string
  supplierProductCode: string
  description: string | null
  brand: string | null
  categoryCode: string | null
  categoryName: string | null
  barcode: string | null
  supplier: {
    id: string
    name: string
  }
  currentPriceList: {
    id: string
    name: string
    sourceType: string
    status: string
  } | null
  pricing: {
    costPrice: string
    salePrice: string
  }
  inventory: {
    stock: number | null
    minStock: number
    stockStatus: ProductStockStatus
  }
  flags: {
    isActive: boolean
    isForSale: boolean
    isDeleted: boolean
  }
  deletion: {
    deletedAt: string | null
    deleteExpiresAt: string | null
  }
  salesSummary: {
    lastSaleAt: string | null
    totalUnitsSold: number
  }
  stockMovements: ProductStockMovementDto[]
  createdAt: string
  updatedAt: string
}

export type ProductDetailResponse = {
  product: ProductDetailDto
}

export type DeactivateProductsRequest = {
  productIds: string[]
}

export type DeactivateProductsResponse = {
  processedCount: number
  updatedIds: string[]
  expiresAt: string
}

export type RestoreProductsRequest = {
  productIds: string[]
}

export type RestoreProductsResponse = {
  processedCount: number
  restoredIds: string[]
}

export type UpdateProductRequest = {
  name?: string
  description?: string | null
  brand?: string | null
  categoryCode?: string | null
  categoryName?: string | null
  barcode?: string | null
  costPrice?: string
  salePrice?: string
  minStock?: number
  isActive?: boolean
  isForSale?: boolean
}

export type UpdateProductResponse = {
  product: ProductDetailDto
}

export type StockAdjustmentRequest = {
  nextStock: number
  notes?: string | null
}

export type StockAdjustmentResponse = {
  productId: string
  stock: number
  movement: ProductStockMovementDto
}
