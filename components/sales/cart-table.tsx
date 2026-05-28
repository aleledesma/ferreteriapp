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
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-background px-6 py-14 text-center">
        <p className="text-[13px] font-medium text-muted-foreground">
          El ticket está vacío
        </p>
        <p className="mt-1 text-[12px] text-muted-foreground/70">
          Usá el buscador de arriba para agregar productos.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-background">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
            Productos en el ticket
          </p>
          <p className="mt-0.5 text-[13px] font-semibold text-foreground">
            Ticket actual
          </p>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ background: "rgba(61,106,255,0.07)", color: "#3d6aff" }}
        >
          {items.length} {items.length === 1 ? "renglón" : "renglones"}
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/40">
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                Producto
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                Precio unit.
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                Cant.
              </th>
              <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                Subtotal
              </th>
              <th className="w-12 px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {items.map((item) => (
              <tr key={item.productId} className="transition-colors hover:bg-muted/20">

                {/* Product name + stock info */}
                <td className="px-5 py-3.5">
                  <p className="text-[13px] font-medium text-foreground">{item.name}</p>
                  <p className="mt-0.5 text-[11px]">
                    {item.stock < 5 ? (
                      <span style={{ color: "#d97706" }}>
                        Quedan {item.stock} en stock
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Stock: {item.stock}
                      </span>
                    )}
                  </p>
                </td>

                {/* Unit price */}
                <td className="px-4 py-3.5 text-right">
                  <span className="font-mono text-[13px] tabular-nums text-muted-foreground">
                    ${Number(item.unitPrice || 0).toLocaleString("es-AR")}
                  </span>
                </td>

                {/* Quantity controls */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-lg border-border/60 shadow-none"
                      onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-7 text-center font-mono text-[13px] font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-lg border-border/60 shadow-none"
                      onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                </td>

                {/* Subtotal */}
                <td className="px-5 py-3.5 text-right">
                  <span className="font-mono text-[13px] font-semibold tabular-nums text-foreground">
                    ${(Number(item.unitPrice || 0) * item.quantity).toLocaleString("es-AR")}
                  </span>
                </td>

                {/* Remove */}
                <td className="px-3 py-3.5 text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground/60 hover:text-foreground"
                    onClick={() => onRemoveItem(item.productId)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="divide-y divide-border/40 md:hidden">
        {items.map((item) => (
          <div key={item.productId} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-foreground">{item.name}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Código: {item.code}
                </p>
                {item.stock < 5 ? (
                  <p className="mt-0.5 text-[11px]" style={{ color: "#d97706" }}>
                    Quedan {item.stock} en stock
                  </p>
                ) : (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Stock: {item.stock}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-foreground"
                onClick={() => onRemoveItem(item.productId)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg border-border/60 shadow-none"
                  onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="size-3" />
                </Button>
                <span className="w-8 text-center font-mono text-[13px] font-semibold tabular-nums">
                  {item.quantity}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg border-border/60 shadow-none"
                  onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                >
                  <Plus className="size-3" />
                </Button>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Subtotal</p>
                <p className="font-mono text-[14px] font-semibold tabular-nums text-foreground">
                  ${(Number(item.unitPrice || 0) * item.quantity).toLocaleString("es-AR")}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
