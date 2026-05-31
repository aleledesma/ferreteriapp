import { NextResponse } from "next/server"

import { normalizeN8nResponse } from "@/lib/price-list-import/normalization-response"
import { persistNormalizedImport } from "@/lib/price-list-import/persist-normalized-import"
import {
  resolveImportJob,
  resolveImportJobById,
} from "@/lib/dal/import-jobs-dal"

function isAuthorizedCallback(request: Request) {
  const expectedToken = process.env.N8N_CALLBACK_TOKEN
  const receivedToken = request.headers.get("x-callback-token")

  return Boolean(expectedToken && receivedToken && receivedToken === expectedToken)
}

async function resolveJob(
  jobId:   string | null,
  traceId: string | null,
  result:
    | { ok: true;  productsCreated: number; productsUpdated: number }
    | { ok: false; errorMessage: string },
): Promise<void> {
  // Prioridad: jobId en URL > traceId del payload de n8n
  if (jobId) {
    await resolveImportJobById(jobId, result).catch(() => {/* non-critical */})
  } else if (traceId) {
    await resolveImportJob(traceId, result).catch(() => {/* non-critical */})
  }
}

export async function POST(request: Request) {
  if (!isAuthorizedCallback(request)) {
    return NextResponse.json({ error: "Callback no autorizado." }, { status: 401 })
  }

  // jobId viene en ?jobId=xxx, puesto por el ingest route en la callback URL
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get("jobId")

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

      await resolveJob(jobId, traceId, { ok: false, errorMessage })

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

    await resolveJob(jobId, traceId, {
      ok:              true,
      productsCreated: result.totalProductsCreated,
      productsUpdated: result.totalProductsUpdated,
    })

    return NextResponse.json({ ok: true, traceId, result }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "No se pudo procesar la normalización."

    // Si tenemos jobId, marcar el job como fallido también en caso de excepción
    await resolveJob(jobId, null, { ok: false, errorMessage: message })

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
