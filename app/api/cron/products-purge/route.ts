import type { NextRequest } from "next/server"

import { purgeExpiredDeletedProducts } from "@/lib/dal/products-catalog-dal"

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", {
      status: 401,
    })
  }

  const result = await purgeExpiredDeletedProducts()
  return Response.json(result)
}
