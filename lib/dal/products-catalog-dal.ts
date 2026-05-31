import { Prisma, StockMovementType } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import {
  deriveStockStatus,
} from "@/lib/products/catalog-validation"
import type {
  ProductCatalogFilters,
  ProductCatalogKpisResponse,
  ProductCatalogSupplierOption,
  DeactivateProductsResponse,
  RestoreProductsResponse,
  ProductDetailDto,
  ProductListItemDto,
  ProductListResponse,
  ProductSortOption,
  ProductStockMovementDto,
  ProductStockStatus,
  StockAdjustmentRequest,
  StockAdjustmentResponse,
  UpdateProductRequest,
} from "@/lib/products/catalog-types"

const PRODUCT_DELETE_TTL_DAYS = 7

function buildDeleteExpiryDate(base = new Date()) {
  const next = new Date(base)
  next.setUTCDate(next.getUTCDate() + PRODUCT_DELETE_TTL_DAYS)
  return next
}

type ProductRow = {
  id: string
  name: string
  supplierProductCode: string
  barcode: string | null
  brand: string | null
  categoryName: string | null
  categoryCode: string | null
  description: string | null
  costPrice: Prisma.Decimal
  salePrice: Prisma.Decimal
  stock: number | null
  minStock: number
  isActive: boolean
  isForSale: boolean
  deletedAt: Date | null
  deleteExpiresAt: Date | null
  createdAt: Date
  updatedAt: Date
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
}

function toProductListItem(product: ProductRow): ProductListItemDto {
  return {
    id: product.id,
    name: product.name,
    supplierProductCode: product.supplierProductCode,
    barcode: product.barcode,
    brand: product.brand,
    categoryName: product.categoryName,
    supplier: product.supplier,
    pricing: {
      costPrice: product.costPrice.toString(),
      salePrice: product.salePrice.toString(),
    },
    inventory: {
      stock: product.stock,
      minStock: product.minStock,
      stockStatus: deriveStockStatus(product.stock, product.minStock),
    },
    flags: {
      isActive: product.isActive,
      isForSale: product.isForSale,
      isDeleted: product.deletedAt !== null,
    },
    deletion: {
      deletedAt: product.deletedAt?.toISOString() ?? null,
      deleteExpiresAt: product.deleteExpiresAt?.toISOString() ?? null,
    },
    updatedAt: product.updatedAt.toISOString(),
  }
}

function getCursorOffset(cursor: string | null) {
  const parsed = Number(cursor)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }

  return Math.trunc(parsed)
}

function buildWhere(filters: ProductCatalogFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {}

  where.deletedAt = null

  if (filters.activityStatus === "active") {
    where.isActive = true
  } else if (filters.activityStatus === "inactive") {
    where.isActive = false
  }

  if (filters.saleStatus === "for_sale") {
    where.isForSale = true
  } else if (filters.saleStatus === "not_for_sale") {
    where.isForSale = false
  }

  if (filters.supplierId) {
    where.supplierId = filters.supplierId
  }

  if (filters.category) {
    where.categoryName = { contains: filters.category, mode: "insensitive" }
  }

  if (filters.brand) {
    where.brand = { contains: filters.brand, mode: "insensitive" }
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { supplierProductCode: { contains: filters.search, mode: "insensitive" } },
      { barcode: { contains: filters.search, mode: "insensitive" } },
      { brand: { contains: filters.search, mode: "insensitive" } },
      { supplier: { name: { contains: filters.search, mode: "insensitive" } } },
    ]
  }

  return where
}

function compareCriticalStock(a: ProductListItemDto, b: ProductListItemDto) {
  const priority: Record<ProductStockStatus, number> = {
    sin_stock:     0,
    stock_bajo:    1,
    stock_normal:  2,
    sin_controlar: 3,
  }

  const byPriority = priority[a.inventory.stockStatus] - priority[b.inventory.stockStatus]
  if (byPriority !== 0) {
    return byPriority
  }

  return a.name.localeCompare(b.name, "es")
}

function sortItems(items: ProductListItemDto[], sort: ProductSortOption) {
  const next = [...items]

  switch (sort) {
    case "critical_stock":
      return next.sort(compareCriticalStock)
    case "name":
      return next.sort((a, b) => a.name.localeCompare(b.name, "es"))
    case "updated_at":
      return next.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    case "sale_price":
      return next.sort((a, b) => Number(a.pricing.salePrice) - Number(b.pricing.salePrice))
    case "stock":
      return next.sort((a, b) => {
        // null al final
        if (a.inventory.stock === null && b.inventory.stock === null) return 0
        if (a.inventory.stock === null) return 1
        if (b.inventory.stock === null) return -1
        return a.inventory.stock - b.inventory.stock
      })
    case "supplier":
      return next.sort((a, b) => {
        const supplierCompare = a.supplier.name.localeCompare(b.supplier.name, "es")
        if (supplierCompare !== 0) return supplierCompare
        return a.name.localeCompare(b.name, "es")
      })
  }
}

export async function listProductCatalog(filters: ProductCatalogFilters): Promise<ProductListResponse> {
  const rows = await prisma.product.findMany({
    where: buildWhere(filters),
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
        },
      },
      currentPriceList: {
        select: {
          id: true,
          name: true,
          sourceType: true,
          status: true,
        },
      },
    },
  })

  const normalized = rows.map(toProductListItem)
  const stockFiltered = filters.stockStatus
    ? normalized.filter((product) => product.inventory.stockStatus === filters.stockStatus)
    : normalized
  const sorted = sortItems(stockFiltered, filters.sort)

  const offset = getCursorOffset(filters.cursor)
  const pageSlice = sorted.slice(offset, offset + filters.limit)
  const hasMore = offset + filters.limit < sorted.length

  return {
    items: pageSlice,
    pageInfo: {
      nextCursor: hasMore ? String(offset + filters.limit) : null,
      hasMore,
      pageSize: filters.limit,
    },
    appliedFilters: {
      search: filters.search,
      supplierId: filters.supplierId,
      category: filters.category,
      brand: filters.brand,
      stockStatus: filters.stockStatus,
      activityStatus: filters.activityStatus,
      saleStatus: filters.saleStatus,
      sort: filters.sort,
    },
  }
}

export async function getProductCatalogKpis(): Promise<ProductCatalogKpisResponse> {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      stock: true,
      minStock: true,
      isActive: true,
      deletedAt: true,
    },
  })

  let lowStockProducts = 0
  let outOfStockProducts = 0
  let activeProducts = 0
  let totalProducts = 0

  for (const product of products) {
    if (product.deletedAt) {
      continue
    }

    totalProducts += 1

    if (product.isActive) {
      activeProducts += 1
    }

    // Productos sin_controlar no cuentan en las alertas de stock
    if (product.stock === null) continue

    const stockStatus = deriveStockStatus(product.stock, product.minStock)

    if (stockStatus === "stock_bajo") {
      lowStockProducts += 1
    }

    if (stockStatus === "sin_stock") {
      outOfStockProducts += 1
    }
  }

  return {
    totalProducts,
    activeProducts,
    lowStockProducts,
    outOfStockProducts,
  }
}

export async function listProductCatalogSuppliers(): Promise<ProductCatalogSupplierOption[]> {
  const suppliers = await prisma.supplier.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  })

  return suppliers
}

function toStockMovementDto(movement: {
  id: string
  type: string
  quantityDelta: number
  previousStock: number | null
  nextStock: number | null
  notes: string | null
  createdAt: Date
  createdBy: {
    id: string
    name: string | null
    email: string | null
  } | null
}): ProductStockMovementDto {
  return {
    id: movement.id,
    type: movement.type,
    quantityDelta: movement.quantityDelta,
    previousStock: movement.previousStock,
    nextStock: movement.nextStock,
    notes: movement.notes,
    createdAt: movement.createdAt.toISOString(),
    createdBy: movement.createdBy,
  }
}

export async function getProductDetail(productId: string): Promise<ProductDetailDto | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
        },
      },
      currentPriceList: {
        select: {
          id: true,
          name: true,
          sourceType: true,
          status: true,
        },
      },
      stockMovements: {
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      saleItems: {
        select: {
          quantity: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })

  if (!product) {
    return null
  }

  if (product.deletedAt) {
    return null
  }

  const totalUnitsSold = product.saleItems.reduce((sum, item) => sum + item.quantity, 0)
  const lastSaleAt = product.saleItems[0]?.createdAt.toISOString() ?? null

  return {
    id: product.id,
    name: product.name,
    supplierProductCode: product.supplierProductCode,
    description: product.description,
    brand: product.brand,
    categoryCode: product.categoryCode,
    categoryName: product.categoryName,
    barcode: product.barcode,
    supplier: product.supplier,
    currentPriceList: product.currentPriceList
      ? {
          id: product.currentPriceList.id,
          name: product.currentPriceList.name,
          sourceType: product.currentPriceList.sourceType,
          status: product.currentPriceList.status,
        }
      : null,
    pricing: {
      costPrice: product.costPrice.toString(),
      salePrice: product.salePrice.toString(),
    },
    inventory: {
      stock: product.stock,
      minStock: product.minStock,
      stockStatus: deriveStockStatus(product.stock, product.minStock),
    },
    flags: {
      isActive: product.isActive,
      isForSale: product.isForSale,
      isDeleted: false,
    },
    deletion: {
      deletedAt: null,
      deleteExpiresAt: null,
    },
    salesSummary: {
      lastSaleAt,
      totalUnitsSold,
    },
    stockMovements: product.stockMovements.map(toStockMovementDto),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }
}

export async function deactivateProducts(productIds: string[]): Promise<DeactivateProductsResponse> {
  const expiresAt = buildDeleteExpiryDate()

  const result = await prisma.product.updateMany({
    where: {
      id: {
        in: productIds,
      },
    },
    data: {
      isActive: false,
      deletedAt: new Date(),
      deleteExpiresAt: expiresAt,
    },
  })

  return {
    processedCount: result.count,
    updatedIds: productIds,
    expiresAt: expiresAt.toISOString(),
  }
}

export async function restoreProducts(productIds: string[]): Promise<RestoreProductsResponse> {
  const result = await prisma.product.updateMany({
    where: {
      id: {
        in: productIds,
      },
      deletedAt: {
        not: null,
      },
    },
    data: {
      isActive: true,
      deletedAt: null,
      deleteExpiresAt: null,
    },
  })

  return {
    processedCount: result.count,
    restoredIds: productIds,
  }
}

export async function updateProduct(productId: string, input: UpdateProductRequest): Promise<ProductDetailDto | null> {
  await prisma.product.update({
    where: { id: productId },
    data: {
      name: input.name,
      description: input.description,
      brand: input.brand,
      categoryCode: input.categoryCode,
      categoryName: input.categoryName,
      barcode: input.barcode,
      costPrice: input.costPrice,
      salePrice: input.salePrice,
      minStock: input.minStock,
      isActive: input.isActive,
      isForSale: input.isForSale,
      ...(input.isActive === true
        ? {
            deletedAt: null,
            deleteExpiresAt: null,
          }
        : {}),
    },
  })

  return getProductDetail(productId)
}

export async function createManualStockAdjustment(
  productId: string,
  input: StockAdjustmentRequest,
  userId: string,
): Promise<StockAdjustmentResponse | null> {
  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        stock: true,
      },
    })

    if (!product) {
      return null
    }

    const movement = await tx.stockMovement.create({
      data: {
        productId,
        createdByUserId: userId,
        type: StockMovementType.MANUAL_ADJUSTMENT,
        quantityDelta: input.nextStock - (product.stock ?? 0),
        previousStock: product.stock,
        nextStock: input.nextStock,
        notes: input.notes ?? null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    await tx.product.update({
      where: { id: productId },
      data: {
        stock: input.nextStock,
      },
    })

    return {
      productId,
      stock: input.nextStock,
      movement: toStockMovementDto(movement),
    } satisfies StockAdjustmentResponse
  })

  return result
}

export async function purgeExpiredDeletedProducts() {
  const now = new Date()

  const candidates = await prisma.product.findMany({
    where: {
      deletedAt: {
        not: null,
      },
      deleteExpiresAt: {
        lte: now,
      },
      saleItems: {
        none: {},
      },
    },
    select: {
      id: true,
    },
  })

  const candidateIds = candidates.map((product) => product.id)

  if (candidateIds.length === 0) {
    return {
      purgedCount: 0,
      purgedIds: [],
    }
  }

  const result = await prisma.product.deleteMany({
    where: {
      id: {
        in: candidateIds,
      },
    },
  })

  return {
    purgedCount: result.count,
    purgedIds: candidateIds,
  }
}
