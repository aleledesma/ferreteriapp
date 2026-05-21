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
  return toNullableNumber(product.offerPrice) ?? toNullableNumber(product.listPrice)
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

export async function persistNormalizedSupplierGroup({
  prisma,
  supplierName,
  products,
  context,
}: PersistSupplierGroupInput) {
  return prisma.$transaction(async (tx) => {
    const supplier = await getOrCreateSupplier(tx, supplierName)

    const priceList = await tx.supplierPriceList.create({
      data: {
        supplierId: supplier.id,
        uploadedByUserId: context?.uploadedByUserId,
        status: "PROCESSED",
        name: buildPriceListName(supplierName, context?.sourceFileName),
        sourceFileName: context?.sourceFileName,
        effectiveAt: new Date(),
      },
    })

    let productsCreated = 0
    let productsUpdated = 0
    let itemsImported = 0
    let itemsSkipped = 0

    const candidates = products
      .map((product) => {
        const supplierProductCode = resolveSupplierProductCode(product)
        const name = resolveProductName(product)
        const costPrice = resolveProductCost(product)

        if (!supplierProductCode || !name || costPrice === null) {
          return null
        }

        return {
          product,
          supplierProductCode,
          name,
          costPrice,
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)

    itemsSkipped += products.length - candidates.length

    const existingProducts = candidates.length
      ? await tx.product.findMany({
          where: {
            supplierId: supplier.id,
            supplierProductCode: {
              in: candidates.map((entry) => entry.supplierProductCode),
            },
          },
          select: {
            id: true,
            supplierProductCode: true,
            salePrice: true,
          },
        })
      : []

    const existingProductMap = new Map(
      existingProducts.map((existingProduct) => [
        existingProduct.supplierProductCode,
        existingProduct,
      ]),
    )

    const productRecords = new Map<string, { id: string; salePrice: Prisma.Decimal | number }>()

    for (const candidate of candidates) {
      const existingProduct = existingProductMap.get(candidate.supplierProductCode)

      if (existingProduct) {
        const updatedProduct = await tx.product.update({
          where: { id: existingProduct.id },
          data: buildProductUpdateData(
            candidate.product,
            priceList.id,
            candidate.costPrice,
            existingProduct.salePrice,
            candidate.name,
          ),
          select: {
            id: true,
            salePrice: true,
          },
        })

        existingProductMap.set(candidate.supplierProductCode, {
          ...existingProduct,
          ...updatedProduct,
        })
        productRecords.set(candidate.supplierProductCode, updatedProduct)
        productsUpdated += 1
        continue
      }

      const createdProduct = await tx.product.create({
        data: {
          supplierId: supplier.id,
          supplierProductCode: candidate.supplierProductCode,
          ...buildProductUpdateData(
            candidate.product,
            priceList.id,
            candidate.costPrice,
            candidate.costPrice,
            candidate.name,
          ),
        },
        select: {
          id: true,
          salePrice: true,
        },
      })

      existingProductMap.set(candidate.supplierProductCode, {
        id: createdProduct.id,
        supplierProductCode: candidate.supplierProductCode,
        salePrice: createdProduct.salePrice,
      })
      productRecords.set(candidate.supplierProductCode, createdProduct)
      productsCreated += 1
    }

    const priceListItems = candidates.map((candidate) => {
      const linkedProduct = productRecords.get(candidate.supplierProductCode)

      return {
        priceListId: priceList.id,
        productId: linkedProduct?.id,
        supplierProductCode: candidate.supplierProductCode,
        rawName: candidate.name,
        rawDescription: resolveProductDescription(candidate.product),
        brand: toNullableText(candidate.product.brand),
        categoryCode: null,
        categoryName: toNullableText(candidate.product.category),
        barcode: toNullableText(candidate.product.barcode),
        listPrice: toNullableNumber(candidate.product.listPrice),
        offerPrice: toNullableNumber(candidate.product.offerPrice),
        vatRate: toNullableNumber(candidate.product.taxRate),
      }
    })

    if (priceListItems.length > 0) {
      await tx.supplierPriceListItem.createMany({
        data: priceListItems,
      })
    }

    itemsImported += priceListItems.length

    return {
      supplierName,
      priceListId: priceList.id,
      productsCreated,
      productsUpdated,
      itemsImported,
      itemsSkipped,
    }
  }, { timeout: 20000 })
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
