import { NextResponse } from "next/server"

import { getAuthorizedApiUser } from "@/lib/auth/api-guards"
import { getProductDetail } from "@/lib/dal/products-catalog-dal"

export async function GET(_: Request, context: { params: Promise<{ productId: string }> }) {
  const authorization = await getAuthorizedApiUser(["ACTIVE", "ADMIN"])

  if ("error" in authorization) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: authorization.error === "UNAUTHENTICATED" ? 401 : 403 },
    )
  }

  const { productId } = await context.params
  const product = await getProductDetail(productId)

  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 })
  }

  return NextResponse.json({ product })
}
