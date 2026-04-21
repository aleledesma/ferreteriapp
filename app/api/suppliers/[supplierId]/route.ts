import { NextResponse } from "next/server"

import { getAuthorizedApiUser } from "@/lib/auth/api-guards"
import { deleteSupplier, updateSupplier } from "@/lib/dal/suppliers-dal"
import { parseSupplierMutationInput } from "@/lib/suppliers/validation"

type RouteContext = {
  params: Promise<{
    supplierId: string
  }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const authorization = await getAuthorizedApiUser(["ACTIVE", "ADMIN"])

  if ("error" in authorization) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: authorization.error === "UNAUTHENTICATED" ? 401 : 403 },
    )
  }

  try {
    const { supplierId } = await context.params
    const payload = await request.json()
    const input = parseSupplierMutationInput(payload)
    const supplier = await updateSupplier(supplierId, input)

    return NextResponse.json({ supplier })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo actualizar el proveedor." },
      { status: 400 },
    )
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authorization = await getAuthorizedApiUser(["ACTIVE", "ADMIN"])

  if ("error" in authorization) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: authorization.error === "UNAUTHENTICATED" ? 401 : 403 },
    )
  }

  try {
    const { supplierId } = await context.params
    const result = await deleteSupplier(supplierId)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo eliminar el proveedor." },
      { status: 400 },
    )
  }
}
