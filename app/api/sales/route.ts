
import { NextResponse } from "next/server"
import { getAuthorizedApiUser } from "@/lib/auth/api-guards"
import { prisma } from "@/lib/prisma"
import { Prisma, StockMovementType } from "@prisma/client"

export async function POST(request: Request) {
  // 1. Verificamos que el cajero tenga permisos
  const authorization = await getAuthorizedApiUser(["ACTIVE", "ADMIN"])

  if ("error" in authorization) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: authorization.error === "UNAUTHENTICATED" ? 401 : 403 }
    )
  }

  try {
    const body = await request.json()
    const { customerId, items, totalAmount } = body

    // Validación para no cobrar un ticket vacío
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 })
    }

    const userId = authorization.user.id

    // INICIAMOS LA TRANSACCIÓN (Se hace TODO o no se hace NADA)
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Creamos el Ticket general (Sale)
      const sale = await tx.sale.create({
        data: {
          customerId: customerId || null,
          createdByUserId: userId,
          subtotal: totalAmount,
          total: totalAmount,
          status: "COMPLETED",
        }
      })

      // B. Recorremos cada producto del carrito
      for (const item of items) {
        const itemSubtotal = item.quantity * item.unitPrice

        // Buscamos el producto en la DB para ver cuánto stock real tiene
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        })

        if (!product) {
          throw new Error(`Producto no encontrado (ID: ${item.productId})`)
        }

        // Verificación de seguridad extra por si dos cajeros venden al mismo tiempo
        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.name}. Quedan ${product.stock}.`)
        }

        const nextStock = product.stock - item.quantity

        // B1. Guardamos el renglón del ticket (SaleItem)
        const saleItem = await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: itemSubtotal
          }
        })

        // B2. DESCONTAMOS EL STOCK DE LA GÓNDOLA (Product)
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: nextStock }
        })

        // B3. Dejamos el registro contable del movimiento (StockMovement)
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            saleItemId: saleItem.id,
            createdByUserId: userId,
            type: StockMovementType.SALE,
            quantityDelta: -item.quantity, // RESTAMOS stock
            previousStock: product.stock,
            nextStock: nextStock,
            notes: `Venta en mostrador`
          }
        })
      }

      return sale
    })

    // Si todo salió bien, devolvemos éxito
    return NextResponse.json({ success: true, saleId: result.id }, { status: 201 })

  } catch (error) {
    console.error("Error al procesar la venta:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno del servidor al procesar la venta." },
      { status: 500 }
    )
  }
}

// GET: LISTAR E HISTORIAL DE VENTAS (EL FILTRADO)
export async function GET(request: Request) {
  const authorization = await getAuthorizedApiUser(["ACTIVE", "ADMIN"])

  if ("error" in authorization) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: authorization.error === "UNAUTHENTICATED" ? 401 : 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const search = searchParams.get("search") || ""
  const startDate = searchParams.get("startDate") 
  const endDate = searchParams.get("endDate")    
  
  const limit = 10
  const skip = (page - 1) * limit

  const whereClause: Prisma.SaleWhereInput = { AND: [] }

  if (search) {
    whereClause.AND.push({
      OR: [
        { id: { contains: search, mode: 'insensitive' } },
        { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      ]
    })
  }

  // Filtro de fechas (Calendario)
  if (startDate && endDate) {
    whereClause.AND.push({
      createdAt: {
        gte: new Date(startDate), // (Desde)
        lte: new Date(endDate),   // (Hasta)
      }
    })
  }

  const [sales, totalCount] = await Promise.all([
    prisma.sale.findMany({
      where: whereClause,
      take: limit,
      skip: skip,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        _count: { select: { items: true } }
      }
    }),
    prisma.sale.count({ where: whereClause })
  ])

  return NextResponse.json({ items: sales, total: totalCount, pages: Math.ceil(totalCount / limit) })
}
