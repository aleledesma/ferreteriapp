import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "week"

    const now = new Date()
    let fromDate = new Date()

    if (range === "day") {
      fromDate.setHours(0, 0, 0, 0)
    } else if (range === "week") {
      fromDate.setDate(now.getDate() - 7)
    } else if (range === "month") {
      fromDate.setDate(now.getDate() - 30)
    }

    // 1. Recaudación y cantidad de tickets
    const salesAggregation = await prisma.sale.aggregate({
      where: {
        createdAt: { gte: fromDate, lte: now },
      },
      _sum: { total: true },
      _count: { id: true },
    })

    const totalRevenue = Number(salesAggregation._sum.total) || 0
    const salesCount = salesAggregation._count.id || 0

    // 2. Lista de productos con Stock Crítico (<= 5)
    const lowStockProductsList = await prisma.product.findMany({
      where: {
        stock: { lte: 5 },
        isForSale: true,
      },
      select: {
        id: true,
        name: true,
        stock: true,
      },
      orderBy: { stock: "asc" },
    })

    // 3. Ranking de los 5 Artículos Estrella
    const topSalesItems = await prisma.saleItem.groupBy({
      by: ["productId"],
      where: {
        createdAt: { gte: fromDate, lte: now },
      },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    })

    const topProducts = await Promise.all(
      topSalesItems.map(async (item) => {
        const productInfo = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true },
        })
        return {
          name: productInfo?.name || "Producto Eliminado",
          quantity: item._sum.quantity || 0,
          totalSales: Number(item._sum.subtotal) || 0,
        }
      })
    )

    return NextResponse.json({
      summary: {
        totalRevenue,
        salesCount,
        lowStockCount: lowStockProductsList.length,
      },
      topProducts,
      lowStockProducts: lowStockProductsList,
    })

  } catch (error) {
    console.error("Error en el reporte:", error)
    return NextResponse.json(
      { error: "Error al procesar estadísticas" },
      { status: 500 }
    )
  }
}