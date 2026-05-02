import { NextResponse } from "next/server"

import { getAuthorizedApiUser } from "@/lib/auth/api-guards"
import { getProductCatalogKpis } from "@/lib/dal/products-catalog-dal"

export async function GET() {
  const authorization = await getAuthorizedApiUser(["ACTIVE", "ADMIN"])

  if ("error" in authorization) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: authorization.error === "UNAUTHENTICATED" ? 401 : 403 },
    )
  }

  const kpis = await getProductCatalogKpis()
  return NextResponse.json(kpis)
}
