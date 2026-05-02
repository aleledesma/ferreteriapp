# Estado del módulo `/products`

## Resumen

- Estado general: Planificado, no implementado
- Ruta catálogo `/products`: pendiente
- Ruta existente relacionada: `/products/new`
- Última actualización: creación de la skill

## Etapas

### Stage 0 — Definition and alignment
- Estado: completed
- Avances:
  - Se definió el blueprint funcional inicial del módulo.
  - Se inició la resolución interactiva de decisiones abiertas con el usuario.
  - Se resolvió la decisión sobre acciones en el listado: modal individual + selección múltiple para eliminación lógica masiva.
  - Se resolvió la semántica de eliminación lógica para esta etapa: `isActive = false`.
  - Se resolvió la profundidad del modal: lectura + acciones puntuales.
  - Se definió el set de acciones puntuales del modal, incluyendo ajuste de stock e historial de movimientos en la misma pestaña/sección.
  - Se definieron los filtros MVP del catálogo.
  - Se definió el orden por defecto del catálogo: stock crítico primero.
  - Se confirmó un resumen superior con KPIs sutiles para contexto, sin competir con el listado.
  - Se definió que el modal se controlará por query param `?product=<id>`.
  - Se definió que el detalle mostrará un resumen liviano de ventas en el MVP.
  - Se reemplazó el infinite scroll por una carga incremental controlada con botón "Cargar más" de 100 productos por página.
  - Se definió que el ajuste manual de stock registrará movimiento, pero sin motivo obligatorio en el MVP.
- Falta:
  - Nada pendiente en esta etapa.

### Stage 1 — Data and backend contract
- Estado: completed
- Avances:
  - Se inició la definición de contratos backend del módulo `/products`.
  - Se definió la regla de derivación de estado de stock para listado, detalle, KPIs y filtros.
  - Se definió que el catálogo mostrará solo productos activos por defecto.
  - Se definió el alcance de la búsqueda por texto del MVP.
  - Se definió el contenido del resumen liviano de ventas.
  - Se definió que los KPIs se calculan sobre todo el catálogo.
  - Se documentó el contrato backend inicial en `CONTRACTS.md`.
  - Se aterrizó el contrato en endpoints y DAL reales para listado, KPIs y detalle.
- Falta:
  - Nada pendiente en esta etapa.

### Stage 2 — Catalog shell and list foundation
- Estado: completed
- Avances:
  - Se creó la ruta `/products`.
  - Se implementó la shell visual del catálogo.
  - Se implementaron KPIs sutiles en cabecera.
  - Se implementó el listado inicial con filtros MVP.
  - Se implementó la carga incremental mediante botón `Cargar más`.
  - Se integró una primera versión del detalle contextual en sheet controlado por query param.
- Falta:
  - Nada pendiente en esta etapa.

### Stage 3 — Filters, search, and sorting
- Estado: completed
- Avances:
  - Se implementaron controles de búsqueda, proveedor, categoría, marca, estado de stock, actividad, estado de venta y orden.
- Falta:
  - Nada pendiente en esta etapa.

### Stage 4 — Infinite scroll behavior
- Estado: completed
- Avances:
  - Se implementó la carga incremental controlada mediante botón `Cargar más`.
  - Se fijó tamaño de lote en 100 productos por carga.
- Falta:
  - Nada pendiente en esta etapa.

### Stage 5 — Product detail modal
- Estado: in_progress
- Avances:
  - Se implementó una primera versión del detalle en sheet con resumen comercial, inventario, resumen liviano de ventas e historial de movimientos.
  - Se agregaron acciones rápidas reales para activar/desactivar y habilitar/deshabilitar venta.
  - Se agregó edición básica de datos operativos desde el detalle.
  - Se agregó ajuste manual de stock con persistencia real y refresco de movimientos.
- Falta:
  - Refinar la organización interna del detalle y su UX.

### Stage 6 — Actions and operational workflows
- Estado: in_progress
- Avances:
  - Se implementó desactivación lógica masiva de productos seleccionados.
  - Se implementaron endpoints para desactivación lógica, edición de producto y ajuste manual de stock.
  - Se agregó selección múltiple en el listado.
- Falta:
  - Completar acciones faltantes de operación avanzada si hicieran falta.

### Stage 7 — Polish, verification, and acceptance
- Estado: pending
- Avances: ninguno
- Falta:
  - Revisiones de UX, accesibilidad, estados, rendimiento y aceptación.

## Próximos pasos inmediatos

1. Iniciar Stage 1.
2. Refinar UX del detalle y de los filtros si fuera necesario.
3. Revisar si Stage 5 y Stage 6 ya pueden cerrarse.
4. Avanzar al pulido final.

## Bloqueos actuales

- Sin bloqueos funcionales de alcance para iniciar Stage 1.

## Regla de mantenimiento

Cada vez que se avance una tarea o etapa:

1. actualizar este archivo
2. cambiar estado de etapa (`pending`, `in_progress`, `completed`, `blocked`)
3. anotar qué se hizo
4. anotar qué falta
