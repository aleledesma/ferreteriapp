import type {
  N8nIngestPayload,
  N8nNormalizationResponse,
  NormalizedProduct,
  SupplierUploadBatch,
} from "./types"

function normalizeNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeNullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function normalizeWarnings(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((warning) => (typeof warning === "string" ? warning.trim() : ""))
    .filter((warning) => warning.length > 0)
}

function normalizeOriginalProduct(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function normalizeProduct(entry: unknown): NormalizedProduct | null {
  if (!entry || typeof entry !== "object") {
    return null
  }

  const product = entry as Record<string, unknown>
  const supplierName = normalizeNullableString(product.supplierName)
  if (!supplierName) {
    return null
  }

  return {
    supplierName,
    sku: normalizeNullableString(product.sku),
    supplierSku: normalizeNullableString(product.supplierSku),
    name: normalizeNullableString(product.name),
    brand: normalizeNullableString(product.brand),
    category: normalizeNullableString(product.category),
    listPrice: normalizeNullableNumber(product.listPrice),
    offerPrice: normalizeNullableNumber(product.offerPrice),
    taxRate: normalizeNullableNumber(product.taxRate),
    barcode: normalizeNullableString(product.barcode),
    originalProduct: normalizeOriginalProduct(product.originalProduct),
    confidence: normalizeNullableNumber(product.confidence),
    warnings: normalizeWarnings(product.warnings),
  }
}

export function mapSupplierUploadBatchesToN8nPayload(
  batches: SupplierUploadBatch[],
): N8nIngestPayload {
  return batches.map((batch) => ({
    proveedor: batch.supplierName,
    metadata: {
      sourceFileName: batch.sourceFileName,
      uploadedByUserId: batch.uploadedByUserId,
    },
    productos: batch.rows,
  }))
}

export function normalizeN8nResponse(payload: unknown): N8nNormalizationResponse | null {
  if (!payload || typeof payload !== "object") {
    return null
  }

  const raw = payload as Record<string, unknown>
  const normalizedProducts = Array.isArray(raw.normalizedProducts)
    ? raw.normalizedProducts
        .map((entry) => normalizeProduct(entry))
        .filter((entry): entry is NormalizedProduct => entry !== null)
    : []

  const providerResults = Array.isArray(raw.providerResults)
    ? raw.providerResults.map((entry) => {
        const record = entry as Record<string, unknown>

        return {
          supplierName: normalizeNullableString(record.supplierName),
          pipelineOk: record.pipelineOk === true,
          stage: normalizeNullableString(record.stage) ?? "unknown",
          error: normalizeNullableString(record.error),
          normalizedCount:
            typeof record.normalizedCount === "number" && Number.isFinite(record.normalizedCount)
              ? record.normalizedCount
              : 0,
          warnings: normalizeWarnings(record.warnings),
        }
      })
    : []

  return {
    ok: raw.ok === true,
    stage: normalizeNullableString(raw.stage) ?? "unknown",
    error: normalizeNullableString(raw.error),
    traceId: normalizeNullableString(raw.traceId),
    supplierContexts:
      raw.supplierContexts && typeof raw.supplierContexts === "object" && !Array.isArray(raw.supplierContexts)
        ? (raw.supplierContexts as Record<string, { sourceFileName?: string; uploadedByUserId?: string }>)
        : undefined,
    totalProviders:
      typeof raw.totalProviders === "number" && Number.isFinite(raw.totalProviders)
        ? raw.totalProviders
        : providerResults.length,
    totalNormalizedProducts:
      typeof raw.totalNormalizedProducts === "number" && Number.isFinite(raw.totalNormalizedProducts)
        ? raw.totalNormalizedProducts
        : normalizedProducts.length,
    normalizedProducts,
    providerResults,
  }
}
