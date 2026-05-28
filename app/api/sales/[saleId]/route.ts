import { NextResponse } from "next/server"
import { getAuthorizedApiUser } from "@/lib/auth/api-guards"
import { prisma } from "@/lib/prisma"

// GET: BUSCAR EL DETALLE DE UNA VENTA ESPECÍFICA
export async function GET(
  request: Request,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const authorization = await getAuthorizedApiUser(["ACTIVE", "ADMIN"])

  if ("error" in authorization) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: authorization.error === "UNAUTHENTICATED" ? 401 : 403 },
    )
  }

  try {
    const { saleId } = await params

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        items: {
          include: {
            product: { select: { name: true } }
          }
        }
      }
    })

    if (!sale) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    return NextResponse.json(sale)
  } catch {
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 })
  }
}
