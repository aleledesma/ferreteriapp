"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Receipt, Printer, Loader2, Package, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type SaleDetailSheetProps = {
  saleId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SaleDetailSheet({ saleId, open, onOpenChange }: SaleDetailSheetProps) {
  const [sale, setSale] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && saleId) {
      async function fetchDetail() {
        setIsLoading(true)
        try {
          const response = await fetch(`/api/sales/${saleId}`)
          const data = await response.json()
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
  
  const nombreCliente = sale.customer 
    ? `${sale.customer.lastName}_${sale.customer.firstName}`.replace(/\s+/g, '_') 
    : "Consumidor_Final";

  const tituloArchivo = `Ticket_${fechaDoc}_${horaDoc}_${ticketCod}`;

  const itemsHtml = sale.items.map((item: any) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 15px 0;">
        <div style="font-size: 16px; font-weight: bold; color: #000;">${item.product.name.toUpperCase()}</div>
        <div style="font-size: 13px; color: #444;">Cantidad: ${item.quantity} unidades</div>
      </td>
      <td style="text-align: right; font-size: 16px; color: #000;">$${Number(item.unitPrice).toLocaleString('es-AR')}</td>
      <td style="text-align: right; font-weight: bold; font-size: 18px; color: #000;">$${Number(item.subtotal).toLocaleString('es-AR')}</td>
    </tr>
  `).join('');

  // Estructura completa de la hoja A4 que se va a imprimir
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
          
          /* Grilla superior corregida para que NO se corte */
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          .info-table td { width: 50%; padding: 15px; border: 1px solid #ddd; vertical-align: top; background: #fcfcfc; }
          .label { font-size: 11px; font-weight: bold; color: #555; text-transform: uppercase; margin-bottom: 8px; display: block; }
          .value { font-size: 16px; font-weight: bold; color: #000; display: block; }

          table.items-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          table.items-table th { border-bottom: 2px solid #000; padding: 10px 0; text-align: left; font-size: 13px; }
          
          .footer-section { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px; }
          .notes { width: 50%; font-size: 12px; color: #666; border-left: 3px solid #ddd; padding-left: 15px; }
          
          /* ACA ESTÁ EL ARREGLO DEL GRIS */
          .total-box { width: 40%; text-align: right; }
          .subtotal-line { font-size: 16px; margin-bottom: 10px; color: #000; }
          .total-line { 
            background: #000 !important; 
            color: #fff !important; 
            padding: 20px; 
            border-radius: 10px; 
            text-align: right;
            box-shadow: inset 0 0 0 1000px #000; /* Truco final para evitar el gris */
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto p-0 flex flex-col gap-0">
        <SheetHeader className="p-6 pb-2 border-b border-border/50 bg-muted/5 text-foreground">
          <SheetTitle className="flex items-center gap-2 text-2xl font-bold">
            <Receipt className="size-6 text-primary" /> Ticket Detallado
          </SheetTitle>
          <SheetDescription className="font-mono text-[10px] uppercase">
            ID: {saleId}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 px-6 py-6 text-foreground">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="size-8 animate-spin mb-3" />
              <p>Buscando productos...</p>
            </div>
          ) : sale ? (
            <div className="space-y-6">
              <div className="bg-muted/30 p-4 rounded-xl border border-border/50 text-sm">
                <p className="font-bold mb-2 flex items-center gap-2">
                  <User className="size-4" /> {sale.customer ? `${sale.customer.lastName}, ${sale.customer.firstName}` : "Consumidor Final"}
                </p>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="size-4" /> {new Date(sale.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-muted-foreground">Artículos</h3>
                {sale.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center border-b border-border/40 pb-2">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} un. x ${Number(item.unitPrice).toLocaleString()}</p>
                    </div>
                    <span className="font-bold text-primary">${Number(item.subtotal).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t-2 border-primary/20">
                <div className="flex justify-between text-2xl font-black italic">
                  <span>TOTAL</span>
                  <span className="font-bold text-primary">${Number(sale.total).toLocaleString("es-AR")}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="p-6 border-t bg-background mt-auto">
          <Button className="w-full h-14 font-bold gap-2 text-lg shadow-xl" onClick={handlePrint}>
            <Printer className="size-5" /> IMPRIMIR EN A4
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}