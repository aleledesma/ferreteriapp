import { NextResponse } from "next/server"

import { getAuthorizedApiUser } from "@/lib/auth/api-guards"
import { restoreProducts } from "@/lib/dal/products-catalog-dal"
import { parseRestoreProductsRequest } from "@/lib/products/catalog-validation"

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
    const input = parseRestoreProductsRequest(payload)
    const result = await restoreProducts(input.productIds)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudieron restaurar los productos." },
      { status: 400 },
    )
  }
}
