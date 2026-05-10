import { NextResponse } from "next/server"
import { getAuthorizedApiUser } from "@/lib/auth/api-guards"
import { createCustomer, listCustomers } from "@/lib/dal/customers-dal"
import { parseCustomerFilters, parseCustomerMutationInput } from "@/lib/customers/validation"

export async function GET(request: Request) {
  const authorization = await getAuthorizedApiUser(["ACTIVE", "ADMIN"])

  if ("error" in authorization) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: authorization.error === "UNAUTHENTICATED" ? 401 : 403 },
    )
  }

  const filters = parseCustomerFilters(new URL(request.url).searchParams)
  const result = await listCustomers(filters)

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const authorization = await getAuthorizedApiUser(["ACTIVE", "ADMIN"])

  if ("error" in authorization) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: authorization.error === "UNAUTHENTICATED" ? 401 : 403 },
    )
  }

  try {
    const payload = await request.json()
    const input = parseCustomerMutationInput(payload)
    const customer = await createCustomer(input)

    return NextResponse.json({ customer }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear el cliente." },
      { status: 400 },
    )
  }
}