import { NextResponse } from "next/server"

import { getAuthorizedApiUser } from "@/lib/auth/api-guards"
import { listProductCatalog } from "@/lib/dal/products-catalog-dal"
import { parseProductCatalogFilters } from "@/lib/products/catalog-validation"

export async function GET(request: Request) {
  const authorization = await getAuthorizedApiUser(["ACTIVE", "ADMIN"])

  if ("error" in authorization) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: authorization.error === "UNAUTHENTICATED" ? 401 : 403 },
    )
  }

  const filters = parseProductCatalogFilters(new URL(request.url).searchParams)
  const result = await listProductCatalog(filters)

  return NextResponse.json(result)
}
