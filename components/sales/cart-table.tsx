"use client"

import { Minus, Plus, Trash2 } from "lucide-react"
import type { CartItem } from "@/lib/sales/types"
import { Button } from "@/components/ui/button"

type CartTableProps = {
  items: CartItem[]
  onUpdateQuantity: (productId: string, newQuantity: number) => void
  onRemoveItem: (productId: string) => void
}

export function CartTable({ items, onUpdateQuantity, onRemoveItem }: CartTableProps) {
  //Si el carrito está vacío, mostramos un mensaje
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 px-6 py-14 text-center text-sm text-muted-foreground">
        El ticket está vacío. Buscá un producto arriba para empezar a cobrar.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/60 bg-background overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Producto</th>
            <th className="px-4 py-3 font-medium text-right">Precio Unit.</th>
            <th className="px-4 py-3 font-medium text-center">Cantidad</th>
            <th className="px-4 py-3 font-medium text-right">Subtotal</th>
            <th className="px-4 py-3 font-medium text-center w-16"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {items.map((item) => (
            <tr key={item.productId} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">
                <div className="font-medium text-foreground">{item.name}</div>
                <div className="text-xs mt-0.5">
                  {/* Aviso de poco stock */}
                  {item.stock < 5 ? (
                    <span className="text-destructive font-semibold">¡Atención: Quedan {item.stock}!</span>
                  ) : (
                    <span className="text-muted-foreground">Stock disp: {item.stock}</span>
                  )}
                </div>
              </td>
              
              <td className="px-4 py-3 text-right tabular-nums">
                ${Number(item.unitPrice || 0).toLocaleString("es-AR")}
              </td>
              
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                  {/* Botón Restar */}
                  <Button
                    type="button" variant="outline" size="icon" className="h-7 w-7"
                    onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                    disabled={item.quantity <= 1} // No puede bajar de 1
                  >
                    <Minus className="size-3" />
                  </Button>
                  
                  <span className="w-6 text-center font-medium tabular-nums">{item.quantity}</span>
                  
                  {/* Botón Sumar */}
                  <Button
                    type="button" variant="outline" size="icon" className="h-7 w-7"
                    onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.stock} // No vender más del stock
                  >
                    <Plus className="size-3" />
                  </Button>
                </div>
              </td>
              
              {/* Subtotal (Precio x Cantidad) */}
              <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">
                ${(Number(item.unitPrice || 0) * item.quantity).toLocaleString("es-AR")}
              </td>
              
              <td className="px-4 py-3 text-center">
                <Button
                  type="button" variant="ghost" size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                  onClick={() => onRemoveItem(item.productId)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}