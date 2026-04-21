import type { SupplierFilters, SupplierMutationInput } from "./types"

export const SUPPLIER_PAGE_SIZE_OPTIONS = [10, 20, 50] as const
const DEFAULT_PAGE_SIZE = 10

function normalizeNullableText(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) {
    return fallback
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

export function parseSupplierFilters(searchParams: URLSearchParams): SupplierFilters {
  const page = parsePositiveInt(searchParams.get("page"), 1)
  const requestedPageSize = parsePositiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE)
  const pageSize = SUPPLIER_PAGE_SIZE_OPTIONS.includes(
    requestedPageSize as (typeof SUPPLIER_PAGE_SIZE_OPTIONS)[number],
  )
    ? requestedPageSize
    : DEFAULT_PAGE_SIZE

  return {
    search: normalizeNullableText(searchParams.get("search") || undefined) ?? undefined,
    page,
    pageSize,
  }
}

export function parseSupplierMutationInput(payload: unknown): SupplierMutationInput {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload inválido.")
  }

  const record = payload as Record<string, unknown>
  const name = normalizeNullableText(record.name)

  if (!name) {
    throw new Error("El nombre del proveedor es obligatorio.")
  }

  const email = normalizeNullableText(record.email)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("El correo del proveedor no es válido.")
  }

  return {
    name,
    email,
    phone: normalizeNullableText(record.phone),
    address: normalizeNullableText(record.address),
    notes: normalizeNullableText(record.notes),
  }
}
