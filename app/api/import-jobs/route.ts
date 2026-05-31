import { NextResponse } from "next/server"
import { getAuthorizedApiUser } from "@/lib/auth/api-guards"
import { listImportJobs } from "@/lib/dal/import-jobs-dal"

export async function GET(request: Request) {
  const authorization = await getAuthorizedApiUser(["ACTIVE", "ADMIN"])

  if ("error" in authorization) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: authorization.error === "UNAUTHENTICATED" ? 401 : 403 },
    )
  }

  const { searchParams } = new URL(request.url)
  const page     = Math.max(1, Number(searchParams.get("page")     ?? 1))
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? 5)))

  const result = await listImportJobs({ page, pageSize })

  return NextResponse.json(result)
}
