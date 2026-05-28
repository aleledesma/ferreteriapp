
import { NextResponse } from "next/server"
import { getAuthorizedApiUser } from "@/lib/auth/api-guards"
import { prisma } from "@/lib/prisma"
import { Prisma, StockMovementType } from "@prisma/client"

class SaleInputError extends Error {}

type SaleItemInput = {
  productId: string
  quantity: number
}

type CreateSaleInput = {
  customerId: string | null
  items: SaleItemInput[]
}

function parseCreateSaleInput(payload: unknown): CreateSaleInput {
  if (!payload || typeof payload !== "object") {
    throw new SaleInputError("Payload inválido.")
  }

  const record = payload as Record<string, unknown>
  const customerId = typeof record.customerId === "string" && record.customerId.trim().length > 0
    ? record.customerId.trim()
    : null

  if (!Array.isArray(record.items) || record.items.length === 0) {
    throw new SaleInputError("El carrito está vacío.")
  }

  const seenProductIds = new Set<string>()
  const items = record.items.map((item) => {
    if (!item || typeof item !== "object") {
      throw new SaleInputError("El carrito contiene un producto inválido.")
    }

    const itemRecord = item as Record<string, unknown>
    const productId = typeof itemRecord.productId === "string" ? itemRecord.productId.trim() : ""
    const quantity = itemRecord.quantity

    if (!productId) {
      throw new SaleInputError("El carrito contiene un producto inválido.")
    }

    if (seenProductIds.has(productId)) {
      throw new SaleInputError("El carrito contiene productos duplicados.")
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new SaleInputError("La cantidad de cada producto debe ser un entero positivo.")
    }

    seenProductIds.add(productId)
    return { productId, quantity }
  })

  return { customerId, items }
}

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
    const input = parseCreateSaleInput(await request.json())
    const userId = authorization.user.id

    // INICIAMOS LA TRANSACCIÓN (Se hace TODO o no se hace NADA)
    const result = await prisma.$transaction(async (tx) => {
      if (input.customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: input.customerId },
          select: { isActive: true },
        })

        if (!customer || !customer.isActive) {
          throw new SaleInputError("El cliente seleccionado no está disponible.")
        }
      }

      const products = await tx.product.findMany({
        where: { id: { in: input.items.map((item) => item.productId) } },
        select: {
          id: true,
          name: true,
          salePrice: true,
          stock: true,
          isActive: true,
          isForSale: true,
        },
      })
      const productsById = new Map(products.map((product) => [product.id, product]))
      const saleItems = input.items.map((item) => {
        const product = productsById.get(item.productId)

        if (!product || !product.isActive || !product.isForSale) {
          throw new SaleInputError("Uno de los productos del carrito no está disponible para la venta.")
        }

        if (product.stock < item.quantity) {
          throw new SaleInputError(`Stock insuficiente para ${product.name}. Quedan ${product.stock}.`)
        }

        const unitPrice = Number(product.salePrice)
        const subtotal = unitPrice * item.quantity

        return { ...item, product, unitPrice, subtotal }
      })
      const totalAmount = saleItems.reduce((total, item) => total + item.subtotal, 0)
       
      // A. Creamos el Ticket general (Sale)
      const sale = await tx.sale.create({
        data: {
          customerId: input.customerId,
          createdByUserId: userId,
          subtotal: totalAmount,
          total: totalAmount,
          status: "COMPLETED",
        }
      })

      // B. Recorremos cada producto del carrito
      for (const item of saleItems) {
        const nextStock = item.product.stock - item.quantity

        // B1. Guardamos el renglón del ticket (SaleItem)
        const saleItem = await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal
          }
        })

        // B2. DESCONTAMOS EL STOCK DE LA GÓNDOLA (Product) de forma atómica.
        const stockUpdate = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } }
        })

        if (stockUpdate.count !== 1) {
          throw new SaleInputError(`Stock insuficiente para ${item.product.name}.`)
        }

        // B3. Dejamos el registro contable del movimiento (StockMovement)
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            saleItemId: saleItem.id,
            createdByUserId: userId,
            type: StockMovementType.SALE,
            quantityDelta: -item.quantity, // RESTAMOS stock
            previousStock: item.product.stock,
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
    if (error instanceof SaleInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: "Error interno del servidor al procesar la venta." },
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
