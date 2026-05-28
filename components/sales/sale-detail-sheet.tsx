"use client"

import { useEffect, useState } from "react"
import { Loader2, Printer, ReceiptText, UserCircle2 } from "lucide-react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

type SaleDetailSheetProps = {
  saleId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type SaleDetail = {
  id: string
  createdAt: string
  subtotal: number | string
  total: number | string
  customer: { firstName: string; lastName: string } | null
  items: Array<{
    id: string
    quantity: number
    unitPrice: number | string
    subtotal: number | string
    product: { name: string }
  }>
}

export function SaleDetailSheet({ saleId, open, onOpenChange }: SaleDetailSheetProps) {
  const [sale, setSale]         = useState<SaleDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && saleId) {
      async function fetchDetail() {
        setIsLoading(true)
        try {
          const response = await fetch(`/api/sales/${saleId}`)
          const data     = await response.json()
          setSale(data)
        } catch (error) {
          console.error("Error al cargar detalle", error)
        } finally {
          setIsLoading(false)
        }
      }
      fetchDetail()
    }
  }, [open, saleId])

  const handlePrint = () => {
    if (!sale) return;

    const fecha = new Date(sale.createdAt);
    const fechaDoc = fecha.toLocaleDateString('es-AR').replace(/\//g, '-');
    const horaDoc = fecha.getHours().toString().padStart(2, '0') + fecha.getMinutes().toString().padStart(2, '0');
    const ticketCod = sale.id.slice(-8).toUpperCase();

    const tituloArchivo = `Ticket_${fechaDoc}_${horaDoc}_${ticketCod}`;

    const itemsHtml = sale.items.map((item) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 15px 0;">
          <div style="font-size: 16px; font-weight: bold; color: #000;">${item.product.name.toUpperCase()}</div>
          <div style="font-size: 13px; color: #444;">Cantidad: ${item.quantity} unidades</div>
        </td>
        <td style="text-align: right; font-size: 16px; color: #000;">$${Number(item.unitPrice).toLocaleString('es-AR')}</td>
        <td style="text-align: right; font-weight: bold; font-size: 18px; color: #000;">$${Number(item.subtotal).toLocaleString('es-AR')}</td>
      </tr>
    `).join('');

    const ticketHtml = `
      <html>
        <head>
          <title>${tituloArchivo}</title>
          <style>
            @media print {
              @page { margin: 1cm; size: A4; }
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
            body { font-family: 'Arial', sans-serif; color: #000; margin: 0; padding: 40px; line-height: 1.4; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #000; padding-bottom: 20px; margin-bottom: 30px; }

            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            .info-table td { width: 50%; padding: 15px; border: 1px solid #ddd; vertical-align: top; background: #fcfcfc; }
            .label { font-size: 11px; font-weight: bold; color: #555; text-transform: uppercase; margin-bottom: 8px; display: block; }
            .value { font-size: 16px; font-weight: bold; color: #000; display: block; }

            table.items-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            table.items-table th { border-bottom: 2px solid #000; padding: 10px 0; text-align: left; font-size: 13px; }

            .footer-section { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px; }
            .notes { width: 50%; font-size: 12px; color: #666; border-left: 3px solid #ddd; padding-left: 15px; }

            .total-box { width: 40%; text-align: right; }
            .subtotal-line { font-size: 16px; margin-bottom: 10px; color: #000; }
            .total-line {
              background: #000 !important;
              color: #fff !important;
              padding: 20px;
              border-radius: 10px;
              text-align: right;
              box-shadow: inset 0 0 0 1000px #000;
            }
            .total-val { font-size: 38px; font-weight: 900; display: block; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin:0; font-size: 40px; font-weight: 900; letter-spacing: -1.5px;">FERRETERÍA DIEGO</h1>
              <p style="margin:5px 0; font-size: 14px;">Santa Fe, Argentina | Tel: 4321-9876</p>
            </div>
            <div style="text-align: right; border: 3px solid #000; padding: 10px 20px;">
              <div style="font-size: 24px; font-weight: 900;">TICKET</div>
              <div style="font-family: monospace; font-weight: bold;">N° ${ticketCod}</div>
            </div>
          </div>

          <table class="info-table">
            <tr>
              <td>
                <span class="label">Fecha y Hora de Emisión</span>
                <span class="value">${new Intl.DateTimeFormat('es-AR', { dateStyle: 'long', timeStyle: 'short' }).format(fecha)}</span>
              </td>
              <td>
                <span class="label">Cliente / Razón Social</span>
                <span class="value">${sale.customer ? `${sale.customer.lastName.toUpperCase()}, ${sale.customer.firstName}` : "CONSUMIDOR FINAL"}</span>
              </td>
            </tr>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 60%;">DESCRIPCIÓN</th>
                <th style="text-align: right; width: 20%;">P. UNITARIO</th>
                <th style="text-align: right; width: 20%;">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="footer-section">
            <div class="notes">
              <p style="margin:0 0 5px 0;"><b>OBSERVACIONES:</b></p>
              <p style="margin:0;">Comprobante de gestión interna FerreteríaApp.<br>No válido como factura fiscal.</p>
            </div>
            <div class="total-box">
              <div class="subtotal-line">Subtotal: <b>$${Number(sale.subtotal).toLocaleString('es-AR')}</b></div>
              <div class="total-line">
                <span style="font-size: 12px; text-transform: uppercase; font-weight: bold; opacity: 0.9;">Total a Pagar</span>
                <span class="total-val">$${Number(sale.total).toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin-top: 100px; border-top: 1px dashed #ccc; padding-top: 20px; font-size: 12px; color: #888;">
            ¡Gracias por elegirnos! Esperamos verlo pronto.
          </div>

          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 600);
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(ticketHtml);
      printWindow.document.close();
    }
  }

  const ticketCode = saleId ? `#${saleId.slice(-6).toUpperCase()}` : "—"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* pr-12 deja espacio para el botón X del Sheet */}
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md">

        {/* ── Cabecera ─────────────────────────────────────────────────── */}
        <div className="shrink-0 border-b border-border/50 py-5 pl-6 pr-14">
          <SheetTitle className="sr-only">Detalle de venta</SheetTitle>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
            Comprobante
          </p>
          <div className="mt-1 flex items-center gap-3">
            <p className="font-mono text-[22px] font-semibold tracking-wider text-foreground leading-none">
              {ticketCode}
            </p>
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ background: "rgba(5,150,105,0.10)", color: "#059669" }}
            >
              cobrado
            </span>
          </div>
        </div>

        {/* ── Contenido ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="mb-3 size-5 animate-spin opacity-40" />
              <p className="text-[13px]">Cargando ticket…</p>
            </div>
          ) : sale ? (
            <div className="divide-y divide-border/50">

              {/* Info general */}
              <div className="grid grid-cols-2 gap-px bg-border/40">
                <div className="bg-background px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">
                    Cliente
                  </p>
                  <div className="mt-2 flex items-start gap-2">
                    <UserCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
                    <p className="text-[13px] font-medium text-foreground leading-snug">
                      {sale.customer
                        ? `${sale.customer.lastName}, ${sale.customer.firstName}`
                        : "Consumidor final"}
                    </p>
                  </div>
                </div>
                <div className="bg-background px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">
                    Fecha y hora
                  </p>
                  <p className="mt-2 text-[13px] font-medium text-foreground">
                    {new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(new Date(sale.createdAt))}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {new Intl.DateTimeFormat("es-AR", { timeStyle: "short" }).format(new Date(sale.createdAt))}
                  </p>
                </div>
              </div>

              {/* Artículos */}
              <div>
                <div className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="size-3.5 text-muted-foreground/60" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                      Artículos
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: "rgba(61,106,255,0.07)", color: "#3d6aff" }}
                  >
                    {sale.items.length} {sale.items.length === 1 ? "ítem" : "ítems"}
                  </span>
                </div>

                {/* Tabla de items */}
                <table className="w-full">
                  <thead>
                    <tr className="border-y border-border/40">
                      <th className="px-5 py-2 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60">
                        Producto
                      </th>
                      <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60">
                        Cant.
                      </th>
                      <th className="px-5 py-2 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {sale.items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/10">
                        <td className="px-5 py-3.5">
                          <p className="text-[13px] font-medium text-foreground">
                            {item.product.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            ${Number(item.unitPrice).toLocaleString("es-AR")} c/u
                          </p>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
                            × {item.quantity}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="font-mono text-[13px] font-semibold tabular-nums text-foreground">
                            ${Number(item.subtotal).toLocaleString("es-AR")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="px-5 py-5">
                <div className="rounded-xl border border-border/60 bg-muted/20 px-5 py-4">
                  {Number(sale.subtotal) !== Number(sale.total) && (
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[12px] text-muted-foreground">Subtotal</span>
                      <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
                        ${Number(sale.subtotal).toLocaleString("es-AR")}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                      Total cobrado
                    </span>
                    <span
                      className="font-mono text-[26px] font-semibold tabular-nums leading-none"
                      style={{ color: "#3d6aff" }}
                    >
                      ${Number(sale.total).toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          ) : null}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        {sale && (
          <div className="shrink-0 border-t border-border/50 bg-background p-5">
            <Button
              className="h-10 w-full gap-2 rounded-xl text-[13px] font-semibold shadow-none"
              onClick={handlePrint}
            >
              <Printer className="size-4" />
              Imprimir ticket A4
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
