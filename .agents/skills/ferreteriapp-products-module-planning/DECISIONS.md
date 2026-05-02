# Decisiones del módulo `/products`

## Instrucción obligatoria

Toda decisión listada aquí debe resolverse mediante el componente interactivo `Questions` de OpenCode.

NO asumir.
NO elegir por el usuario.
NO avanzar en una parte ambigua sin respuesta.

---

## Pendientes

### 12. Regla de derivación de estado de stock
- Estado: resolved
- Contexto:
  - Esta decisión impacta DTOs de listado/detalle, KPIs, filtros y orden por stock crítico.
- Opciones candidatas:
  - A. `sin_stock` si `stock <= 0`; `stock_bajo` si `stock > 0 && stock <= minStock`; `stock_normal` en el resto
  - B. Igual que A, pero cuando `minStock = 0` nunca existe `stock_bajo`
  - C. Otra regla específica del negocio
- Recomendación base: B
- Decisión del usuario: A.
- Regla confirmada:
  - `sin_stock` si `stock <= 0`
  - `stock_bajo` si `stock > 0 && stock <= minStock`
  - `stock_normal` en el resto

### 13. Universo visible por defecto en `/products`
- Estado: resolved
- Decisión del usuario:
  - mostrar por defecto solo productos activos (`isActive = true`)
  - los inactivos se consultan mediante filtro

### 14. Alcance de la búsqueda por texto
- Estado: resolved
- Decisión del usuario:
  - búsqueda completa en el MVP
  - campos incluidos: nombre, código de proveedor, código de barras, marca y proveedor

### 15. Contenido del resumen liviano de ventas
- Estado: resolved
- Decisión del usuario:
  - mostrar última venta + total vendido

### 16. Universo de cálculo de KPIs
- Estado: resolved
- Decisión del usuario:
  - los KPIs deben reflejar todo el catálogo, no solo el subconjunto filtrado en la vista

### 1. Acciones en el listado
- Estado: resolved
- Opciones:
  - A. Solo abrir detalle
  - B. Abrir detalle + acciones rápidas mínimas
  - C. Edición inline
  - D. Selección múltiple / acciones masivas
- Recomendación base: B
- Decisión del usuario: combinación de A + D
  - abrir modal de detalle individual
  - permitir selección múltiple de productos
  - acción masiva principal inicial: "eliminar"
  - la eliminación debe ser lógica, NO física
  - se preserva el terreno para una futura funcionalidad tipo undo / `Ctrl + Z`

### 2. Profundidad del modal de detalle
- Estado: resolved
- Opciones:
  - A. Solo lectura
  - B. Lectura + acciones puntuales
  - C. Modal operacional completo con tabs/acciones
- Recomendación base: B
- Decisión del usuario: B. Lectura + acciones puntuales.

### 3. Semántica de “eliminar” producto
- Estado: resolved
- Opciones:
  - A. Hard delete
  - B. Desactivar (`isActive`)
  - C. Sacar de venta (`isForSale`)
  - D. Archivar/ocultar
- Recomendación base: B o combinación B+C según caso
- Decisión del usuario: confirmado que NO debe existir hard delete en este flujo; la eliminación debe ser lógica y en esta etapa se representa con `isActive = false`.

### 4. Ajuste manual de stock
- Estado: resolved
- Opciones:
  - A. Edición directa
  - B. Ajuste con motivo obligatorio
  - C. Ajuste con auditoría/movimiento formal
- Recomendación base: C
- Decisión del usuario:
  - registrar siempre el ajuste como movimiento de stock
  - no exigir motivo obligatorio en el MVP

### 5. Filtros del MVP
- Estado: resolved
- Opciones iniciales sugeridas:
  - Texto
  - Proveedor
  - Categoría
  - Marca
  - Estado de stock
  - Activo/inactivo
  - En venta/no en venta
  - Rango de precio
- Recomendación base: texto, proveedor, categoría, stock, activo, en venta
- Decisión del usuario: Aceptado el set recomendado ampliado para MVP.
- Filtros confirmados para MVP:
  - búsqueda por texto
  - proveedor
  - categoría
  - marca
  - estado de stock
  - activo / inactivo
  - en venta / no en venta
- Filtro postergado:
  - rango de precio de venta

### 6. Orden por defecto
- Estado: resolved
- Opciones:
  - A. Nombre
  - B. Última actualización
  - C. Stock crítico primero
  - D. Proveedor + nombre
- Recomendación base: C
- Decisión del usuario: C. Stock crítico primero.

### 7. KPIs o resumen superior
- Estado: resolved
- Opciones:
  - A. No incluir en MVP
  - B. Incluir cards resumen en MVP
- Posibles KPIs:
  - total productos
  - activos
  - stock bajo
  - sin stock
- Recomendación base: depende del foco del MVP
- Decisión del usuario: B. Incluir KPIs en el MVP.
- KPIs confirmados:
  - total productos
  - activos
  - stock bajo
  - sin stock
- Restricción de UX:
  - deben ser sutiles
  - no deben presentarse como cards enormes
  - deben dar contexto sin competir visualmente con el listado
  - el protagonismo analítico fuerte queda reservado para `/dashboard`

### 8. Estrategia de estado del modal
- Estado: resolved
- Opciones:
  - A. Estado local
  - B. Query param `?product=<id>`
- Recomendación base: B
- Decisión del usuario: B. Query param `?product=<id>`.

### 9. Historial de ventas en el detalle
- Estado: resolved
- Opciones:
  - A. No mostrar en MVP
  - B. Resumen liviano
  - C. Historial transaccional más rico
- Recomendación base: A o B
- Decisión del usuario: B. Resumen liviano.

### 10. Estrategia de infinite scroll
- Estado: resolved
- Opciones:
  - A. Offset pagination
  - B. Cursor pagination
  - C. Híbrido “mostrar más”
- Recomendación base: B
- Decisión del usuario:
  - no usar infinite scroll por el momento
  - usar un botón explícito de "Cargar más"
  - tamaño de página: 100 productos por carga
- Interpretación funcional para esta etapa:
  - enfoque híbrido/controlado por usuario, no scroll automático

---

## Decisiones resueltas

- Decisión 1 resuelta:
  - El listado debe permitir abrir modal de detalle y también selección múltiple para eliminación lógica masiva.
- Decisión 2 resuelta:
  - El modal de detalle será de lectura + acciones puntuales.
- Decisión 3 resuelta:
  - La eliminación lógica se implementa desactivando el producto con `isActive = false`.

### 5. Filtros del MVP
- Estado: resolved
- Decisión del usuario:
  - incluir texto, proveedor, categoría, marca, estado de stock, activo/inactivo y en venta/no en venta
  - postergar rango de precio para una etapa posterior

### 6. Orden por defecto
- Estado: resolved
- Decisión del usuario:
  - ordenar por stock crítico primero

### 7. KPIs o resumen superior
- Estado: resolved
- Decisión del usuario:
  - incluir KPIs sutiles en el MVP
  - mostrar total productos, activos, stock bajo y sin stock
  - mantener bajo protagonismo visual porque la vista analítica principal será `/dashboard`

### 8. Estrategia de estado del modal
- Estado: resolved
- Decisión del usuario:
  - usar query param `?product=<id>` para controlar la apertura del modal

### 9. Historial de ventas en el detalle
- Estado: resolved
- Decisión del usuario:
  - incluir un resumen liviano de ventas en el detalle del producto

### 10. Estrategia de carga incremental del catálogo
- Estado: resolved
- Decisión del usuario:
  - no usar infinite scroll en esta etapa
  - usar botón "Cargar más"
  - cargar 100 productos por página

### 4. Ajuste manual de stock
- Estado: resolved
- Decisión del usuario:
  - registrar movimiento de stock
  - no exigir motivo obligatorio en el MVP

### 11. Acciones puntuales permitidas en el modal
- Estado: resolved
- Decisión del usuario:
  - Editar producto
  - Activar / desactivar producto
  - Habilitar / deshabilitar venta
  - Ajustar stock manualmente
  - Ver historial/listado de movimientos de stock
- Restricción de UX:
  - El historial de movimientos de stock debe mostrarse dentro de la misma pestaña/sección del modal donde se consulta y ajusta el stock.

### 12. Regla de derivación de estado de stock
- Estado: resolved
- Decisión del usuario:
  - `sin_stock` si `stock <= 0`
  - `stock_bajo` si `stock > 0 && stock <= minStock`
  - `stock_normal` en el resto

### 13. Universo visible por defecto en `/products`
- Estado: resolved
- Decisión del usuario:
  - mostrar solo productos activos por defecto

### 14. Alcance de la búsqueda por texto
- Estado: resolved
- Decisión del usuario:
  - buscar por nombre, código de proveedor, código de barras, marca y proveedor

### 15. Contenido del resumen liviano de ventas
- Estado: resolved
- Decisión del usuario:
  - mostrar última venta + total vendido

### 16. Universo de cálculo de KPIs
- Estado: resolved
- Decisión del usuario:
  - calcular KPIs sobre todo el catálogo

## Regla de mantenimiento

Cuando el usuario responda una decisión:

1. moverla o reflejarla como resuelta
2. indicar fecha/contexto si aporta claridad
3. anotar la opción elegida
4. anotar restricciones derivadas
5. actualizar también `STATUS.md` si cambia la etapa o desbloquea trabajo
