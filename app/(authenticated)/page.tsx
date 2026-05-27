import { DashboardPageClient } from "@/components/dashboard/dashboard-page-client"
import { requireRole } from "@/lib/auth/guards"
import { getDashboardData } from "@/lib/dal/dashboard-dal"

export default async function HomePage() {
  const user = await requireRole(["ACTIVE", "ADMIN"])
  const data = await getDashboardData()

  return <DashboardPageClient data={data} userName={user.name ?? user.email ?? "equipo"} />
}
