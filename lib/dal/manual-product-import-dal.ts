import { prisma } from "@/lib/prisma"
import type {
  ManualBatchProductInput,
  ManualExistingProductConflict,
  ManualProductInput,
  ManualProductResult,
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

export async function createManualProduct(
  input: ManualProductInput,
  createdByUserId: string,
): Promise<ManualProductResult> {
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
          in: [input.product.supplierProductCode],
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

    const existingProduct = existingProductMap.get(input.product.supplierProductCode)
    const incomingStock   = input.product.initialStock ?? null
    const conflicts: ManualExistingProductConflict[] = existingProduct
      ? [
          {
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
              name: input.product.name,
              costPrice: input.product.costPrice,
              salePrice: input.product.salePrice,
              stockToAdd: incomingStock,
              resultingStock: incomingStock === null
                ? existingProduct.stock
                : (existingProduct.stock ?? 0) + incomingStock,
              minStock: input.product.minStock ?? 0,
              isActive: input.product.isActive ?? true,
              isForSale: input.product.isForSale ?? true,
            },
          },
        ]
      : []

    if (conflicts.length > 0 && !input.confirmUpdates) {
      throw new ManualProductConflictError(
        "Ya existen productos para este proveedor con los mismos códigos. Confirma si deseas actualizarlos.",
        conflicts,
      )
    }

    let stockMovementsCreated = 0
    let updatedExistingProduct = false
    let productId: string

    if (existingProduct) {
      // Si no se especifica stock, no se toca el stock existente
      const nextStock = incomingStock === null
        ? existingProduct.stock
        : (existingProduct.stock ?? 0) + incomingStock

      const updatedProduct = await tx.product.update({
        where: { id: existingProduct.id },
        data: {
          stock: nextStock,
          ...toCreateOrUpdateProductData(input.product, priceList.id),
        },
        select: { id: true },
      })

      productId = updatedProduct.id
      updatedExistingProduct = true

      if (incomingStock !== null && incomingStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: updatedProduct.id,
            createdByUserId,
            type: "MANUAL_ADJUSTMENT",
            quantityDelta: incomingStock,
            previousStock: existingProduct.stock,
            nextStock,
            notes: "Ajuste manual por actualización de producto existente.",
          },
        })

        stockMovementsCreated += 1
      }
    } else {
      // stock null = sin controlar; stock 0 o mayor = controlado desde el inicio
      const createdProduct = await tx.product.create({
        data: {
          supplierId: priceList.supplierId,
          supplierProductCode: input.product.supplierProductCode,
          stock: incomingStock ?? undefined,
          ...toCreateOrUpdateProductData(input.product, priceList.id),
        },
        select: { id: true },
      })

      productId = createdProduct.id

      if (incomingStock !== null && incomingStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: createdProduct.id,
            createdByUserId,
            type: "INITIAL",
            quantityDelta: incomingStock,
            previousStock: 0,
            nextStock: incomingStock,
            notes: "Carga manual inicial de producto.",
          },
        })

        stockMovementsCreated += 1
      }
    }

    await tx.supplierPriceListItem.create({
      data: {
        priceListId: priceList.id,
        productId,
        supplierProductCode: input.product.supplierProductCode,
        rawName: input.product.name,
        rawDescription: input.product.description ?? null,
        brand: input.product.brand ?? null,
        categoryCode: input.product.categoryCode ?? null,
        categoryName: input.product.categoryName ?? null,
        barcode: input.product.barcode ?? null,
        listPrice: input.product.listPrice ?? null,
        offerPrice: input.product.offerPrice ?? null,
        vatRate: input.product.vatRate ?? null,
      },
    })

    await tx.supplierPriceList.update({
      where: { id: priceList.id },
      data: {
        status: "PROCESSED",
      },
    })

    return {
      priceListId: priceList.id,
      supplierId: priceList.supplierId,
      updatedExistingProduct,
      productId,
      stockMovementsCreated,
    }
  }, { timeout: 20000 })
}
