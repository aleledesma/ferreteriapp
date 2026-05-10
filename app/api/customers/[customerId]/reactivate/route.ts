import { NextResponse } from "next/server"
import { getAuthorizedApiUser } from "@/lib/auth/api-guards"
import { reactivateCustomer } from "@/lib/dal/customers-dal"

type RouteContext = {
  params: Promise<{
    customerId: string
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
    const { customerId } = await context.params
    const customer = await reactivateCustomer(customerId)

    return NextResponse.json({ customer })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo reactivar el cliente." },
      { status: 400 },
    )
  }
}