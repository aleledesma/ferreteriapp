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

    for (const product of products) {
      const supplierProductCode = resolveSupplierProductCode(product)
      const name = resolveProductName(product)
      const costPrice = resolveProductCost(product)

      if (!supplierProductCode || !name || costPrice === null) {
        itemsSkipped += 1
        continue
      }

      const existingProduct = await tx.product.findUnique({
        where: {
          supplierId_supplierProductCode: {
            supplierId: supplier.id,
            supplierProductCode,
          },
        },
        select: {
          id: true,
          salePrice: true,
        },
      })

      const productRecord = existingProduct
        ? await tx.product.update({
            where: { id: existingProduct.id },
            data: {
              currentPriceListId: priceList.id,
              name,
              description: resolveProductDescription(product),
              brand: toNullableText(product.brand),
              categoryCode: null,
              categoryName: toNullableText(product.category),
              barcode: toNullableText(product.barcode),
              costPrice,
              salePrice: existingProduct.salePrice,
            },
          })
        : await tx.product.create({
            data: {
              supplierId: supplier.id,
              currentPriceListId: priceList.id,
              supplierProductCode,
              name,
              description: resolveProductDescription(product),
              brand: toNullableText(product.brand),
              categoryCode: null,
              categoryName: toNullableText(product.category),
              barcode: toNullableText(product.barcode),
              costPrice,
              salePrice: costPrice,
            },
          })

      if (existingProduct) {
        productsUpdated += 1
      } else {
        productsCreated += 1
      }

      await tx.supplierPriceListItem.create({
        data: {
          priceListId: priceList.id,
          productId: productRecord.id,
          supplierProductCode,
          rawName: name,
          rawDescription: resolveProductDescription(product),
          brand: toNullableText(product.brand),
          categoryCode: null,
          categoryName: toNullableText(product.category),
          barcode: toNullableText(product.barcode),
          listPrice: toNullableNumber(product.listPrice),
          offerPrice: toNullableNumber(product.offerPrice),
          vatRate: toNullableNumber(product.taxRate),
        },
      })

      itemsImported += 1
    }

    return {
      supplierName,
      priceListId: priceList.id,
      productsCreated,
      productsUpdated,
      itemsImported,
      itemsSkipped,
    }
  })
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
