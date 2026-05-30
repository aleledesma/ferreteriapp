import {
  type CreateManualSupplierPriceListInput,
  type ManualBatchProductInput,
  type ManualProductInput,
} from "@/lib/products/manual-product-types"

export class ManualProductError extends Error {
  constructor(
    message: string,
    readonly status: number = 400,
  ) {
    super(message)
    this.name = "ManualProductError"
  }
}

export class ManualProductConflictError extends ManualProductError {
  constructor(
    message: string,
    readonly conflicts: import("@/lib/products/manual-product-types").ManualExistingProductConflict[],
  ) {
    super(message, 409)
    this.name = "ManualProductConflictError"
  }
}

function normalizeNullableText(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseNonNegativeNumber(value: unknown, fieldName: string) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new ManualProductError(`${fieldName} debe ser un numero mayor o igual a 0.`)
  }

  return value
}

function parseNonNegativeInteger(value: unknown, fieldName: string) {
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new ManualProductError(`${fieldName} debe ser un numero entero mayor o igual a 0.`)
  }

  return Number(value)
}

function parseBooleanWithDefault(value: unknown, fallback: boolean) {
  if (typeof value === "undefined") {
    return fallback
  }

  if (typeof value !== "boolean") {
    throw new ManualProductError("Los campos booleanos deben enviarse como true o false.")
  }

  return value
}

function parseOptionalDateString(value: unknown) {
  const normalized = normalizeNullableText(value)

  if (!normalized) {
    return null
  }

  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) {
    throw new ManualProductError("La fecha de vigencia no es valida.")
  }

  return parsed.toISOString()
}

function parseManualBatchProductInput(payload: unknown): ManualBatchProductInput {
  if (!payload || typeof payload !== "object") {
    throw new ManualProductError("Cada producto del lote debe ser un objeto valido.")
  }

  const record = payload as Record<string, unknown>
  const supplierProductCode = normalizeNullableText(record.supplierProductCode)
  const name = normalizeNullableText(record.name)

  if (!supplierProductCode) {
    throw new ManualProductError("El codigo de producto del proveedor es obligatorio.")
  }

  if (!name) {
    throw new ManualProductError("El nombre del producto es obligatorio.")
  }

  return {
    supplierProductCode,
    name,
    description: normalizeNullableText(record.description),
    brand: normalizeNullableText(record.brand),
    categoryCode: normalizeNullableText(record.categoryCode),
    categoryName: normalizeNullableText(record.categoryName),
    barcode: normalizeNullableText(record.barcode),
    costPrice: parseNonNegativeNumber(record.costPrice, "El precio de costo"),
    salePrice: parseNonNegativeNumber(record.salePrice, "El precio de venta"),
    initialStock:
      record.initialStock === undefined || record.initialStock === null || record.initialStock === ""
        ? null
        : parseNonNegativeInteger(record.initialStock, "El stock inicial"),
    minStock:
      typeof record.minStock === "undefined"
        ? 0
        : parseNonNegativeInteger(record.minStock, "El stock minimo"),
    isActive: parseBooleanWithDefault(record.isActive, true),
    isForSale: parseBooleanWithDefault(record.isForSale, true),
    listPrice:
      typeof record.listPrice === "undefined" || record.listPrice === null
        ? null
        : parseNonNegativeNumber(record.listPrice, "El precio de lista"),
    offerPrice:
      typeof record.offerPrice === "undefined" || record.offerPrice === null
        ? null
        : parseNonNegativeNumber(record.offerPrice, "El precio de oferta"),
    vatRate:
      typeof record.vatRate === "undefined" || record.vatRate === null
        ? null
        : parseNonNegativeNumber(record.vatRate, "La tasa de IVA"),
  }
}

export function parseManualSupplierPriceListInput(
  payload: unknown,
): CreateManualSupplierPriceListInput {
  if (!payload || typeof payload !== "object") {
    throw new ManualProductError("Payload invalido.")
  }

  const record = payload as Record<string, unknown>
  const name = normalizeNullableText(record.name)

  if (!name) {
    throw new ManualProductError("El nombre de la lista de precios es obligatorio.")
  }

  return {
    name,
    effectiveAt: parseOptionalDateString(record.effectiveAt),
    notes: normalizeNullableText(record.notes),
  }
}

export function parseManualProductInput(payload: unknown): ManualProductInput {
  if (!payload || typeof payload !== "object") {
    throw new ManualProductError("Payload invalido.")
  }

  const record = payload as Record<string, unknown>
  const priceListId = normalizeNullableText(record.priceListId)

  if (!priceListId) {
    throw new ManualProductError("El identificador de la lista de precios es obligatorio.")
  }

  if (!record.product || typeof record.product !== "object") {
    throw new ManualProductError("Debes enviar un producto para la carga manual.")
  }

  const product = parseManualBatchProductInput(record.product)

  return {
    priceListId,
    confirmUpdates: record.confirmUpdates === true,
    product,
  }
}
