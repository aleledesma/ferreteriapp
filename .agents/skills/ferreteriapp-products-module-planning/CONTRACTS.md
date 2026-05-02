# Contratos backend — módulo `/products`

## Objetivo

Definir el contrato base para implementar el catálogo `/products` sin ambigüedad entre backend y frontend.

Este documento aterriza Stage 1 y debe usarse como referencia para:

1. endpoints
2. DTOs
3. query params
4. derivación de estados
5. KPIs
6. detalle de producto

## Decisiones base ya confirmadas

- Mostrar solo productos activos por defecto.
- Eliminación lógica: `isActive = false`.
- Carga incremental con botón `Cargar más`.
- Tamaño de página: `100`.
- Orden por defecto: stock crítico primero.
- KPIs globales, no dependientes de filtros.
- Búsqueda completa por texto.

## Endpoint 1 — Listado de catálogo

### Propuesta

- `GET /api/products`

### Query params

```ts
type ProductListQuery = {
  search?: string
  supplierId?: string
  category?: string
  brand?: string
  stockStatus?: "sin_stock" | "stock_bajo" | "stock_normal"
  activityStatus?: "active" | "inactive" | "all"
  saleStatus?: "for_sale" | "not_for_sale" | "all"
  sort?: "critical_stock" | "name" | "updated_at" | "sale_price" | "stock" | "supplier"
  cursor?: string
  limit?: number
}
```

### Defaults

```ts
const defaults = {
  activityStatus: "active",
  saleStatus: "all",
  sort: "critical_stock",
  limit: 100,
}
```

### Respuesta

```ts
type ProductListResponse = {
  items: ProductListItemDto[]
  pageInfo: {
    nextCursor: string | null
    hasMore: boolean
    pageSize: number
  }
  appliedFilters: {
    search: string | null
    supplierId: string | null
    category: string | null
    brand: string | null
    stockStatus: "sin_stock" | "stock_bajo" | "stock_normal" | null
    activityStatus: "active" | "inactive" | "all"
    saleStatus: "for_sale" | "not_for_sale" | "all"
    sort: "critical_stock" | "name" | "updated_at" | "sale_price" | "stock" | "supplier"
  }
}
```

### DTO del item del listado

```ts
type ProductListItemDto = {
  id: string
  name: string
  supplierProductCode: string
  barcode: string | null
  brand: string | null
  categoryName: string | null
  supplier: {
    id: string
    name: string
  }
  pricing: {
    costPrice: string
    salePrice: string
  }
  inventory: {
    stock: number
    minStock: number
    stockStatus: "sin_stock" | "stock_bajo" | "stock_normal"
  }
  flags: {
    isActive: boolean
    isForSale: boolean
  }
  updatedAt: string
}
```

### Reglas de búsqueda por texto

La búsqueda del MVP debe contemplar:

1. `Product.name`
2. `Product.supplierProductCode`
3. `Product.barcode`
4. `Product.brand`
5. `Supplier.name`

## Regla de derivación de stock

```ts
type StockStatus = "sin_stock" | "stock_bajo" | "stock_normal"

function deriveStockStatus(stock: number, minStock: number): StockStatus {
  if (stock <= 0) return "sin_stock"
  if (stock > 0 && stock <= minStock) return "stock_bajo"
  return "stock_normal"
}
```

## Regla de orden por defecto

`critical_stock` debe ordenar así:

1. `sin_stock`
2. `stock_bajo`
3. `stock_normal`
4. dentro de cada grupo, por `name ASC`

Una forma simple de backend es calcular una prioridad derivada:

```ts
type StockPriority = 0 | 1 | 2

function deriveStockPriority(stock: number, minStock: number): StockPriority {
  if (stock <= 0) return 0
  if (stock <= minStock) return 1
  return 2
}
```

## Endpoint 2 — KPIs globales del catálogo

### Propuesta

- `GET /api/products/kpis`

### Respuesta

```ts
type ProductCatalogKpisResponse = {
  totalProducts: number
  activeProducts: number
  lowStockProducts: number
  outOfStockProducts: number
}
```

### Regla de universo

Los KPIs deben calcularse sobre **todo el catálogo**, no sobre el listado filtrado en pantalla.

### Regla sugerida

- `totalProducts`: todos los productos
- `activeProducts`: `isActive = true`
- `lowStockProducts`: productos con `stockStatus = "stock_bajo"`
- `outOfStockProducts`: productos con `stockStatus = "sin_stock"`

## Endpoint 3 — Detalle de producto

### Propuesta

- `GET /api/products/:productId`

### Respuesta

```ts
type ProductDetailResponse = {
  product: ProductDetailDto
}
```

### DTO de detalle

```ts
type ProductDetailDto = {
  id: string
  name: string
  supplierProductCode: string
  description: string | null
  brand: string | null
  categoryCode: string | null
  categoryName: string | null
  barcode: string | null
  supplier: {
    id: string
    name: string
  }
  currentPriceList: {
    id: string
    name: string
    sourceType: string
    status: string
  } | null
  pricing: {
    costPrice: string
    salePrice: string
  }
  inventory: {
    stock: number
    minStock: number
    stockStatus: "sin_stock" | "stock_bajo" | "stock_normal"
  }
  flags: {
    isActive: boolean
    isForSale: boolean
  }
  salesSummary: {
    lastSaleAt: string | null
    totalUnitsSold: number
  }
  stockMovements: ProductStockMovementDto[]
  createdAt: string
  updatedAt: string
}
```

### DTO de movimiento de stock

```ts
type ProductStockMovementDto = {
  id: string
  type: string
  quantityDelta: number
  previousStock: number | null
  nextStock: number | null
  notes: string | null
  createdAt: string
  createdBy: {
    id: string
    name: string | null
    email: string | null
  } | null
}
```

### Resumen liviano de ventas

Para el MVP, el detalle debe mostrar:

1. `lastSaleAt`
2. `totalUnitsSold`

No se incluye historial transaccional completo de ventas en esta etapa.

## Endpoint 4 — Eliminación lógica masiva

### Propuesta

- `POST /api/products/deactivate`

### Body

```ts
type DeactivateProductsRequest = {
  productIds: string[]
}
```

### Respuesta

```ts
type DeactivateProductsResponse = {
  processedCount: number
  updatedIds: string[]
}
```

### Regla

Cada producto seleccionado debe quedar con:

```ts
isActive = false
```

No hay hard delete.

## Endpoint 5 — Ajuste manual de stock

### Propuesta

- `POST /api/products/:productId/stock-adjustments`

### Body

```ts
type StockAdjustmentRequest = {
  nextStock: number
  notes?: string | null
}
```

### Respuesta

```ts
type StockAdjustmentResponse = {
  productId: string
  stock: number
  movement: ProductStockMovementDto
}
```

### Regla de negocio

1. El ajuste debe crear siempre un `StockMovement`
2. En el MVP, el motivo/nota NO es obligatorio
3. El ajuste debe quedar reflejado inmediatamente en el detalle

## Endpoint 6 — Actualización de flags operativos

### Propuesta

- `PATCH /api/products/:productId`

### Casos MVP esperados

1. editar producto
2. activar/desactivar
3. habilitar/deshabilitar venta

### Body mínimo sugerido

```ts
type UpdateProductRequest = {
  name?: string
  description?: string | null
  brand?: string | null
  categoryCode?: string | null
  categoryName?: string | null
  barcode?: string | null
  costPrice?: string
  salePrice?: string
  minStock?: number
  isActive?: boolean
  isForSale?: boolean
}
```

## Contrato de carga incremental

La vista usará botón `Cargar más` con `100` ítems por lote.

### Reglas

1. la primera carga trae `limit = 100`
2. si `hasMore = true`, se muestra botón `Cargar más`
3. al hacer clic, se consulta usando `nextCursor`
4. el backend debe garantizar orden estable para evitar duplicados o saltos

## Consideraciones de implementación backend

1. Mantener DAL separado de route handlers
2. Derivar `stockStatus` en capa de aplicación
3. Formatear `Decimal` a `string` en DTOs
4. No devolver relaciones completas innecesarias
5. Evitar N+1 al resolver supplier, currentPriceList y ventas resumidas
6. Diseñar consultas para soportar crecimiento del catálogo

## Resultado esperado al cerrar Stage 1

Cuando Stage 1 esté completo, el equipo debería tener:

1. endpoints definidos
2. DTOs definidos
3. reglas de derivación definidas
4. paginación incremental definida
5. base lista para iniciar Stage 2 sin volver a discutir producto
