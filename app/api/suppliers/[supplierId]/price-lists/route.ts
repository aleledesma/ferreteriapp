import { NextResponse } from "next/server"

import { getAuthorizedApiUser } from "@/lib/auth/api-guards"
import {
  createManualSupplierPriceList,
  listSupplierPriceLists,
} from "@/lib/dal/supplier-price-lists-dal"
import {
  ManualProductError,
  parseManualSupplierPriceListInput,
} from "@/lib/products/manual-product-validation"

type RouteContext = {
  params: Promise<{
    supplierId: string
  }>
}

function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof ManualProductError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }

  return NextResponse.json(
    { error: error instanceof Error ? error.message : fallbackMessage },
    { status: 400 },
  )
}

export async function GET(_request: Request, context: RouteContext) {
  const authorization = await getAuthorizedApiUser(["ACTIVE", "ADMIN"])

  if ("error" in authorization) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: authorization.error === "UNAUTHENTICATED" ? 401 : 403 },
    )
  }

  try {
    const { supplierId } = await context.params
    const result = await listSupplierPriceLists(supplierId)

    return NextResponse.json(result)
  } catch (error) {
    return toErrorResponse(error, "No se pudieron listar las listas de precios.")
  }
}

export async function POST(request: Request, context: RouteContext) {
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
    const input = parseManualSupplierPriceListInput(payload)
    const priceList = await createManualSupplierPriceList(
      supplierId,
      input,
      authorization.user.id,
    )

    return NextResponse.json({ priceList }, { status: 201 })
  } catch (error) {
    return toErrorResponse(error, "No se pudo crear la lista de precios.")
  }
}
