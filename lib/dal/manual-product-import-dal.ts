import { prisma } from "@/lib/prisma"
import type {
  ManualBatchProductInput,
  ManualExistingProductConflict,
  ManualProductBatchInput,
  ManualProductBatchResult,
} from "@/lib/products/manual-product-types"
import {
  ManualProductConflictError,
  ManualProductError,
} from "@/lib/products/manual-product-validation"

function toCreateOrUpdateProductData(
  product: ManualBatchProductInput,
  priceListId: string,
) {
  return {
    currentPriceListId: priceListId,
    name: product.name,
    description: product.description ?? null,
    brand: product.brand ?? null,
    categoryCode: product.categoryCode ?? null,
    categoryName: product.categoryName ?? null,
    barcode: product.barcode ?? null,
    costPrice: product.costPrice,
    salePrice: product.salePrice,
    minStock: product.minStock ?? 0,
    isActive: product.isActive ?? true,
    isForSale: product.isForSale ?? true,
  }
}

export async function createManualProductBatch(
  input: ManualProductBatchInput,
  createdByUserId: string,
): Promise<ManualProductBatchResult> {
  return prisma.$transaction(async (tx) => {
    const priceList = await tx.supplierPriceList.findUnique({
      where: { id: input.priceListId },
      select: {
        id: true,
        supplierId: true,
        sourceType: true,
        status: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
    })

    if (!priceList) {
      throw new ManualProductError("La lista de precios no existe.", 404)
    }

    if (priceList.sourceType !== "MANUAL") {
      throw new ManualProductError(
        "La carga manual solo puede usarse sobre listas de precios manuales.",
      )
    }

    if (priceList.status !== "DRAFT") {
      throw new ManualProductError(
        "La lista de precios debe estar en estado DRAFT para aceptar una carga manual.",
        409,
      )
    }

    if (priceList._count.items > 0) {
      throw new ManualProductError(
        "La lista de precios ya contiene items. Usa una lista manual nueva para este lote.",
        409,
      )
    }

    const existingProducts = await tx.product.findMany({
      where: {
        supplierId: priceList.supplierId,
        supplierProductCode: {
          in: input.products.map((product) => product.supplierProductCode),
        },
      },
      select: {
        id: true,
        supplierProductCode: true,
        name: true,
        costPrice: true,
        salePrice: true,
        stock: true,
        minStock: true,
        isActive: true,
        isForSale: true,
      },
    })

    const existingProductMap = new Map(
      existingProducts.map((product) => [product.supplierProductCode, product]),
    )

    const conflicts: ManualExistingProductConflict[] = input.products
      .map((product) => {
        const existingProduct = existingProductMap.get(product.supplierProductCode)
        if (!existingProduct) {
          return null
        }

        return {
          productId: existingProduct.id,
          supplierProductCode: existingProduct.supplierProductCode,
          current: {
            name: existingProduct.name,
            costPrice: Number(existingProduct.costPrice),
            salePrice: Number(existingProduct.salePrice),
            stock: existingProduct.stock,
            minStock: existingProduct.minStock,
            isActive: existingProduct.isActive,
            isForSale: existingProduct.isForSale,
          },
          incoming: {
            name: product.name,
            costPrice: product.costPrice,
            salePrice: product.salePrice,
            stockToAdd: product.initialStock,
            resultingStock: existingProduct.stock + product.initialStock,
            minStock: product.minStock ?? 0,
            isActive: product.isActive ?? true,
            isForSale: product.isForSale ?? true,
          },
        }
      })
      .filter((entry): entry is ManualExistingProductConflict => entry !== null)

    if (conflicts.length > 0 && !input.confirmUpdates) {
      throw new ManualProductConflictError(
        "Ya existen productos para este proveedor con los mismos códigos. Confirma si deseas actualizarlos.",
        conflicts,
      )
    }

    let productsCreated = 0
    let productsUpdated = 0
    let stockMovementsCreated = 0

    const priceListItems: Array<{
      priceListId: string
      productId: string
      supplierProductCode: string
      rawName: string
      rawDescription: string | null
      brand: string | null
      categoryCode: string | null
      categoryName: string | null
      barcode: string | null
      listPrice: number | null
      offerPrice: number | null
      vatRate: number | null
    }> = []

    for (const product of input.products) {
      const existingProduct = existingProductMap.get(product.supplierProductCode)

      if (existingProduct) {
        const nextStock = existingProduct.stock + product.initialStock

        const updatedProduct = await tx.product.update({
          where: { id: existingProduct.id },
          data: {
            stock: nextStock,
            ...toCreateOrUpdateProductData(product, priceList.id),
          },
          select: { id: true },
        })

        if (product.initialStock > 0) {
          await tx.stockMovement.create({
            data: {
              productId: updatedProduct.id,
              createdByUserId,
              type: "MANUAL_ADJUSTMENT",
              quantityDelta: product.initialStock,
              previousStock: existingProduct.stock,
              nextStock,
              notes: "Ajuste manual por actualización de producto existente.",
            },
          })

          stockMovementsCreated += 1
        }

        priceListItems.push({
          priceListId: priceList.id,
          productId: updatedProduct.id,
          supplierProductCode: product.supplierProductCode,
          rawName: product.name,
          rawDescription: product.description ?? null,
          brand: product.brand ?? null,
          categoryCode: product.categoryCode ?? null,
          categoryName: product.categoryName ?? null,
          barcode: product.barcode ?? null,
          listPrice: product.listPrice ?? null,
          offerPrice: product.offerPrice ?? null,
          vatRate: product.vatRate ?? null,
        })

        productsUpdated += 1
        continue
      }

      const createdProduct = await tx.product.create({
        data: {
          supplierId: priceList.supplierId,
          supplierProductCode: product.supplierProductCode,
          stock: product.initialStock,
          ...toCreateOrUpdateProductData(product, priceList.id),
        },
        select: { id: true },
      })

      if (
        product.initialStock > 0
      ) {
        await tx.stockMovement.create({
          data: {
            productId: createdProduct.id,
            createdByUserId,
            type: "INITIAL",
            quantityDelta: product.initialStock,
            previousStock: 0,
            nextStock: product.initialStock,
            notes: "Carga manual inicial de producto.",
          },
        })

        stockMovementsCreated += 1
      }

      priceListItems.push({
        priceListId: priceList.id,
        productId: createdProduct.id,
        supplierProductCode: product.supplierProductCode,
        rawName: product.name,
        rawDescription: product.description ?? null,
        brand: product.brand ?? null,
        categoryCode: product.categoryCode ?? null,
        categoryName: product.categoryName ?? null,
        barcode: product.barcode ?? null,
        listPrice: product.listPrice ?? null,
        offerPrice: product.offerPrice ?? null,
        vatRate: product.vatRate ?? null,
      })

      productsCreated += 1
    }

    if (priceListItems.length > 0) {
      await tx.supplierPriceListItem.createMany({
        data: priceListItems,
      })
    }

    await tx.supplierPriceList.update({
      where: { id: priceList.id },
      data: {
        status: "PROCESSED",
      },
    })

    return {
      priceListId: priceList.id,
      supplierId: priceList.supplierId,
      updatedExistingProducts: conflicts.length > 0,
      productsCreated,
      productsUpdated,
      itemsImported: priceListItems.length,
      stockMovementsCreated,
    }
  }, { timeout: 20000 })
}
