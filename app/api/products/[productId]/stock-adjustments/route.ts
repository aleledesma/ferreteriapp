import { NextResponse } from "next/server"

import { getAuthorizedApiUser } from "@/lib/auth/api-guards"
import { createManualStockAdjustment } from "@/lib/dal/products-catalog-dal"
import { parseStockAdjustmentRequest } from "@/lib/products/catalog-validation"

export async function POST(request: Request, context: { params: Promise<{ productId: string }> }) {
  const authorization = await getAuthorizedApiUser(["ACTIVE", "ADMIN"])

  if ("error" in authorization) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: authorization.error === "UNAUTHENTICATED" ? 401 : 403 },
    )
  }

  try {
    const { productId } = await context.params
    const payload = await request.json()
    const input = parseStockAdjustmentRequest(payload)
    const result = await createManualStockAdjustment(productId, input, authorization.user.id)

    if (!result) {
      return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo ajustar el stock." },
      { status: 400 },
    )
  }
}
