export type SupplierFilters = {
  search?: string
  page: number
  pageSize: number
}

export type SupplierListItem = {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  relatedPriceListsCount: number
  relatedProductsCount: number
}

export type SupplierListResult = {
  items: SupplierListItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export type SupplierMutationInput = {
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  notes?: string | null
}

export type SupplierDeleteResult = {
  mode: "soft-delete" | "hard-delete"
  supplierId: string
}
