import { prisma } from "@/lib/prisma"

import {
  buildPersistSummary,
  persistNormalizedSupplierGroup,
} from "@/lib/dal/price-list-import-dal"

import type {
  PersistNormalizedImportInput,
  PersistNormalizedImportResult,
} from "./types"

function groupProductsBySupplier(input: PersistNormalizedImportInput) {
  const groups = new Map<string, PersistNormalizedImportInput["normalizedProducts"]>()

  for (const product of input.normalizedProducts) {
    const supplierName = product.supplierName?.trim()
    if (!supplierName) {
      continue
    }

    const currentGroup = groups.get(supplierName) ?? []
    currentGroup.push(product)
    groups.set(supplierName, currentGroup)
  }

  return groups
}

export async function persistNormalizedImport(
  input: PersistNormalizedImportInput,
): Promise<PersistNormalizedImportResult> {
  const groupedProducts = groupProductsBySupplier(input)
  const supplierResults: PersistNormalizedImportResult["suppliers"] = []

  for (const [supplierName, products] of groupedProducts.entries()) {
    const result = await persistNormalizedSupplierGroup({
      prisma,
      supplierName,
      products,
      context: input.supplierContexts?.[supplierName],
    })

    supplierResults.push(result)
  }

  return buildPersistSummary(supplierResults)
}
