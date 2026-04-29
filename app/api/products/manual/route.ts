import { NextResponse } from "next/server"

import { getAuthorizedApiUser } from "@/lib/auth/api-guards"
import { createManualProduct } from "@/lib/dal/manual-product-import-dal"
import {
  ManualProductConflictError,
  ManualProductError,
  parseManualProductInput,
} from "@/lib/products/manual-product-validation"

function toErrorResponse(error: unknown) {
  if (error instanceof ManualProductConflictError) {
    return NextResponse.json(
      {
        error: error.message,
        code: "MANUAL_PRODUCT_CONFLICT",
        conflicts: error.conflicts,
      },
      { status: error.status },
    )
  }

  if (error instanceof ManualProductError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }

  return NextResponse.json(
    {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo procesar la carga manual del producto.",
    },
    { status: 400 },
  )
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
    const input = parseManualProductInput(payload)
    const result = await createManualProduct(input, authorization.user.id)

    return NextResponse.json({ result }, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
