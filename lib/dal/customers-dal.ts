import { prisma } from "@/lib/prisma"
import type {
  CustomerDeleteResult,
  CustomerFilters,
  CustomerListItem,
  CustomerListResult,
  CustomerMutationInput,
} from "@/lib/customers/types"

function toCustomerListItem(
  customer: {
    id: string
    firstName: string
    lastName: string
    email: string | null
    phone: string | null
    address: string | null
    notes: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: {
      sales: number
    }
  },
): CustomerListItem {
  return {
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    notes: customer.notes,
    isActive: customer.isActive,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
    relatedSalesCount: customer._count.sales,
  }
}

export async function listCustomers(filters: CustomerFilters): Promise<CustomerListResult> {
  const where = filters.search
    ? {
        OR: [
          { firstName: { contains: filters.search, mode: "insensitive" as const } },
          { lastName: { contains: filters.search, mode: "insensitive" as const } },
          { email: { contains: filters.search, mode: "insensitive" as const } },
          { phone: { contains: filters.search, mode: "insensitive" as const } },
        ],
      }
    : undefined

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { firstName: "asc" }, { lastName: "asc" }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      include: {
        _count: {
          select: {
            sales: true,
          },
        },
      },
    }),
  ])

  return {
    items: customers.map(toCustomerListItem),
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    },
  }
}

export async function createCustomer(input: CustomerMutationInput) {
  const customer = await prisma.customer.create({
    data: input,
    include: {
      _count: {
        select: {
          sales: true,
        },
      },
    },
  })

  return toCustomerListItem(customer)
}

export async function updateCustomer(customerId: string, input: CustomerMutationInput) {
  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: input,
    include: {
      _count: {
        select: {
          sales: true,
        },
      },
    },
  })

  return toCustomerListItem(customer)
}

export async function reactivateCustomer(customerId: string) {
  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: { isActive: true },
    include: {
      _count: {
        select: {
          sales: true,
        },
      },
    },
  })

  return toCustomerListItem(customer)
}

export async function deleteCustomer(customerId: string): Promise<CustomerDeleteResult> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      _count: {
        select: {
          sales: true,
        },
      },
    },
  })

  if (!customer) {
    throw new Error("El cliente no existe.")
  }

  const hasRelations = customer._count.sales > 0

  if (hasRelations) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { isActive: false },
    })

    return {
      mode: "soft-delete",
      customerId,
    }
  }

  await prisma.customer.delete({
    where: { id: customerId },
  })

  return {
    mode: "hard-delete",
    customerId,
  }
}