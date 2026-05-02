import type {
  DeactivateProductsRequest,
  ProductActivityStatusFilter,
  ProductCatalogFilters,
  ProductSaleStatusFilter,
  ProductSortOption,
  ProductStockStatus,
  StockAdjustmentRequest,
  UpdateProductRequest,
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

function parseOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseRequiredText(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} es obligatorio.`)
  }

  return value.trim()
}

function parseCurrencyValue(value: unknown, fieldName: string) {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new Error(`${fieldName} es obligatorio.`)
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} debe ser un número válido.`)
  }

  return parsed.toFixed(2)
}

function parseNonNegativeInteger(value: unknown, fieldName: string) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} debe ser un entero mayor o igual a 0.`)
  }

  return value
}

export function parseDeactivateProductsRequest(payload: unknown): DeactivateProductsRequest {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { productIds?: unknown[] }).productIds)) {
    throw new Error("Debes indicar los productos a desactivar.")
  }

  const productIds = (payload as { productIds: unknown[] }).productIds.filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  )

  if (productIds.length === 0) {
    throw new Error("Debes seleccionar al menos un producto.")
  }

  return { productIds }
}

export function parseUpdateProductRequest(payload: unknown): UpdateProductRequest {
  if (!payload || typeof payload !== "object") {
    throw new Error("No se recibieron datos válidos para actualizar el producto.")
  }

  const record = payload as Record<string, unknown>
  const next: UpdateProductRequest = {}

  if (typeof record.name !== "undefined") {
    next.name = parseRequiredText(record.name, "El nombre")
  }

  if (typeof record.description !== "undefined") {
    next.description = parseOptionalText(record.description)
  }

  if (typeof record.brand !== "undefined") {
    next.brand = parseOptionalText(record.brand)
  }

  if (typeof record.categoryCode !== "undefined") {
    next.categoryCode = parseOptionalText(record.categoryCode)
  }

  if (typeof record.categoryName !== "undefined") {
    next.categoryName = parseOptionalText(record.categoryName)
  }

  if (typeof record.barcode !== "undefined") {
    next.barcode = parseOptionalText(record.barcode)
  }

  if (typeof record.costPrice !== "undefined") {
    next.costPrice = parseCurrencyValue(record.costPrice, "El precio de costo")
  }

  if (typeof record.salePrice !== "undefined") {
    next.salePrice = parseCurrencyValue(record.salePrice, "El precio de venta")
  }

  if (typeof record.minStock !== "undefined") {
    next.minStock = parseNonNegativeInteger(record.minStock, "El stock mínimo")
  }

  if (typeof record.isActive !== "undefined") {
    if (typeof record.isActive !== "boolean") {
      throw new Error("El estado activo del producto no es válido.")
    }

    next.isActive = record.isActive
  }

  if (typeof record.isForSale !== "undefined") {
    if (typeof record.isForSale !== "boolean") {
      throw new Error("El estado de venta del producto no es válido.")
    }

    next.isForSale = record.isForSale
  }

  if (Object.keys(next).length === 0) {
    throw new Error("No hay cambios válidos para aplicar al producto.")
  }

  return next
}

export function parseStockAdjustmentRequest(payload: unknown): StockAdjustmentRequest {
  if (!payload || typeof payload !== "object") {
    throw new Error("No se recibieron datos válidos para ajustar el stock.")
  }

  const record = payload as Record<string, unknown>

  return {
    nextStock: parseNonNegativeInteger(record.nextStock, "El nuevo stock"),
    notes: typeof record.notes === "undefined" ? null : parseOptionalText(record.notes),
  }
}
