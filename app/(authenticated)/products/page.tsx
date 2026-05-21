import { ProductsPageClient } from "@/components/products/products-page-client"
import { getProductCatalogKpis, listProductCatalog, listProductCatalogSuppliers } from "@/lib/dal/products-catalog-dal"
import { requireRole } from "@/lib/auth/guards"
import { parseProductCatalogFilters } from "@/lib/products/catalog-validation"

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function toUrlSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      params.set(key, value)
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item)
      }
    }
  }

  return params
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  await requireRole(["ACTIVE", "ADMIN"])

  const params = toUrlSearchParams(await searchParams)
  const filters = parseProductCatalogFilters(params)

  const [initialCatalog, initialKpis, supplierOptions] = await Promise.all([
    listProductCatalog(filters),
    getProductCatalogKpis(),
    listProductCatalogSuppliers(),
  ])

  return (
    <main className="min-h-full bg-[radial-gradient(circle_at_top,_var(--color-primary)/12,_transparent_34%),radial-gradient(circle_at_88%_12%,_color-mix(in_oklab,var(--color-primary)_14%,transparent),_transparent_22%),linear-gradient(180deg,var(--color-background),color-mix(in_oklab,var(--color-muted)_42%,transparent))] p-4 md:p-8">
      <div className="mx-auto w-full max-w-7xl">
        <ProductsPageClient initialCatalog={initialCatalog} initialKpis={initialKpis} supplierOptions={supplierOptions} />
      </div>
    </main>
  )
}
