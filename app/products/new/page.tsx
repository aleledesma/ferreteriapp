import { ProductsNewTabs } from "@/components/products/products-new-tabs"
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-primary)/14,_transparent_30%),radial-gradient(circle_at_85%_15%,_color-mix(in_oklab,var(--color-primary)_18%,transparent),_transparent_22%),linear-gradient(180deg,var(--color-background),color-mix(in_oklab,var(--color-muted)_45%,transparent))] p-4 md:p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Card className="overflow-hidden border-primary/15 bg-background/85 shadow-lg shadow-primary/5 backdrop-blur supports-[backdrop-filter]:bg-background/75 animate-in fade-in-0 slide-in-from-top-2 duration-500">
          <CardHeader className="relative gap-6 overflow-hidden border-b border-border/40 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-primary)_10%,transparent),transparent_55%),linear-gradient(180deg,transparent,color-mix(in_oklab,var(--color-muted)_65%,transparent))] pb-7">
            <div className="absolute top-0 right-0 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -top-10 right-16 h-32 w-32 rounded-full border border-primary/10" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                {/* <Badge
                  variant="outline"
                  className="border-primary/20 bg-background/70 text-primary"
                >
                  Flujo asistido por IA
                </Badge> */}
                <div className="space-y-2">
                  <CardTitle className="max-w-3xl text-3xl tracking-tight md:text-4xl">
                    Nuevos productos
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                    Centraliza la incorporación de listas de precios nuevas y
                    prepara la información para crear o actualizar productos del
                    catálogo.
                  </CardDescription>
                </div>
              </div>

              {/* <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                <div className="rounded-2xl border border-border/50 bg-background/70 px-4 py-3 shadow-sm backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Entrada</p>
                  <p className="mt-2 text-sm font-medium">Listas completas</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/70 px-4 py-3 shadow-sm backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Agrupación</p>
                  <p className="mt-2 text-sm font-medium">Por proveedor</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/70 px-4 py-3 shadow-sm backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Resultado</p>
                  <p className="mt-2 text-sm font-medium">Carga en segundo plano</p>
                </div>
              </div> */}
            </div>
          </CardHeader>

          <CardContent className="grid gap-4 border-t border-white/5 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.02))] p-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Paso 1
              </p>
              <p className="mt-2 font-medium text-foreground">
                Define el proveedor
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Selecciona uno existente o créalo sin salir de la carga.
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Paso 2
              </p>
              <p className="mt-2 font-medium text-foreground">
                Agrupa sus archivos
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Sube varias listas en el mismo bloque para mantener el contexto.
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Paso 3
              </p>
              <p className="mt-2 font-medium text-foreground">
                Inicia la carga
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                El sistema procesa el lote y te devuelve un identificador de
                seguimiento.
              </p>
            </div>
          </CardContent>
        </Card>

        <ProductsNewTabs />
      </div>
    </main>
  )
}
