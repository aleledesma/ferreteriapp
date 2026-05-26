export const PRODUCT_STOCK_MOVEMENT_LABELS = {
  INITIAL: "Carga inicial",
  SALE: "Venta",
  MANUAL_ADJUSTMENT: "Ajuste manual",
  PRICE_LIST_UPDATE: "Actualización por lista de precios",
} as const

export function getProductStockMovementLabel(type: string) {
  return PRODUCT_STOCK_MOVEMENT_LABELS[type as keyof typeof PRODUCT_STOCK_MOVEMENT_LABELS] ?? type.replaceAll("_", " ")
}
