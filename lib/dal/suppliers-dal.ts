import { prisma } from "@/lib/prisma"
import type {
  SupplierDeleteResult,
  SupplierFilters,
  SupplierListItem,
  SupplierListResult,
  SupplierMutationInput,
} from "@/lib/suppliers/types"

function toSupplierListItem(
  supplier: {
    id: string
    name: string
    email: string | null
    phone: string | null
    address: string | null
    notes: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: {
      priceLists: number
      products: number
    }
  },
): SupplierListItem {
  return {
    id: supplier.id,
    name: supplier.name,
    email: supplier.email,
    phone: supplier.phone,
    address: supplier.address,
    notes: supplier.notes,
    isActive: supplier.isActive,
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt.toISOString(),
    relatedPriceListsCount: supplier._count.priceLists,
    relatedProductsCount: supplier._count.products,
  }
}

export async function listSuppliers(filters: SupplierFilters): Promise<SupplierListResult> {
  const where = filters.search
    ? {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" as const } },
          { email: { contains: filters.search, mode: "insensitive" as const } },
          { phone: { contains: filters.search, mode: "insensitive" as const } },
        ],
      }
    : undefined

  const [total, suppliers] = await Promise.all([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      include: {
        _count: {
          select: {
            priceLists: true,
            products: true,
          },
        },
      },
    }),
  ])

  return {
    items: suppliers.map(toSupplierListItem),
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    },
  }
}

export async function createSupplier(input: SupplierMutationInput) {
  const supplier = await prisma.supplier.create({
    data: input,
    include: {
      _count: {
        select: {
          priceLists: true,
          products: true,
        },
      },
    },
  })

  return toSupplierListItem(supplier)
}

export async function updateSupplier(supplierId: string, input: SupplierMutationInput) {
  const supplier = await prisma.supplier.update({
    where: { id: supplierId },
    data: input,
    include: {
      _count: {
        select: {
          priceLists: true,
          products: true,
        },
      },
    },
  })

  return toSupplierListItem(supplier)
}

export async function reactivateSupplier(supplierId: string) {
  const supplier = await prisma.supplier.update({
    where: { id: supplierId },
    data: { isActive: true },
    include: {
      _count: {
        select: {
          priceLists: true,
          products: true,
        },
      },
    },
  })

  return toSupplierListItem(supplier)
}

export async function deleteSupplier(supplierId: string): Promise<SupplierDeleteResult> {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: {
      id: true,
      _count: {
        select: {
          priceLists: true,
          products: true,
        },
      },
    },
  })

  if (!supplier) {
    throw new Error("El proveedor no existe.")
  }

  const hasRelations = supplier._count.priceLists > 0 || supplier._count.products > 0

  if (hasRelations) {
    await prisma.supplier.update({
      where: { id: supplierId },
      data: { isActive: false },
    })

    return {
      mode: "soft-delete",
      supplierId,
    }
  }

  await prisma.supplier.delete({
    where: { id: supplierId },
  })

  return {
    mode: "hard-delete",
    supplierId,
  }
}
