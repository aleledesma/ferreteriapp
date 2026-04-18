import { ProductImportForm } from "@/components/products/product-import-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireRole } from "@/lib/auth/guards"

export default async function NewProductsPage() {
  await requireRole(["ACTIVE", "ADMIN"])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-primary)/10,_transparent_35%),linear-gradient(180deg,var(--color-background),color-mix(in_oklab,var(--color-muted)_45%,transparent))] p-4 md:p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Card className="border-primary/10 bg-background/85 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/75 animate-in fade-in-0 slide-in-from-top-2 duration-500">
          <CardHeader>
            <CardTitle className="text-3xl">Nuevos productos</CardTitle>
            <CardDescription>
              Centraliza la incorporación de listas de precios nuevas y prepara la información para crear o actualizar productos del catálogo.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            En esta primera etapa podrás subir listas completas de proveedores. Cada archivo debe quedar asociado a un proveedor antes de iniciar el proceso.
          </CardContent>
        </Card>

        <ProductImportForm />
      </div>
    </main>
  )
}
