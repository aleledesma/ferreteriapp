"use client"

import { useState, useMemo } from "react"
import { ShoppingCart, Receipt, UserX } from "lucide-react"
import { toast } from "sonner"

import type { CartItem } from "@/lib/sales/types"
import type { ProductSearchResult } from "@/components/sales/product-search"
import { CustomerSearch } from "@/components/sales/customer-search"
import type { CustomerListItem } from "@/lib/customers/types"

import { ProductSearch } from "@/components/sales/product-search"
import { CartTable } from "@/components/sales/cart-table"
import { Button } from "@/components/ui/button"

export function NewSaleClient() {
  const [cart, setCart] = useState<CartItem[]>([])
  
  // Estado para guardar el cliente seleccionado (null = Consumidor Final)
  const [customer, setCustomer] = useState<CustomerListItem | null>(null)

  // CALCULO DE TOTAL: Suma (Precio * Cantidad) de cada renglón
  const totalAmount = useMemo(() => {
    return cart.reduce((total, item) => total + (Number(item.unitPrice || 0) * item.quantity), 0)
  }, [cart])

  // ACCIÓN: Agrega un producto seleccionado al carrito
  function handleAddProduct(product: ProductSearchResult) {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.productId === product.id)
      const dbProduct = product as any

      // Si el producto ya está en el carrito, validamos stock antes de sumar una unidad
      if (existingItem) {
        if (existingItem.quantity >= (dbProduct.stock || 0)) {
          toast.error("Stock insuficiente", { description: "No quedan más unidades en el estante." })
          return currentCart
        }
        // Suma 1 a la cantidad del producto repetido
        return currentCart.map((item) =>
          item.productId === dbProduct.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      // Si es un producto nuevo en la sesión, lo agrega con cantidad inicial = 1
      return [...currentCart, {
        productId: dbProduct.id,
        name: dbProduct.name,
        code: dbProduct.supplierProductCode || dbProduct.barcode || dbProduct.code || "N/A",
        quantity: 1,
        unitPrice: Number(dbProduct.salePrice || dbProduct.price || 0),
        stock: Number(dbProduct.stock || 0)
      }]
    })
  }

  // Modifica la cantidad directo desde la tabla (tipeando o con botones +/-)
  function handleUpdateQuantity(productId: string, newQuantity: number) {
    setCart((current) =>
      current.map((item) =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  //Elimina un renglón del carrito 
  function handleRemoveItem(productId: string) {
    setCart((current) => current.filter((item) => item.productId !== productId))
  }

  //Envía el carrito a la base de datos al presionar "Emitir Ticket"
 async function handleCheckout() {
    if (cart.length === 0) return

    const toastId = toast.loading("Registrando venta y descontando stock...")

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer ? customer.id : null, // Si hay cliente manda el ID, si no, null
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          totalAmount: totalAmount
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al registrar la venta")
      }

      toast.success("¡Venta completada!", { 
        id: toastId,
        description: `El ticket se guardó y el stock fue actualizado correctamente.`
      })
      
      // Limpiamos la caja para el siguiente cliente
      setCart([]) 
      setCustomer(null) 

    } catch (error) {
      toast.error("Operación fallida", {
        id: toastId,
        description: error instanceof Error ? error.message : "No se pudo guardar la venta."
      })
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Izquierda: Buscador y Tabla */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-background rounded-xl p-4 border border-border/60 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
          <ProductSearch onSelectProduct={handleAddProduct} />
        </div>
        
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-700">
          <CartTable
            items={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
          />
        </div>
      </div>

      {/* Derecha: Panel de Cobro */}
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700">
        <div className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/60 shadow-sm flex flex-col h-full min-h-[300px]">
          <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border/50 pb-4 mb-4">
            <ShoppingCart className="size-5" /> Resumen de Venta
          </h2>

          {/* NUEVO: SECCIÓN DE CLIENTE */}
          <div className="mb-4 pb-4 border-b border-border/50">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Cliente</h3>
            {customer ? (
              // Si hay cliente elegido, mostramos su nombre y un botón para quitarlo
              <div className="flex items-center justify-between bg-primary/10 p-3 rounded-lg border border-primary/20">
                <div className="flex flex-col">
                  <span className="font-semibold text-primary">{customer.lastName}, {customer.firstName}</span>
                  <span className="text-xs text-muted-foreground">{customer.email || customer.phone || "Sin datos extra"}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setCustomer(null)} className="text-destructive hover:bg-destructive/10 h-8 w-8" title="Quitar cliente">
                  <UserX className="size-4" />
                </Button>
              </div>
            ) : (
              // Si no hay cliente, mostramos el buscador
              <CustomerSearch onSelectCustomer={setCustomer} />
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex justify-between text-muted-foreground text-sm">
              <span>Cant. de artículos:</span>
              <span className="font-medium text-foreground">
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-border/50">
            <div className="flex items-end justify-between mb-6">
              <span className="text-lg font-medium text-muted-foreground mb-1">TOTAL</span>
              <span className="text-4xl font-bold text-green-600 dark:text-green-500 tabular-nums tracking-tight">
                ${totalAmount.toLocaleString("es-AR")}
              </span>
            </div>

            <Button
              size="lg"
              className="w-full h-14 text-lg font-bold shadow-md hover:scale-[1.02] transition-transform"
              disabled={cart.length === 0}
              onClick={handleCheckout}
            >
              <Receipt className="size-5 mr-2" />
              Emitir Ticket
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}