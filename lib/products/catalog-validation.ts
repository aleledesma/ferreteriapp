import type {
  ProductActivityStatusFilter,
  ProductCatalogFilters,
  ProductSaleStatusFilter,
  ProductSortOption,
  ProductStockStatus,
} from "@/lib/products/catalog-types"

const STOCK_STATUS_VALUES: ProductStockStatus[] = ["sin_stock", "stock_bajo", "stock_normal"]
const ACTIVITY_STATUS_VALUES: ProductActivityStatusFilter[] = ["active", "inactive", "all"]
const SALE_STATUS_VALUES: ProductSaleStatusFilter[] = ["for_sale", "not_for_sale", "all"]
const SORT_VALUES: ProductSortOption[] = [
  "critical_stock",
  "name",
  "updated_at",
  "sale_price",
  "stock",
  "supplier",
]

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 100

function normalizeText(value: string | null) {
  const trimmed = value?.trim() ?? ""
  return trimmed.length > 0 ? trimmed : null
}

function pickEnumValue<T extends string>(value: string | null, allowed: readonly T[], fallback: T) {
  return value && allowed.includes(value as T) ? (value as T) : fallback
}

export function parseProductCatalogFilters(searchParams: URLSearchParams): ProductCatalogFilters {
  const parsedLimit = Number(searchParams.get("limit") ?? DEFAULT_LIMIT)
  const limit = Number.isFinite(parsedLimit)
    ? Math.max(1, Math.min(MAX_LIMIT, Math.trunc(parsedLimit)))
    : DEFAULT_LIMIT

  return {
    search: normalizeText(searchParams.get("search")),
    supplierId: normalizeText(searchParams.get("supplierId")),
    category: normalizeText(searchParams.get("category")),
    brand: normalizeText(searchParams.get("brand")),
    stockStatus: searchParams.get("stockStatus") && STOCK_STATUS_VALUES.includes(searchParams.get("stockStatus") as ProductStockStatus)
      ? (searchParams.get("stockStatus") as ProductStockStatus)
      : null,
    activityStatus: pickEnumValue(searchParams.get("activityStatus"), ACTIVITY_STATUS_VALUES, "active"),
    saleStatus: pickEnumValue(searchParams.get("saleStatus"), SALE_STATUS_VALUES, "all"),
    sort: pickEnumValue(searchParams.get("sort"), SORT_VALUES, "critical_stock"),
    cursor: normalizeText(searchParams.get("cursor")),
    limit,
  }
}

export function deriveStockStatus(stock: number, minStock: number): ProductStockStatus {
  if (stock <= 0) return "sin_stock"
  if (stock > 0 && stock <= minStock) return "stock_bajo"
  return "stock_normal"
}
