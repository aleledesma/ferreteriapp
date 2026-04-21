import { NextResponse } from "next/server"

import { getAuthorizedApiUser } from "@/lib/auth/api-guards"
import { reactivateSupplier } from "@/lib/dal/suppliers-dal"

type RouteContext = {
  params: Promise<{
    supplierId: string
  }>
}

export async function POST(_request: Request, context: RouteContext) {
  const authorization = await getAuthorizedApiUser(["ACTIVE", "ADMIN"])

  if ("error" in authorization) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: authorization.error === "UNAUTHENTICATED" ? 401 : 403 },
    )
  }

  try {
    const { supplierId } = await context.params
    const supplier = await reactivateSupplier(supplierId)

    return NextResponse.json({ supplier })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo reactivar el proveedor." },
      { status: 400 },
    )
  }
}
