import { NextResponse } from "next/server"

import { getAuthorizedApiUser } from "@/lib/auth/api-guards"
import {
  buildN8nIngestPayload,
  sendPriceListPayloadToN8n,
} from "@/lib/price-list-import/n8n-client"
import { mapSupplierUploadBatchesToN8nPayload } from "@/lib/price-list-import/normalization-response"
import { buildSupplierUploadBatches } from "@/lib/price-list-import/spreadsheet"

export async function POST(request: Request) {
  const authorization = await getAuthorizedApiUser(["ACTIVE", "ADMIN"])

  if ("error" in authorization) {
    const status = authorization.error === "UNAUTHENTICATED" ? 401 : 403
    return NextResponse.json({ error: "No autorizado." }, { status })
  }

  try {
    const formData = await request.formData()
    const uploadBatches = await buildSupplierUploadBatches({
      formData,
      uploadedByUserId: authorization.user.id,
    })
    const payload = mapSupplierUploadBatchesToN8nPayload(uploadBatches)
    const callbackUrl = `${process.env.APP_CALLBACK_BASE_URL}/api/price-lists/normalized`

    const n8nResponse = await sendPriceListPayloadToN8n(
      buildN8nIngestPayload(payload),
      callbackUrl,
    )

    return NextResponse.json(
      {
        mode: "async",
        traceId:
          n8nResponse && typeof n8nResponse.traceId === "string"
            ? n8nResponse.traceId
            : null,
        message:
          n8nResponse && typeof n8nResponse.message === "string"
            ? n8nResponse.message
            : "Archivos enviados a n8n correctamente. Se espera callback de normalización.",
        suppliersSent: uploadBatches.length,
      },
      { status: 202 },
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo iniciar la importación."

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
