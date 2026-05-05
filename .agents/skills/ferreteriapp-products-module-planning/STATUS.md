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
- Estado: completed
- Avances:
  - Se implementó una primera versión del detalle en sheet con resumen comercial, inventario, resumen liviano de ventas e historial de movimientos.
  - Se agregaron acciones rápidas reales para activar/desactivar y habilitar/deshabilitar venta.
  - Se agregó edición básica de datos operativos desde el detalle.
  - Se agregó ajuste manual de stock con persistencia real y refresco de movimientos.
  - Se enriqueció el detalle con contexto de lista vigente, metadata temporal y nota opcional en ajustes de stock.
  - Se reorganizó la UX del detalle en pestañas claras: Resumen, Inventario y Edición.
- Falta:
  - Nada pendiente en esta etapa.

### Stage 6 — Actions and operational workflows
- Estado: completed
- Avances:
  - Se implementó desactivación lógica masiva de productos seleccionados.
  - Se implementaron endpoints para desactivación lógica, edición de producto y ajuste manual de stock.
  - Se agregó selección múltiple en el listado.
- Falta:
  - Nada pendiente en esta etapa.

### Stage 7 — Polish, verification, and acceptance
- Estado: completed
- Avances:
  - Se validó la implementación actual con `npm run lint` sin errores.
  - Se auditó el alcance del MVP contra las decisiones aprobadas y se confirmó cobertura funcional de Stage 5 y Stage 6.
  - Se mejoró el feedback de selección múltiple, los estados vacíos y el CTA de carga incremental del catálogo.
  - Se agregaron ajustes de accesibilidad livianos como `aria-live` y microcopy más explícito para la carga/control del listado.
  - Se implementaron filtros de aplicación automática con debounce en campos de texto.
  - Se reforzó la tabla con un layout más robusto y una variante tipo cards para pantallas más chicas.
  - Se amplió significativamente el detail sheet para aprovechar más pantalla en desktop.
- Falta:
  - Nada pendiente en esta etapa.

## Próximos pasos inmediatos

1. Módulo `/products` MVP funcionalmente cerrado.
2. Si se continúa, el siguiente frente recomendado es hardening/post-MVP: undo/restore, mejoras de filtros avanzados, bulk actions adicionales y performance de consultas.
3. Revisar integración con futuros módulos (`/dashboard`, ventas, analítica).
4. Documentar o demostrar el módulo al usuario final.

## Bloqueos actuales

- Sin bloqueos funcionales para el MVP actual del módulo `/products`.

## Regla de mantenimiento

Cada vez que se avance una tarea o etapa:

1. actualizar este archivo
2. cambiar estado de etapa (`pending`, `in_progress`, `completed`, `blocked`)
3. anotar qué se hizo
4. anotar qué falta
