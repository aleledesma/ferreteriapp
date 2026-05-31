import { NextResponse } from "next/server"

import { normalizeN8nResponse } from "@/lib/price-list-import/normalization-response"
import { persistNormalizedImport } from "@/lib/price-list-import/persist-normalized-import"
import { resolveImportJob } from "@/lib/dal/import-jobs-dal"

function isAuthorizedCallback(request: Request) {
  const expectedToken = process.env.N8N_CALLBACK_TOKEN
  const receivedToken = request.headers.get("x-callback-token")

  return Boolean(expectedToken && receivedToken && receivedToken === expectedToken)
}

export async function POST(request: Request) {
  if (!isAuthorizedCallback(request)) {
    return NextResponse.json({ error: "Callback no autorizado." }, { status: 401 })
  }

  try {
    const body               = await request.json()
    const normalizedResponse = normalizeN8nResponse(body)

    if (!normalizedResponse) {
      return NextResponse.json({ error: "Payload inválido." }, { status: 400 })
    }

    const traceId = normalizedResponse.traceId ?? null

    if (!normalizedResponse.ok) {
      const errorMessage =
        normalizedResponse.error || "n8n informó un error durante la normalización."

      if (traceId) {
        await resolveImportJob(traceId, { ok: false, errorMessage }).catch(() => {/* non-critical */})
      }

      return NextResponse.json(
        { ok: false, stage: normalizedResponse.stage, traceId, error: errorMessage },
        { status: 202 },
      )
    }

    const result = await persistNormalizedImport({
      normalizedProducts: normalizedResponse.normalizedProducts,
      providerResults:    normalizedResponse.providerResults,
      supplierContexts:   normalizedResponse.supplierContexts,
    })

    if (traceId) {
      await resolveImportJob(traceId, {
        ok:              true,
        productsCreated: result.totalProductsCreated,
        productsUpdated: result.totalProductsUpdated,
      }).catch(() => {/* non-critical */})
    }

    return NextResponse.json({ ok: true, traceId, result }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "No se pudo procesar la normalización."

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
