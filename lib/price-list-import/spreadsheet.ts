import * as XLSX from "xlsx"

import type { RawSpreadsheetRow, SupplierUploadBatch } from "./types"

const SUPPORTED_EXTENSIONS = new Set([".xlsx", ".xls", ".csv"])

function getExtension(fileName: string) {
  const lastDot = fileName.lastIndexOf(".")
  return lastDot >= 0 ? fileName.slice(lastDot).toLowerCase() : ""
}

function normalizeCellValue(value: unknown) {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value
  }

  return String(value)
}

function hasData(row: unknown[]) {
  return row.some((value) => normalizeCellValue(value) !== null)
}

function scoreHeaderRow(row: unknown[]) {
  const values = row.map(normalizeCellValue).filter((value) => value !== null)
  if (values.length < 2) {
    return -1
  }

  const stringValues = values.filter((value) => typeof value === "string") as string[]
  const alphaStrings = stringValues.filter((value) => /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(value))

  return values.length + alphaStrings.length * 2
}

function findHeaderRowIndex(rows: unknown[][]) {
  const searchWindow = rows.slice(0, Math.min(rows.length, 40))
  let bestIndex = 0
  let bestScore = -1

  searchWindow.forEach((row, index) => {
    const score = scoreHeaderRow(row)
    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  })

  return bestIndex
}

function buildHeaders(row: unknown[]) {
  const used = new Map<string, number>()

  return row.map((value, index) => {
    const base = (() => {
      const normalized = normalizeCellValue(value)
      if (typeof normalized === "string") {
        return normalized
      }

      return `column_${index + 1}`
    })()

    const currentCount = used.get(base) ?? 0
    used.set(base, currentCount + 1)

    if (currentCount === 0) {
      return base
    }

    return `${base}_${currentCount + 1}`
  })
}

function rowsToObjects(headers: string[], rows: unknown[][]): RawSpreadsheetRow[] {
  return rows
    .filter(hasData)
    .map((row) => {
      const entry: RawSpreadsheetRow = {}

      headers.forEach((header, index) => {
        entry[header] = normalizeCellValue(row[index])
      })

      return entry
    })
}

async function parseSpreadsheetFile(file: File) {
  const extension = getExtension(file.name)
  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    throw new Error(`Formato no soportado para ${file.name}`)
  }

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, {
    type: "array",
    raw: true,
    cellDates: false,
  })

  const firstSheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[firstSheetName]

  if (!worksheet) {
    throw new Error(`No se encontró una hoja legible en ${file.name}`)
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: null,
    raw: true,
    blankrows: false,
  })

  if (!matrix.length) {
    return []
  }

  const headerRowIndex = findHeaderRowIndex(matrix)
  const headers = buildHeaders(matrix[headerRowIndex] ?? [])
  const dataRows = matrix.slice(headerRowIndex + 1)

  return rowsToObjects(headers, dataRows)
}

type BuildSupplierUploadBatchesInput = {
  formData: FormData
  uploadedByUserId: string
}

function parseNonNegativeNumber(value: FormDataEntryValue | null, fallback: number) {
  if (typeof value !== "string") {
    return fallback
  }

  const parsed = Number(value.trim())
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback
  }

  return parsed
}

function parseBoolean(value: FormDataEntryValue | null, fallback: boolean) {
  if (typeof value !== "string") {
    return fallback
  }

  if (value === "true") return true
  if (value === "false") return false

  return fallback
}

export async function buildSupplierUploadBatches({
  formData,
  uploadedByUserId,
}: BuildSupplierUploadBatchesInput): Promise<SupplierUploadBatch[]> {
  const files = formData.getAll("files")
  const supplierNames = formData.getAll("supplierNames")
  const saleMarginPercentages = formData.getAll("saleMarginPercentages")
  const keepExistingSalePrices = formData.getAll("keepExistingSalePrices")

  if (!files.length) {
    throw new Error("Debes enviar al menos un archivo.")
  }

  if (files.length !== supplierNames.length) {
    throw new Error("Cada archivo debe tener un nombre de proveedor asociado.")
  }

  if (saleMarginPercentages.length > 0 && saleMarginPercentages.length !== files.length) {
    throw new Error("Cada archivo debe tener un margen de ganancia asociado.")
  }

  if (keepExistingSalePrices.length > 0 && keepExistingSalePrices.length !== files.length) {
    throw new Error("Cada archivo debe indicar cómo tratar el precio de venta existente.")
  }

  const batches: SupplierUploadBatch[] = []

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    const supplierName = supplierNames[index]

    if (!(file instanceof File)) {
      throw new Error("Uno de los archivos enviados es inválido.")
    }

    if (typeof supplierName !== "string" || supplierName.trim().length === 0) {
      throw new Error(`Falta el nombre del proveedor para ${file.name}.`)
    }

    const normalizedSupplierName = supplierName.trim()
    const saleMarginPercentage = parseNonNegativeNumber(saleMarginPercentages[index] ?? null, 0)
    const keepExistingSalePrice = parseBoolean(keepExistingSalePrices[index] ?? null, true)

    const rows = await parseSpreadsheetFile(file)
    if (!rows.length) {
      throw new Error(`No se detectaron filas útiles en ${file.name}.`)
    }

    batches.push({
      supplierName: normalizedSupplierName,
      sourceFileName: file.name,
      uploadedByUserId,
      pricing: {
        saleMarginPercentage,
        keepExistingSalePrice,
      },
      rows,
    })
  }

  return batches
}
