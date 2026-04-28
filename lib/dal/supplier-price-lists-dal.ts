import { prisma } from "@/lib/prisma"
import type {
  CreateManualSupplierPriceListInput,
  ManualSupplierPriceListItem,
  ManualSupplierPriceListListResult,
} from "@/lib/products/manual-product-types"
import { ManualProductError } from "@/lib/products/manual-product-validation"

function toManualSupplierPriceListItem(
  priceList: {
    id: string
    supplierId: string
    uploadedByUserId: string | null
    sourceType: "IMPORTED" | "MANUAL"
    status: "DRAFT" | "PROCESSED" | "FAILED" | "ARCHIVED"
    name: string
    sourceFileName: string | null
    effectiveAt: Date | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    _count: {
      items: number
    }
  },
): ManualSupplierPriceListItem {
  return {
    id: priceList.id,
    supplierId: priceList.supplierId,
    uploadedByUserId: priceList.uploadedByUserId,
    sourceType: priceList.sourceType,
    status: priceList.status,
    name: priceList.name,
    sourceFileName: priceList.sourceFileName,
    effectiveAt: priceList.effectiveAt?.toISOString() ?? null,
    notes: priceList.notes,
    createdAt: priceList.createdAt.toISOString(),
    updatedAt: priceList.updatedAt.toISOString(),
    itemsCount: priceList._count.items,
  }
}

async function ensureSupplierExists(supplierId: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { id: true },
  })

  if (!supplier) {
    throw new ManualProductError("El proveedor no existe.", 404)
  }
}

export async function listSupplierPriceLists(
  supplierId: string,
): Promise<ManualSupplierPriceListListResult> {
  await ensureSupplierExists(supplierId)

  const priceLists = await prisma.supplierPriceList.findMany({
    where: { supplierId },
    orderBy: [{ createdAt: "desc" }],
    include: {
      _count: {
        select: {
          items: true,
        },
      },
    },
  })

  return {
    items: priceLists.map(toManualSupplierPriceListItem),
  }
}

export async function createManualSupplierPriceList(
  supplierId: string,
  input: CreateManualSupplierPriceListInput,
  uploadedByUserId: string,
) {
  await ensureSupplierExists(supplierId)

  const priceList = await prisma.supplierPriceList.create({
    data: {
      supplierId,
      uploadedByUserId,
      sourceType: "MANUAL",
      status: "DRAFT",
      name: input.name,
      effectiveAt: input.effectiveAt ? new Date(input.effectiveAt) : null,
      notes: input.notes ?? null,
    },
    include: {
      _count: {
        select: {
          items: true,
        },
      },
    },
  })

  return toManualSupplierPriceListItem(priceList)
}
