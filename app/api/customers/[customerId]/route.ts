import { NextResponse } from "next/server"
import { getAuthorizedApiUser } from "@/lib/auth/api-guards"
import { deleteCustomer, updateCustomer } from "@/lib/dal/customers-dal"
import { parseCustomerMutationInput } from "@/lib/customers/validation"

type RouteContext = {
  params: Promise<{
    customerId: string
  }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const authorization = await getAuthorizedApiUser(["ACTIVE", "ADMIN"])

  if ("error" in authorization) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: authorization.error === "UNAUTHENTICATED" ? 401 : 403 },
    )
  }

  try {
    const { customerId } = await context.params
    const payload = await request.json()
    const input = parseCustomerMutationInput(payload)
    const customer = await updateCustomer(customerId, input)

    return NextResponse.json({ customer })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo actualizar el cliente." },
      { status: 400 },
    )
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authorization = await getAuthorizedApiUser(["ACTIVE", "ADMIN"])

  if ("error" in authorization) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: authorization.error === "UNAUTHENTICATED" ? 401 : 403 },
    )
  }

  try {
    const { customerId } = await context.params
    const result = await deleteCustomer(customerId)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo eliminar el cliente." },
      { status: 400 },
    )
  }
}