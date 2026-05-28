import type { CustomerFilters, CustomerMutationInput } from "./types"

export const CUSTOMER_PAGE_SIZE_OPTIONS = [10, 20, 50] as const
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

export function parseCustomerFilters(searchParams: URLSearchParams): CustomerFilters {
  const page = parsePositiveInt(searchParams.get("page"), 1)
  const requestedPageSize = parsePositiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE)
  const pageSize = CUSTOMER_PAGE_SIZE_OPTIONS.includes(
    requestedPageSize as (typeof CUSTOMER_PAGE_SIZE_OPTIONS)[number],
  )
    ? requestedPageSize
    : DEFAULT_PAGE_SIZE

  return {
    search: normalizeNullableText(searchParams.get("search") || undefined) ?? undefined,
    activeOnly: searchParams.get("activeOnly") === "true",
    page,
    pageSize,
  }
}

export function parseCustomerMutationInput(payload: unknown): CustomerMutationInput {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload inválido.")
}

  const record = payload as Record<string, unknown>
  
  const firstName = normalizeNullableText(record.firstName)
  if (!firstName) {
    throw new Error("El nombre del cliente es obligatorio.")
  }

  const lastName = normalizeNullableText(record.lastName)
  if (!lastName) {
    throw new Error("El apellido del cliente es obligatorio.")
  }

  const email = normalizeNullableText(record.email)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("El correo del cliente no es válido.")
 }

  return {
    firstName,
    lastName,
    email,
    phone: normalizeNullableText(record.phone),
    address: normalizeNullableText(record.address),
    notes: normalizeNullableText(record.notes),
  }
}
