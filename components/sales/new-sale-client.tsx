"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Loader2, UserCheck, UserPlus, UserX } from "lucide-react"
import { toast } from "sonner"

import type { CartItem } from "@/lib/sales/types"
import type { ProductSearchResult } from "@/components/sales/product-search"
import { CustomerSearch } from "@/components/sales/customer-search"
import type { CustomerListItem } from "@/lib/customers/types"
import type { ProductDetailResponse } from "@/lib/products/catalog-types"

import { CustomerFormSheet } from "@/components/customers/customer-form-sheet"
import { ProductSearch } from "@/components/sales/product-search"
import { CartTable } from "@/components/sales/cart-table"
import { Button } from "@/components/ui/button"

// Design tokens — consistent with the rest of the app
const ACCENT     = "#3d6aff"
const ACCENT_BG  = "rgba(61,106,255,0.07)"

export function NewSaleClient() {
  const [cart, setCart]                     = useState<CartItem[]>([])
  const [customer, setCustomer]             = useState<CustomerListItem | null>(null)
  const [isFinalConsumer, setIsFinalConsumer] = useState(false)
  const [customerFormOpen, setCustomerFormOpen] = useState(false)
  const [isCheckingOut, setIsCheckingOut]   = useState(false)

  const totalAmount = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.unitPrice || 0) * item.quantity, 0),
    [cart],
  )

  const itemCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart],
  )

  const handleAddProduct = useCallback((product: ProductSearchResult) => {
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id)

      if (existing) {
        if (existing.quantity >= (product.stock || 0)) {
          toast.error("Stock insuficiente", { description: "No quedan más unidades disponibles." })
          return current
        }
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }

      return [
        ...current,
        {
          productId: product.id,
          name:      product.name,
          code:      product.supplierProductCode || product.barcode || product.code || "N/A",
          quantity:  1,
          unitPrice: Number(product.salePrice || product.price || 0),
          stock:     Number(product.stock || 0),
        },
      ]
    })
  }, [])

  useEffect(() => {
    // Leer la URL en el momento exacto del mount — evita el problema de timing
    // con useSearchParams durante navegaciones client-side de Next.js.
    const productId = new URLSearchParams(window.location.search).get("productId")
    if (!productId) return

    let cancelled = false

    async function loadInitialProduct() {
      try {
        const response = await fetch(`/api/products/${productId}`)
        const payload  = (await response.json()) as ProductDetailResponse & { error?: string }

        if (!response.ok || !payload.product) {
          throw new Error(payload.error || "No se pudo cargar el producto seleccionado.")
        }

        const product = payload.product

        if (!product.flags.isActive || !product.flags.isForSale || product.inventory.stock <= 0) {
          throw new Error("El producto seleccionado no está disponible para venta.")
        }

        if (!cancelled) {
          handleAddProduct({
            id:                  product.id,
            name:                product.name,
            supplierProductCode: product.supplierProductCode,
            barcode:             product.barcode,
            salePrice:           product.pricing.salePrice,
            stock:               product.inventory.stock,
          })
          toast.success("Producto agregado al ticket", { description: product.name })
        }
      } catch (error) {
        if (!cancelled) {
          toast.error("No se pudo iniciar la venta con ese producto", {
            description: error instanceof Error ? error.message : "Intentalo nuevamente.",
          })
        }
      }
    }

    void loadInitialProduct()
    return () => { cancelled = true }
  // handleAddProduct es estable (useCallback con []) — el efecto solo corre al montar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleAddProduct])

  function handleUpdateQuantity(productId: string, newQuantity: number) {
    setCart((current) =>
      current.map((item) =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item,
      ),
    )
  }

  function handleRemoveItem(productId: string) {
    setCart((current) => current.filter((item) => item.productId !== productId))
  }

  function handleSelectCustomer(selected: CustomerListItem) {
    setCustomer(selected)
    setIsFinalConsumer(false)
  }

  function handleUseFinalConsumer() {
    setCustomer(null)
    setIsFinalConsumer(true)
  }

  function handleClearCustomer() {
    setCustomer(null)
    setIsFinalConsumer(false)
  }

  async function handleCheckout() {
    if (cart.length === 0 || isCheckingOut) return
    setIsCheckingOut(true)

    const toastId = toast.loading("Registrando venta…")

    try {
      const response = await fetch("/api/sales", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          customerId: customer ? customer.id : null,
          items:      cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al registrar la venta")
      }

      toast.success("Venta registrada", {
        id:          toastId,
        description: "El ticket se guardó y el stock fue actualizado.",
      })

      setCart([])
      setCustomer(null)
    } catch (error) {
      toast.error("No se pudo registrar la venta", {
        id:          toastId,
        description: error instanceof Error ? error.message : "Intentalo nuevamente.",
      })
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
            Punto de venta
          </p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground leading-none">
            Nueva venta
          </h1>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 rounded-lg text-[13px] text-muted-foreground shadow-none hover:text-foreground"
        >
          <Link href="/sales">
            <ArrowLeft className="size-3.5" />
            Historial
          </Link>
        </Button>
      </header>

      {/* ── Two-panel layout ──────────────────────────────────────────────── */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">

        {/* Left panel — workspace */}
        <div className="space-y-4">

          {/* Product search */}
          <div className="rounded-xl border border-border/60 bg-background p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
              Agregar productos
            </p>
            <p className="mt-0.5 text-[13px] font-semibold text-foreground">
              Buscar por nombre, código o código de barras
            </p>
            <div className="mt-4">
              <ProductSearch onSelectProduct={handleAddProduct} />
            </div>
          </div>

          {/* Cart */}
          <CartTable
            items={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
          />
        </div>

        {/* Right panel — checkout */}
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">

          {/* Customer card */}
          <div className="rounded-xl border border-border/60 bg-background p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                  Cliente
                </p>
                <p className="mt-0.5 text-[13px] font-semibold text-foreground">
                  {customer
                    ? `${customer.lastName}, ${customer.firstName}`
                    : isFinalConsumer
                      ? "Consumidor final"
                      : "Sin cliente asignado"}
                </p>
              </div>

              {customer ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearCustomer}
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                  title="Quitar cliente"
                >
                  <UserX className="size-4" />
                </Button>
              ) : isFinalConsumer ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearCustomer}
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                  title="Cambiar selección"
                >
                  <UserX className="size-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomerFormOpen(true)}
                  className="h-8 shrink-0 gap-1.5 rounded-lg border-border/60 text-[12px] shadow-none"
                >
                  <UserPlus className="size-3.5" />
                  Nuevo
                </Button>
              )}
            </div>

            {/* Customer info chip, final consumer chip, or search */}
            {customer ? (
              <div className="mt-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
                <p className="truncate text-[12px] text-muted-foreground">
                  {customer.email || customer.phone || "Sin datos de contacto"}
                </p>
              </div>
            ) : isFinalConsumer ? (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
                <UserCheck className="size-3.5 shrink-0 text-muted-foreground" />
                <p className="text-[12px] text-muted-foreground">
                  Venta sin asociar cliente
                </p>
              </div>
            ) : (
              <div className="mt-3">
                <CustomerSearch
                  onSelectCustomer={handleSelectCustomer}
                  onCreateCustomer={() => setCustomerFormOpen(true)}
                  onUseFinalConsumer={handleUseFinalConsumer}
                />
              </div>
            )}
          </div>

          {/* Summary + checkout card */}
          <div className="rounded-xl border border-border/60 bg-background p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
              Resumen del ticket
            </p>

            {/* Mini stats */}
            <div className="mt-3">
              <div className="rounded-lg bg-muted/30 px-3 py-2.5">
                <p className="text-[10px] text-muted-foreground">Artículos</p>
                <p className="mt-0.5 font-mono text-xl font-semibold text-foreground">
                  {itemCount}
                </p>
              </div>
            </div>

            {/* Total */}
            <div className="mt-4 border-t border-border/50 pt-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                Total a cobrar
              </p>
              <p
                className="mt-1 font-mono text-[2.6rem] font-semibold leading-none tracking-tight text-foreground"
                style={{ color: cart.length > 0 ? ACCENT : undefined }}
              >
                ${totalAmount.toLocaleString("es-AR")}
              </p>
              {cart.length === 0 && (
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Agregá al menos un producto para continuar.
                </p>
              )}
            </div>

            {/* Single CTA */}
            <Button
              size="lg"
              className="mt-5 h-12 w-full gap-2 rounded-xl text-[14px] font-semibold shadow-none"
              disabled={cart.length === 0 || isCheckingOut}
              onClick={handleCheckout}
            >
              {isCheckingOut ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {isCheckingOut ? "Registrando…" : "Emitir ticket"}
            </Button>
          </div>
        </aside>
      </div>

      <CustomerFormSheet
        open={customerFormOpen}
        customer={null}
        onOpenChange={setCustomerFormOpen}
        onSaved={(createdCustomer) => {
          setCustomer(createdCustomer)
          setIsFinalConsumer(false)
          toast.success("Cliente creado y seleccionado", {
            description: `${createdCustomer.lastName}, ${createdCustomer.firstName}`,
          })
        }}
      />
    </div>
  )
}
