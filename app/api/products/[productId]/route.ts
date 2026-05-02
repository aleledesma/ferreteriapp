import { NextResponse } from "next/server"

import { getAuthorizedApiUser } from "@/lib/auth/api-guards"
import { getProductDetail, updateProduct } from "@/lib/dal/products-catalog-dal"
import { parseUpdateProductRequest } from "@/lib/products/catalog-validation"

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

export async function PATCH(request: Request, context: { params: Promise<{ productId: string }> }) {
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
    const input = parseUpdateProductRequest(payload)
    const product = await updateProduct(productId, input)

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo actualizar el producto." },
      { status: 400 },
    )
  }
}
