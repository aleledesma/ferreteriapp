import { NextResponse } from "next/server"

import { getAuthorizedApiUser } from "@/lib/auth/api-guards"
import {
  buildN8nIngestPayload,
  sendPriceListPayloadToN8n,
} from "@/lib/price-list-import/n8n-client"
import { mapSupplierUploadBatchesToN8nPayload } from "@/lib/price-list-import/normalization-response"
import { buildSupplierUploadBatches } from "@/lib/price-list-import/spreadsheet"
import {
  createImportJob,
  failImportJob,
  setImportJobTraceId,
} from "@/lib/dal/import-jobs-dal"

export async function POST(request: Request) {
  const authorization = await getAuthorizedApiUser(["ACTIVE", "ADMIN"])

  if ("error" in authorization) {
    const status = authorization.error === "UNAUTHENTICATED" ? 401 : 403
    return NextResponse.json({ error: "No autorizado." }, { status })
  }

  try {
    const formData      = await request.formData()
    const uploadBatches = await buildSupplierUploadBatches({
      formData,
      uploadedByUserId: authorization.user.id,
    })

    const supplierNames = [...new Set(uploadBatches.map((b) => b.supplierName))].join(", ")

    // Crear registro del job antes de enviar a n8n
    const job = await createImportJob({
      supplierNames,
      filesCount:      uploadBatches.length,
      createdByUserId: authorization.user.id,
    })

    const payload     = mapSupplierUploadBatchesToN8nPayload(uploadBatches)
    // Incluimos jobId en la URL para que el callback lo use directamente,
    // independientemente de si n8n echa o no el traceId.
    const callbackUrl = `${process.env.APP_CALLBACK_BASE_URL}/api/price-lists/normalized?jobId=${job.id}`

    let n8nResponse: Awaited<ReturnType<typeof sendPriceListPayloadToN8n>>

    try {
      n8nResponse = await sendPriceListPayloadToN8n(
        buildN8nIngestPayload(payload),
        callbackUrl,
      )
    } catch (n8nError) {
      // Si n8n falla inmediatamente, marcar el job como FAILED
      await failImportJob(
        job.id,
        n8nError instanceof Error ? n8nError.message : "No se pudo contactar con n8n.",
      ).catch(() => {/* non-critical */})

      throw n8nError
    }

    // Asociar el traceId de n8n al job
    const traceId = n8nResponse && typeof n8nResponse.traceId === "string"
      ? n8nResponse.traceId
      : null

    if (traceId) {
      await setImportJobTraceId(job.id, traceId).catch(() => {/* non-critical */})
    }

    return NextResponse.json(
      {
        mode:          "async",
        jobId:         job.id,
        traceId,
        message:
          n8nResponse && typeof n8nResponse.message === "string"
            ? n8nResponse.message
            : "Archivos enviados a n8n correctamente. Se espera callback de normalización.",
        suppliersSent: uploadBatches.length,
      },
      { status: 202 },
    )
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "No se pudo iniciar la importación."

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
