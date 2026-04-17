import { NextResponse } from "next/server"

import { normalizeN8nResponse } from "@/lib/price-list-import/normalization-response"
import { persistNormalizedImport } from "@/lib/price-list-import/persist-normalized-import"

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
    const body = await request.json()
    const normalizedResponse = normalizeN8nResponse(body)

    if (!normalizedResponse) {
      return NextResponse.json({ error: "Payload inválido." }, { status: 400 })
    }

    if (!normalizedResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          stage: normalizedResponse.stage,
          traceId: normalizedResponse.traceId ?? null,
          error:
            normalizedResponse.error ||
            "n8n informó un error durante la normalización.",
        },
        { status: 202 },
      )
    }

    const result = await persistNormalizedImport({
      normalizedProducts: normalizedResponse.normalizedProducts,
      providerResults: normalizedResponse.providerResults,
      supplierContexts: normalizedResponse.supplierContexts,
    })

    return NextResponse.json(
      {
        ok: true,
        traceId: normalizedResponse.traceId ?? null,
        result,
      },
      { status: 200 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo procesar la normalización." 

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
