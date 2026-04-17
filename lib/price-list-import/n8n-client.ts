import type { N8nIngestPayload } from "./types"

type N8nEnvName =
  | "N8N_NORMALIZATION_WEBHOOK_URL"
  | "N8N_INGEST_TOKEN"
  | "N8N_CALLBACK_TOKEN"

function getEnv(name: N8nEnvName) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name} environment variable`)
  }

  return value
}

export function buildN8nIngestPayload(payload: N8nIngestPayload) {
  return payload.map((entry) => ({
    proveedor: entry.proveedor,
    metadata: entry.metadata,
    productos: entry.productos,
  }))
}

export async function sendPriceListPayloadToN8n(
  payload: N8nIngestPayload,
  callbackUrl: string,
) {
  const webhookUrl = getEnv("N8N_NORMALIZATION_WEBHOOK_URL")
  const ingestToken = getEnv("N8N_INGEST_TOKEN")
  const callbackToken = getEnv("N8N_CALLBACK_TOKEN")

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ingest-token": ingestToken,
      "x-callback-url": callbackUrl,
      "x-callback-token": callbackToken,
    },
    body: JSON.stringify(payload),
  })

  const responseText = await response.text()
  let responseJson: Record<string, unknown> | null = null

  if (responseText) {
    try {
      responseJson = JSON.parse(responseText) as Record<string, unknown>
    } catch {
      responseJson = null
    }
  }

  if (!response.ok) {
    throw new Error(
      (typeof responseJson?.error === "string" ? responseJson.error : null) ||
        responseText ||
        "n8n no pudo procesar la importación.",
    )
  }

  return responseJson
}
