import { ImportJobStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export type ImportJobDto = {
  id:              string
  traceId:         string | null
  status:          ImportJobStatus
  supplierNames:   string
  filesCount:      number
  productsCreated: number
  productsUpdated: number
  errorMessage:    string | null
  createdAt:       string
  completedAt:     string | null
  createdBy:       { name: string | null; email: string | null } | null
}

function toDto(job: {
  id:              string
  traceId:         string | null
  status:          ImportJobStatus
  supplierNames:   string
  filesCount:      number
  productsCreated: number
  productsUpdated: number
  errorMessage:    string | null
  createdAt:       Date
  completedAt:     Date | null
  createdBy:       { name: string | null; email: string | null } | null
}): ImportJobDto {
  return {
    ...job,
    createdAt:   job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
  }
}

const SELECT = {
  id:              true,
  traceId:         true,
  status:          true,
  supplierNames:   true,
  filesCount:      true,
  productsCreated: true,
  productsUpdated: true,
  errorMessage:    true,
  createdAt:       true,
  completedAt:     true,
  createdBy: {
    select: { name: true, email: true },
  },
} as const

// ── Crear un job al iniciar la carga ──────────────────────────────────────────

export async function createImportJob(input: {
  supplierNames:   string
  filesCount:      number
  createdByUserId: string
}): Promise<{ id: string }> {
  const job = await prisma.importJob.create({
    data: {
      supplierNames:   input.supplierNames,
      filesCount:      input.filesCount,
      createdByUserId: input.createdByUserId,
    },
    select: { id: true },
  })
  return job
}

// ── Asociar el traceId de n8n una vez que responde ───────────────────────────

export async function setImportJobTraceId(
  jobId:   string,
  traceId: string,
): Promise<void> {
  await prisma.importJob.update({
    where: { id: jobId },
    data:  { traceId },
  })
}

// ── Resolver el job cuando llega el callback de n8n ──────────────────────────

type ResolveResult =
  | { ok: true;  productsCreated: number; productsUpdated: number }
  | { ok: false; errorMessage: string }

function buildResolveData(result: ResolveResult) {
  return result.ok
    ? {
        status:          ImportJobStatus.COMPLETED,
        productsCreated: result.productsCreated,
        productsUpdated: result.productsUpdated,
        completedAt:     new Date(),
      }
    : {
        status:       ImportJobStatus.FAILED,
        errorMessage: result.errorMessage,
        completedAt:  new Date(),
      }
}

export async function resolveImportJobById(
  jobId:  string,
  result: ResolveResult,
): Promise<void> {
  await prisma.importJob.update({
    where: { id: jobId },
    data:  buildResolveData(result),
  })
}

export async function resolveImportJob(
  traceId: string,
  result:  ResolveResult,
): Promise<void> {
  await prisma.importJob.update({
    where: { traceId },
    data:  buildResolveData(result),
  })
}

// ── Marcar como FAILED cuando la propia llamada a n8n falla ─────────────────

export async function failImportJob(
  jobId:        string,
  errorMessage: string,
): Promise<void> {
  await prisma.importJob.update({
    where: { id: jobId },
    data: {
      status:       ImportJobStatus.FAILED,
      errorMessage,
      completedAt:  new Date(),
    },
  })
}

// ── Listar jobs paginados ─────────────────────────────────────────────────────

export async function listImportJobs(opts: {
  page:     number
  pageSize: number
}): Promise<{ items: ImportJobDto[]; total: number; pages: number }> {
  const { page, pageSize } = opts
  const skip = (page - 1) * pageSize

  const [rows, total] = await Promise.all([
    prisma.importJob.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: SELECT,
    }),
    prisma.importJob.count(),
  ])

  return {
    items: rows.map(toDto),
    total,
    pages: Math.max(1, Math.ceil(total / pageSize)),
  }
}
