
// cuando aprieta "Emitir Ticket".
export type CreateSaleInput = {
  customerId?: string | null; // El cliente es opcional (puede ser Consumidor Final)
  notes?: string | null;      // Alguna nota sobre la venta
  items: SaleItemInput[];     // La lista de productos en el carrito
}

// renglón individual del ticket
export type SaleItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number; // Guardamos el precio al que se vendió en ESTE momento
}

// carrito
export type CartItem = {
  productId: string;
  name: string;
  code: string | null;
  quantity: number;
  unitPrice: number;
  stock: number | null; // null = sin controlar (no limita cantidad)
}