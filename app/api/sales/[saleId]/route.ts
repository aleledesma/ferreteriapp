import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET: BUSCAR EL DETALLE DE UNA VENTA ESPECÍFICA
export async function GET(
  request: Request,
  { params }: { params: Promise<{ saleId: string }> }
) {
  try {
    const { saleId } = await params

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        customer: true,
        items: {
          include: {
            product: { select: { name: true } }
          }
        }
      }
    })

    if (!sale) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    return NextResponse.json(sale)
  } catch (error) {
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 })
  }
}
