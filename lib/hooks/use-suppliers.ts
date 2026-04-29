"use client"

import { useCallback, useEffect, useState } from "react"

import type { SupplierListItem, SupplierListResult } from "@/lib/suppliers/types"

type UseSuppliersOptions = {
  pageSize?: number
}

export function useSuppliers(options: UseSuppliersOptions = {}) {
  const { pageSize = 100 } = options
  const [suppliers, setSuppliers] = useState<SupplierListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/suppliers?page=1&pageSize=${pageSize}`)
      const payload = (await response.json()) as SupplierListResult & {
        error?: string
      }

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo cargar el listado de proveedores.")
      }

      setSuppliers(payload.items)
      setError(null)
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "No se pudo cargar el listado de proveedores.",
      )
    } finally {
      setIsLoading(false)
    }
  }, [pageSize])

  useEffect(() => {
    void fetchSuppliers()
  }, [fetchSuppliers])

  return {
    suppliers,
    setSuppliers,
    isLoading,
    error,
    refetch: fetchSuppliers,
  }
}
