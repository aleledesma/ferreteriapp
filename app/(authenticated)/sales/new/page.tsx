import { NewSaleClient } from "@/components/sales/new-sale-client"
import { requireRole } from "@/lib/auth/guards"

export default async function NewSalePage() {
  await requireRole(["ACTIVE", "ADMIN"])

  return (
    <main className="min-h-full bg-muted/25 p-4 md:p-6 xl:p-8">
      <div className="mx-auto w-full max-w-[1400px]">
        <NewSaleClient />
      </div>
    </main>
  )
}
