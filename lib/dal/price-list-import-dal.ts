import type { Prisma, PrismaClient } from "@prisma/client"

import type {
  NormalizedProduct,
  PersistNormalizedImportResult,
  SupplierImportContext,
} from "@/lib/price-list-import/types"

function toNullableText(value: string | null | undefined) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function toNullableNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function resolveSupplierProductCode(product: NormalizedProduct) {
  return toNullableText(product.supplierSku) ?? toNullableText(product.sku)
}

function resolveProductName(product: NormalizedProduct) {
  return toNullableText(product.name)
}

function resolveProductCost(product: NormalizedProduct) {
  const listPrice = toNullableNumber(product.listPrice)
  const offerPrice = toNullableNumber(product.offerPrice)

  if (listPrice !== null && offerPrice !== null) {
    return Math.min(listPrice, offerPrice)
  }

  return offerPrice ?? listPrice
}

function resolveProvidedSalePrice(product: NormalizedProduct) {
  const listPrice = toNullableNumber(product.listPrice)
  const offerPrice = toNullableNumber(product.offerPrice)

  if (listPrice === null || offerPrice === null) {
    return null
  }

  if (listPrice === offerPrice) {
    return null
  }

  return Math.max(listPrice, offerPrice)
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2))
}

function resolveSalePrice({
  product,
  costPrice,
  context,
}: {
  product: NormalizedProduct
  costPrice: number
  context?: SupplierImportContext
}) {
  const marginPercentage =
    typeof context?.saleMarginPercentage === "number" && Number.isFinite(context.saleMarginPercentage)
      ? context.saleMarginPercentage
      : 0
  const keepExistingSalePrice = context?.keepExistingSalePrice !== false
  const calculatedSalePrice = roundCurrency(costPrice * (1 + marginPercentage / 100))
  const providedSalePrice = resolveProvidedSalePrice(product)

  if (keepExistingSalePrice && providedSalePrice !== null) {
    return providedSalePrice
  }

  return calculatedSalePrice
}

function resolveProductDescription(product: NormalizedProduct) {
  const original = product.originalProduct
  if (!original || typeof original !== "object") {
    return toNullableText(product.name)
  }

  const candidateKeys = ["descripcion", "description", "nombre", "name"]
  for (const key of candidateKeys) {
    const rawValue = original[key]
    if (typeof rawValue === "string" && rawValue.trim().length > 0) {
      return rawValue.trim()
    }
  }

  return toNullableText(product.name)
}

function buildPriceListName(supplierName: string, sourceFileName?: string) {
  if (sourceFileName) {
    return sourceFileName
  }

  const dateStamp = new Date().toISOString().slice(0, 19)
  return `${supplierName} - ${dateStamp}`
}

function buildProductUpdateData(
  product: NormalizedProduct,
  priceListId: string,
  costPrice: number,
  salePrice: Prisma.Decimal | number,
  name: string,
) {
  return {
    currentPriceListId: priceListId,
    name,
    description: resolveProductDescription(product),
    brand: toNullableText(product.brand),
    categoryCode: null,
    categoryName: toNullableText(product.category),
    barcode: toNullableText(product.barcode),
    costPrice,
    salePrice,
  }
}

async function getOrCreateSupplier(tx: Prisma.TransactionClient, supplierName: string) {
  const existingSupplier = await tx.supplier.findFirst({
    where: {
      name: {
        equals: supplierName,
        mode: "insensitive",
      },
    },
  })

  if (existingSupplier) {
    return existingSupplier
  }

  return tx.supplier.create({
    data: {
      name: supplierName,
    },
  })
}

type PersistSupplierGroupInput = {
  prisma: PrismaClient
  supplierName: string
  products: NormalizedProduct[]
  context?: SupplierImportContext
}

// Tamaño de lote para updates concurrentes — limita la presión sobre el pooler
const UPDATE_BATCH_SIZE = 50

export async function persistNormalizedSupplierGroup({
  prisma,
  supplierName,
  products,
  context,
}: PersistSupplierGroupInput) {
  // ── 1. Transacción corta: solo supplier + price list ────────────────────────
  const { supplier, priceList } = await prisma.$transaction(async (tx) => {
    const supplier = await getOrCreateSupplier(tx, supplierName)
    const priceList = await tx.supplierPriceList.create({
      data: {
        supplierId:      supplier.id,
        uploadedByUserId: context?.uploadedByUserId,
        status:          "PROCESSED",
        name:            buildPriceListName(supplierName, context?.sourceFileName),
        sourceFileName:  context?.sourceFileName,
        effectiveAt:     new Date(),
      },
    })
    return { supplier, priceList }
  })

  // ── 2. Preparar candidatos válidos ──────────────────────────────────────────
  let itemsSkipped = 0

  const candidates = products
    .map((product) => {
      const supplierProductCode = resolveSupplierProductCode(product)
      const name      = resolveProductName(product)
      const costPrice = resolveProductCost(product)

      if (!supplierProductCode || !name || costPrice === null) return null

      return {
        product,
        supplierProductCode,
        name,
        costPrice,
        salePrice: resolveSalePrice({ product, costPrice, context }),
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)

  itemsSkipped += products.length - candidates.length

  // ── 3. Buscar productos existentes (1 sola query) ───────────────────────────
  const existingProducts = candidates.length
    ? await prisma.product.findMany({
        where: {
          supplierId:          supplier.id,
          supplierProductCode: { in: candidates.map((c) => c.supplierProductCode) },
        },
        select: { id: true, supplierProductCode: true, salePrice: true },
      })
    : []

  const existingProductMap = new Map(
    existingProducts.map((p) => [p.supplierProductCode, p]),
  )

  const toCreate = candidates.filter((c) => !existingProductMap.has(c.supplierProductCode))
  const toUpdate = candidates.filter((c) =>  existingProductMap.has(c.supplierProductCode))

  const productRecords = new Map<string, { id: string; salePrice: Prisma.Decimal | number }>()

  // ── 4a. Crear productos nuevos con createMany (1 query) ─────────────────────
  if (toCreate.length > 0) {
    await prisma.product.createMany({
      data: toCreate.map((c) => ({
        supplierId:          supplier.id,
        supplierProductCode: c.supplierProductCode,
        ...buildProductUpdateData(c.product, priceList.id, c.costPrice, c.salePrice, c.name),
      })),
    })

    // Recuperar los IDs recién creados (1 query)
    const created = await prisma.product.findMany({
      where: {
        supplierId:          supplier.id,
        supplierProductCode: { in: toCreate.map((c) => c.supplierProductCode) },
      },
      select: { id: true, supplierProductCode: true, salePrice: true },
    })

    for (const p of created) {
      productRecords.set(p.supplierProductCode, p)
    }
  }

  // ── 4b. Actualizar productos existentes en batches concurrentes ──────────────
  for (let i = 0; i < toUpdate.length; i += UPDATE_BATCH_SIZE) {
    const batch = toUpdate.slice(i, i + UPDATE_BATCH_SIZE)

    const results = await Promise.all(
      batch.map((c) =>
        prisma.product.update({
          where: { id: existingProductMap.get(c.supplierProductCode)!.id },
          data:  buildProductUpdateData(c.product, priceList.id, c.costPrice, c.salePrice, c.name),
          select: { id: true, salePrice: true },
        }),
      ),
    )

    results.forEach((r, idx) => {
      productRecords.set(batch[idx].supplierProductCode, r)
    })
  }

  // ── 5. Crear ítems de lista de precios en bulk (1 query) ────────────────────
  const priceListItems = candidates.map((c) => {
    const linked = productRecords.get(c.supplierProductCode)
    return {
      priceListId:         priceList.id,
      productId:           linked?.id,
      supplierProductCode: c.supplierProductCode,
      rawName:             c.name,
      rawDescription:      resolveProductDescription(c.product),
      brand:               toNullableText(c.product.brand),
      categoryCode:        null,
      categoryName:        toNullableText(c.product.category),
      barcode:             toNullableText(c.product.barcode),
      listPrice:           toNullableNumber(c.product.listPrice),
      offerPrice:          toNullableNumber(c.product.offerPrice),
      vatRate:             toNullableNumber(c.product.taxRate),
    }
  })

  if (priceListItems.length > 0) {
    await prisma.supplierPriceListItem.createMany({ data: priceListItems })
  }

  return {
    supplierName,
    priceListId:     priceList.id,
    productsCreated: toCreate.length,
    productsUpdated: toUpdate.length,
    itemsImported:   priceListItems.length,
    itemsSkipped,
  }
}

export function buildPersistSummary(
  supplierResults: PersistNormalizedImportResult["suppliers"],
): PersistNormalizedImportResult {
  return {
    suppliersProcessed: supplierResults.length,
    totalProductsCreated: supplierResults.reduce(
      (total, result) => total + result.productsCreated,
      0,
    ),
    totalProductsUpdated: supplierResults.reduce(
      (total, result) => total + result.productsUpdated,
      0,
    ),
    totalItemsImported: supplierResults.reduce(
      (total, result) => total + result.itemsImported,
      0,
    ),
    totalItemsSkipped: supplierResults.reduce(
      (total, result) => total + result.itemsSkipped,
      0,
    ),
    suppliers: supplierResults,
  }
}
