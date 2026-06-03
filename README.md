# FerreteriApp

Sistema de punto de venta y gestión de catálogo para ferreterías. Permite administrar productos, ventas, clientes y proveedores, con soporte para importación masiva de listas de precios desde archivos Excel provistos por los proveedores.

---

## Requisitos previos

- Node.js 20+
- PostgreSQL
- Cuenta de Google para OAuth
- Instancia de [n8n](https://n8n.io/) (para importación masiva de listas de precios)

---

## Configuración inicial

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd ferreteriapp
npm install
```

### 2. Variables de entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Base de datos
DATABASE_URL="postgresql://..."

# NextAuth
AUTH_TRUST_HOST="true"

# Google OAuth (desde console.cloud.google.com)
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."

# Email del primer admin (se le asigna rol ADMIN automáticamente en su primer login)
AUTH_BOOTSTRAP_ADMIN_EMAIL="tu@email.com"

# n8n — para importación masiva
N8N_NORMALIZATION_WEBHOOK_URL="https://tu-instancia-n8n/webhook/..."
N8N_INGEST_TOKEN="token-para-enviar-a-n8n"
N8N_CALLBACK_TOKEN="token-para-callbacks-de-n8n"

# URL pública de la app (usada por n8n para devolver datos normalizados)
APP_CALLBACK_BASE_URL="https://tu-dominio.com"
```

> Para desarrollo local, `APP_CALLBACK_BASE_URL` debe ser una URL pública accesible por n8n. Se puede usar [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) (`cloudflared tunnel --url http://localhost:3000`) para exponer el servidor local.

### 3. Base de datos

Aplicar las migraciones:

```bash
npx prisma migrate deploy
```

> En desarrollo se puede usar `npx prisma migrate dev` para crear migraciones nuevas.

### 4. Levantar el servidor de desarrollo

```bash
npm run dev
```

La app queda disponible en `http://localhost:3000`.

---

## Despliegue en producción

La app está pensada para desplegarse en **Vercel**. El archivo `vercel.json` ya incluye la configuración de cron necesaria.

### Variables de entorno en Vercel

Configurar las mismas variables del `.env` en el panel de Vercel (Settings → Environment Variables).

### Backups automáticos

El repositorio incluye un workflow de GitHub Actions (`.github/workflows/backup-db.yml`) que ejecuta un `pg_dump` diario y sube el resultado comprimido a **Supabase Storage**, con rotación automática de backups de más de 30 días.

Secrets necesarios en el repositorio de GitHub:

| Secret                      | Descripción                                      |
| --------------------------- | ------------------------------------------------ |
| `PRODUCTION_DATABASE_URL`   | URL de conexión a la base de datos de producción |
| `SUPABASE_URL`              | URL del proyecto Supabase                        |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key de Supabase                     |
| `SUPABASE_STORAGE_BUCKET`   | Nombre del bucket donde se guardan los backups   |

---

## Scripts útiles

```bash
npm run dev          # Servidor de desarrollo con Turbopack
npm run build        # Build de producción
npm run db:reset     # Vacía completamente la base de datos (pide confirmación)
```

---

## Funcionalidades

### Autenticación y roles

El acceso está restringido por Google OAuth. Hay tres roles:

- **INACTIVE** — Usuario registrado pero sin acceso. Es el estado por defecto al crearse una cuenta.
- **ACTIVE** — Acceso completo a la operación diaria (ventas, productos, clientes, proveedores).
- **ADMIN** — Mismo acceso que ACTIVE más la gestión de usuarios.

El primer usuario en loguearse con el email configurado en `AUTH_BOOTSTRAP_ADMIN_EMAIL` recibe el rol ADMIN automáticamente.

---

### Dashboard

Vista principal con métricas del negocio:

- **KPIs**: ingresos del día, cantidad de ventas del día e ingresos del mes.
- **Gráfico de ventas**: evolución de ingresos con vista de 7 o 30 días.
- **Distribución de stock**: gráfico de torta con la proporción de productos en stock normal, stock bajo, sin stock y sin control de stock.
- **Productos a reponer**: listado de productos que están por debajo de su stock mínimo configurado, con acceso directo al detalle de cada uno.
- **Estado de cargas masivas**: widget que muestra el progreso de las importaciones de listas de precios en tiempo real, con notificaciones al completarse o fallar.

---

### Productos

Catálogo completo de productos con:

- **Búsqueda y filtros**: por nombre/código, proveedor, estado de stock (normal, bajo, sin stock, sin control) y estado de activación.
- **Carga por bloques**: los productos se cargan en bloques con un botón "Cargar más", sin paginación numerada.
- **Detalle del producto**: sheet lateral con toda la información, precio de costo y venta, stock actual, código de barras y proveedor. Permite editar precios, ajustar stock manualmente y activar/desactivar el producto para la venta.
- **Eliminación con retención**: los productos eliminados tienen un período de gracia de 30 días antes de borrarse definitivamente, durante los cuales se pueden restaurar.
- **Importación masiva**: carga de productos desde archivos Excel (.xlsx, .xls, .csv) provistos por los proveedores. El proceso es asíncrono vía n8n y puede incluir múltiples proveedores en una sola operación.
- **Carga manual**: formulario para agregar productos uno por uno, con posibilidad de definir stock inicial.

#### Control de stock

El sistema maneja tres estados:

- **Con stock**: número conocido, se descuenta en cada venta y limita la cantidad vendible.
- **Sin stock (0)**: agotado, no se puede vender.
- **Sin control**: no se lleva registro de stock — siempre vendible sin restricción. Es el estado por defecto de los productos importados desde listas de precios.

---

### Ventas

Punto de venta simple y directo:

- **Búsqueda de productos**: por nombre o código, con indicación de stock disponible.
- **Carrito**: lista de productos seleccionados con control de cantidades. Muestra subtotales y total en tiempo real.
- **Clientes**: se puede asociar la venta a un cliente existente, crear uno nuevo en el momento, o registrar la venta como "Consumidor Final".
- **Confirmación**: al emitir el ticket se descuenta el stock de todos los productos involucrados y se registra el movimiento.

El historial de ventas permite buscar por número de ticket o nombre de cliente, filtrar por rango de fechas, y ver el detalle completo de cada venta con sus ítems.

---

### Clientes

Directorio de clientes con nombre, apellido, email, teléfono y dirección. Permite crear, editar, desactivar y reactivar clientes. Los clientes desactivados quedan ocultos en la búsqueda pero se mantienen en la base de datos para no afectar el historial de ventas.

---

### Proveedores

Registro de proveedores con datos de contacto y notas. Permite crear, editar, desactivar y reactivar proveedores. Al desactivar un proveedor se oculta de los formularios de carga pero se conserva toda su información y productos.

---

### Administración de usuarios

Exclusivo para el rol ADMIN. Muestra todos los usuarios registrados con sus roles actuales y permite cambiarlos. Es el mecanismo para dar o quitar acceso a los colaboradores.

---

## Integración con n8n

La importación masiva de listas de precios depende de un workflow de n8n que se encarga de:

1. Recibir los archivos Excel desde la app.
2. Normalizar y estructurar los datos del proveedor.
3. Devolver los productos procesados a la app mediante un callback HTTP.

Este workflow debe configurarse por separado en la instancia de n8n. La app maneja el estado del proceso (en progreso, completado, fallido) de forma independiente.
