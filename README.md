# 🍔 Food Store — Frontend

Aplicación web para la gestión integral de un negocio de comidas. Dos experiencias en un mismo proyecto: **Tienda** (catálogo público + clientes) y **Administración** (staff).

## Repositorios del proyecto

Arquitectura **polyrepo**: backend y frontend en repositorios separados.

| Capa | Repositorio | Rama |
|---|---|---|
| 🌐 Frontend (este repo) | [AxelMejias/Prgo-4-Magni](https://github.com/AxelMejias/Prgo-4-Magni) | `Integrador` |
| 🔧 Backend | [AxelMejias/Profe-Espejo](https://github.com/AxelMejias/Profe-Espejo) | `FoodStoreBack` |

🎥 **Video demostración https://www.youtube.com/watch?v=ymQGzmx5ZYk

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | React 19 + TypeScript + Vite |
| Estilos | Tailwind CSS v4 |
| Estado servidor | TanStack Query v5 |
| Estado cliente | Zustand v5 (5 stores, con middleware `persist`) |
| Formularios | TanStack Form |
| HTTP client | Axios con interceptores JWT + `withCredentials` |
| Routing | React Router DOM v7 |
| Gráficos | Recharts v3 |
| Tiempo real | WebSocket nativo (hooks `useOrderStatus` / `useAdminOrdersFeed`) |
| Pagos | `@mercadopago/sdk-react` |
| OAuth social | Google OAuth (`@react-oauth/google`) |

---

## Requisitos previos

| Herramienta | Versión |
|---|---|
| Node.js | 18+ |
| npm | 9+ |

El **backend debe estar corriendo** en `http://localhost:8000` (ver el README del backend).

---

## 🚀 Setup paso a paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/AxelMejias/Prgo-4-Magni.git
cd Prgo-4-Magni
git checkout Integrador
```

### 2. Configurar variables de entorno

Copiá `.env.example` a `.env`:

```bash
cp .env.example .env
```

```dotenv
VITE_API_URL=http://localhost:8000
# Opcional: solo para el login con Google (mismo Client ID público que usa el backend)
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

> Sin `.env`, `VITE_API_URL` usa `http://localhost:8000` por defecto. El login con email/contraseña funciona sin `VITE_GOOGLE_CLIENT_ID`; solo el botón de Google lo requiere.

### 3. Instalar dependencias e iniciar

```bash
npm install
npm run dev
```

Disponible en: **http://localhost:5173**

---

## Cómo probarlo

Podés navegar el catálogo **sin iniciar sesión**. Para el resto, usá las cuentas sembradas por el backend:

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | `admin@foodstore.com` | `Admin1234!` |
| Gestor de Pedidos (Cocina) | `cocina@foodstore.com` | `Cocina1234!` |
| Gestor de Stock | `stock@foodstore.com` | `Stock1234!` |
| Cliente (demo) | `cliente@foodstore.com` | `Cliente1234!` |

---

## Rutas

### Públicas / Cliente

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | público | Redirige a `/store` (anónimo) o al destino por rol (logueado) |
| `/store` | **público** | Catálogo de productos, navegable sin login |
| `/login`, `/forgot-password`, `/reset-password` | público | Autenticación |
| `/carrito` | CLIENT | Carrito (persistido en localStorage) |
| `/checkout` | CLIENT | Confirmar pedido: dirección, forma de pago, notas |
| `/mis-pedidos`, `/mis-pedidos/:id` | CLIENT | Pedidos propios + detalle con seguimiento en tiempo real |
| `/mis-direcciones` | CLIENT | CRUD de direcciones de entrega |
| `/pedido-exitoso` | CLIENT | Confirmación post-checkout |

### Administración (staff)

| Ruta | Roles | Descripción |
|---|---|---|
| `/admin/dashboard` | ADMIN | Estadísticas: KPIs + 4 gráficos (Recharts) |
| `/admin/pedidos`, `/admin/pedidos/:id` | ADMIN, PEDIDOS | Panel de pedidos + transiciones del FSM en tiempo real |
| `/admin/usuarios` | ADMIN | Gestión de usuarios y roles |
| `/categorias` | ADMIN | CRUD de categorías jerárquicas |
| `/ingredientes` | ADMIN, STOCK | CRUD de insumos con stock y alérgenos |
| `/productos`, `/productos/:id` | ADMIN, STOCK | CRUD de productos |

---

## Estado del cliente — 5 stores Zustand

| Store | Responsabilidad |
|---|---|
| `authStore` | Tokens, usuario, `hasRole` |
| `cartStore` | Carrito (middleware `persist` → `localStorage`) |
| `uiStore` | Estado de UI (toasts, modales) |
| `wsStore` | Estado de la conexión WebSocket (badge "Sin conexión en tiempo real") |
| `checkoutStore` | Datos del checkout en curso (persistido para sobrevivir al redirect de MercadoPago) |

---

## Tiempo real (WebSocket)

El front se conecta a los canales del backend con `?token=<access_token>`:
- **Cliente** (`/ws/pedidos`): el detalle del pedido se actualiza solo cuando el staff cambia su estado.
- **Staff** (`/ws/admin/pedidos`): el panel recibe los cambios de todos los pedidos.

Hooks: `useOrderStatus` (cliente) y `useAdminOrdersFeed` (staff). Ante un cierre `4001` (token expirado) refresca el token y reconecta. El `WsStatusBadge` muestra "Sin conexión en tiempo real" si el socket cae.

---

## Máquina de estados de pedidos (FSM v7)

```
PENDIENTE → CONFIRMADO → EN_PREP → ENTREGADO
    │            │           │
    └────────────┴───────────┴──────────→ CANCELADO
```

Lógica en `src/features/pedido-estado/lib/fsm.ts` (transiciones válidas según estado y rol).

| Estado | Color UI |
|---|---|
| PENDIENTE | Amber |
| CONFIRMADO | Blue |
| EN_PREP | Cyan |
| ENTREGADO | Green |
| CANCELADO | Red |

---

## Pagos (MercadoPago Checkout PRO)

En el checkout, al elegir **MercadoPago** se redirige al checkout de MP y, al volver, el pedido se confirma automáticamente. Para probarlo el backend necesita un `MP_ACCESS_TOKEN` de sandbox (ver README del backend). Las formas **Efectivo** y **Transferencia** no requieren ninguna configuración extra.

---

## Stock en la tienda

El stock disponible de un producto se **deriva de sus insumos** (no es un número editable). En el catálogo y en el panel se muestra como "En stock / Sin stock" según el stock real de los insumos de la receta.

---

## Autenticación

- Login → el backend devuelve `access_token` + `refresh_token` y setea una cookie HTTPOnly.
- El interceptor de Axios agrega `Authorization: Bearer <token>` y, ante un `401` de una sesión real, intenta refrescar; si falla, hace logout. El usuario **anónimo** no es redirigido (el catálogo es público).
- `ProtectedRoute` protege rutas por autenticación y, opcionalmente, por rol.

---

## Tests

**Vitest** + jsdom + `@testing-library/react` (sin servidor ni navegador real).

```bash
npm run test            # una vez
npm run test:watch      # modo watch
npm run test:coverage   # con cobertura
```

---

## Comandos de referencia rápida

```bash
npm run dev        # desarrollo (http://localhost:5173)
npm run build      # build de producción (tsc -b + vite build)
npm run preview    # preview del build
npm run test       # tests
```
