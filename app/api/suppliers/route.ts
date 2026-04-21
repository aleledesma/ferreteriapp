import { NextResponse } from "next/server"

import { getAuthorizedApiUser } from "@/lib/auth/api-guards"
import { createSupplier, listSuppliers } from "@/lib/dal/suppliers-dal"
import { parseSupplierFilters, parseSupplierMutationInput } from "@/lib/suppliers/validation"

export async function GET(request: Request) {
  const authorization = await getAuthorizedApiUser(["ACTIVE", "ADMIN"])

  if ("error" in authorization) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: authorization.error === "UNAUTHENTICATED" ? 401 : 403 },
    )
  }

  const filters = parseSupplierFilters(new URL(request.url).searchParams)
  const result = await listSuppliers(filters)

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
    const input = parseSupplierMutationInput(payload)
    const supplier = await createSupplier(input)

    return NextResponse.json({ supplier }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear el proveedor." },
      { status: 400 },
    )
  }
}
