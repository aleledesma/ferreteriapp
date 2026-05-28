export type CustomerFilters = {
  search?: string
  activeOnly?: boolean
  page: number
  pageSize: number
}

export type CustomerListItem = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  relatedSalesCount: number
}

export type CustomerListResult = {
  items: CustomerListItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export type CustomerMutationInput = {
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  address?: string | null
  notes?: string | null
}

export type CustomerDeleteResult = {
  mode: "soft-delete" | "hard-delete"
  customerId: string
}
