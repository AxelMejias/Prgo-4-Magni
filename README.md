# 🍔 Food Store — Frontend

Aplicación web para la gestión integral de un negocio de comidas. Dos módulos en un mismo proyecto: **Tienda** (clientes) y **Administración** (staff).

## Repositorios del proyecto

Este proyecto sigue una arquitectura **polyrepo**: cada capa tiene su propio repositorio independiente.

| Capa | Repositorio | Rama |
|---|---|---|
| 🌐 Frontend (este repo) | [AxelMejias/Prgo-4-Magni](https://github.com/AxelMejias/Prgo-4-Magni) | `Integrador` |
| 🔧 Backend | [AxelMejias/Profe-Espejo](https://github.com/AxelMejias/Profe-Espejo) | `FoodStoreBack` |

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | React 19 + TypeScript + Vite |
| Estilos | Tailwind CSS v4 |
| Estado servidor | TanStack Query v5 |
| Estado cliente | Zustand v5 con middleware `persist` |
| HTTP client | Axios con interceptores JWT + `withCredentials` |
| Routing | React Router DOM v7 |
| OAuth social | Google OAuth (`@react-oauth/google`) |

---

## Arquitectura

El proyecto sigue **Feature-Sliced Design** con separación estricta entre estado del servidor (TanStack Query) y estado del cliente (Zustand):

```
pages/          → Vistas por ruta
features/       → Lógica de negocio (cart, pedido-estado, ingredientes-crud…)
entities/       → Modelos y API clients por entidad (pedido, ingrediente, direccion)
widgets/        → Componentes compuestos reutilizables
shared/         → Infraestructura compartida (axiosClient, authStore, ProtectedRoute…)
components/     → Componentes UI genéricos (Layout, Modal)
services/       → API clients legacy para categorías, ingredientes y productos
```

---

## Requisitos previos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 18+ |
| npm | 9+ |

El backend debe estar corriendo en `http://localhost:8000`.

---

## Instalación y setup

```bash
# 1. Clonar el repositorio
git clone https://github.com/AxelMejias/Prgo-4-Magni.git
cd Prgo-4-Magni

# 2. Instalar dependencias
npm install

# 3. Iniciar en modo desarrollo
npm run dev
```

El frontend queda disponible en: http://localhost:5173

---

## Módulos

### 🛍️ Módulo Store (Cliente)

Accesible para usuarios con rol `CLIENT`.

| Ruta | Descripción |
|---|---|
| `/tienda` | Catálogo de productos con búsqueda y paginación |
| `/carrito` | Carrito de compras (persistido en localStorage) |
| `/checkout` | Confirmación de pedido: dirección, forma de pago y notas |
| `/mis-pedidos` | Listado de pedidos propios con filtro por estado |
| `/mis-pedidos/:id` | Detalle del pedido con historial de estados |
| `/mis-direcciones` | CRUD de direcciones de entrega |

**Estado del carrito** — Zustand con middleware `persist`:
- Persiste en `localStorage` bajo la clave `cart-storage`
- Snapshot de nombre y precio al agregar el producto
- Se limpia automáticamente al confirmar el pedido

### 🔧 Módulo Administración (Staff)

| Ruta | Roles | Descripción |
|---|---|---|
| `/categorias` | ADMIN | CRUD de categorías jerárquicas |
| `/ingredientes` | ADMIN, STOCK | CRUD de ingredientes con filtros |
| `/productos` | ADMIN, STOCK | CRUD de productos con stock y disponibilidad |
| `/productos/:id` | ADMIN, STOCK | Detalle y edición de producto |
| `/admin/pedidos` | ADMIN, PEDIDOS | Panel de pedidos: avanzar estados del FSM |
| `/admin/pedidos/:id` | ADMIN, PEDIDOS | Detalle y transición de estado del pedido |
| `/admin/usuarios` | ADMIN | Gestión de usuarios: lista, asignación/remoción de roles, baja lógica |

**Pantalla de Pedidos (Caja/Empleado):**
- Rol `ADMIN`: puede hacer todas las transiciones del FSM y cancelar desde cualquier estado
- Rol `PEDIDOS`: puede avanzar el flujo principal (CONFIRMADO → EN_PREP → EN_CAMINO → ENTREGADO) y cancelar

---

## Autenticación

### Cookie HTTPOnly

El backend setea el `access_token` como cookie HTTPOnly en cada login/refresh. El axiosClient envía la cookie automáticamente en cada request gracias a `withCredentials: true`.

### Flujo de tokens

1. Login → backend retorna `access_token` + `refresh_token` en el body Y setea cookie HTTPOnly
2. `access_token` se guarda en Zustand (`authStore`)
3. El interceptor de Axios agrega `Authorization: Bearer {token}` en cada request
4. Si la respuesta es `401`, el interceptor intenta renovar con el `refresh_token`
5. Si el refresh falla → logout automático y redirección a `/login`

### Protección de rutas

`ProtectedRoute` verifica autenticación y opcionalmente los roles requeridos:

```tsx
// Solo autenticados
<Route element={<ProtectedRoute />}>...</Route>

// Solo ADMIN
<Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>...</Route>

// ADMIN o PEDIDOS
<Route element={<ProtectedRoute allowedRoles={["ADMIN", "PEDIDOS"]} />}>...</Route>
```

---

## Estado del servidor — TanStack Query

Ejemplos de implementación en el proyecto:

```tsx
// useQuery — listado de pedidos
const { data, isLoading } = useQuery({
  queryKey: ["mis-pedidos", page, estadoParam],
  queryFn: () => pedidoApi.getAll({ page, size: 10, estado_codigo: estadoParam }),
});

// useMutation — avanzar estado del pedido
const avanzarMutation = useMutation({
  mutationFn: ({ estado_hacia, motivo }) =>
    pedidoApi.avanzarEstado(pedidoId, { estado_hacia, motivo }),
  onSuccess: () => {
    // Invalidar caché para refrescar datos
    queryClient.invalidateQueries({ queryKey: ["pedidos"] });
  },
});
```

---

## Máquina de estados de pedidos (FSM)

```
PENDIENTE → CONFIRMADO → EN_PREP → EN_CAMINO → ENTREGADO
          ↘            ↘         ↘
                          CANCELADO
```

La lógica del FSM está en `src/features/pedido-estado/lib/fsm.ts` y determina qué transiciones son válidas según el estado actual y el rol del usuario.

| Estado | Color UI |
|---|---|
| PENDIENTE | Amber |
| CONFIRMADO | Blue |
| EN_PREP | Cyan |
| EN_CAMINO | Violet |
| ENTREGADO | Green |
| CANCELADO | Red |

---

## Estructura del proyecto

```
src/
├── App.tsx                      # Configuración de rutas
├── main.tsx                     # Entry point + GoogleOAuthProvider
├── index.css                    # Tema Tailwind (tokens de color, fuentes)
├── components/
│   ├── Layout.tsx               # Sidebar con nav filtrada por rol
│   └── Modal.tsx                # Modal genérico reutilizable
├── entities/
│   ├── direccion/
│   │   ├── api.ts               # CRUD direcciones de entrega
│   │   └── model.ts
│   ├── ingrediente/
│   │   ├── api.ts
│   │   └── model.ts
│   └── pedido/
│       ├── api.ts               # getAll, getById, create, avanzar, cancelar
│       └── model.ts             # tipos: Pedido, DetallePedido, EstadoCodigo…
├── features/
│   ├── cart/
│   │   └── model/cartStore.ts   # Zustand + persist (localStorage)
│   ├── ingredientes-crud/
│   │   └── ui/IngredienteModal.tsx
│   ├── ingredientes-filter/
│   │   └── ui/FilterBar.tsx
│   └── pedido-estado/
│       ├── lib/fsm.ts           # Mapa de transiciones válidas por rol
│       └── ui/
│           ├── EstadoBadge.tsx
│           └── HistorialList.tsx
├── pages/
│   ├── LoginPage.tsx
│   ├── ForgotPasswordPage.tsx
│   ├── ResetPasswordPage.tsx
│   ├── HomeStorePage.tsx        # Catálogo con búsqueda y paginación
│   ├── CarritoPage.tsx          # Vista del carrito
│   ├── CheckoutPage.tsx         # Confirmar pedido (dirección + forma de pago)
│   ├── MisPedidosPage.tsx       # Listado de pedidos del cliente
│   ├── MisDireccionesPage.tsx   # CRUD de direcciones de entrega
│   ├── PedidoDetallePage.tsx    # Detalle + transiciones FSM
│   ├── AdminPedidosPage.tsx     # Panel staff: gestión de pedidos
│   ├── AdminUsuariosPage.tsx    # Panel ADMIN: gestión de usuarios y roles
│   ├── CategoriasPage.tsx
│   ├── IngredientesPage.tsx
│   ├── ProductosPage.tsx
│   └── ProductoDetallePage.tsx
├── services/
│   └── api.ts                   # API clients para categorías, ingredientes, productos
├── shared/
│   ├── api/
│   │   ├── axiosClient.ts       # Instancia Axios + interceptores + withCredentials
│   │   └── authApi.ts           # login, register, logout, getMe, googleLogin…
│   ├── lib/
│   │   └── format.ts            # formatARS, formatDateTime, toNumber
│   ├── store/
│   │   └── authStore.ts         # Zustand: accessToken, refreshToken, user, hasRole
│   ├── types/
│   │   └── auth.ts              # User, TokenResponse, LoginRequest…
│   └── ui/
│       └── ProtectedRoute.tsx   # Guard de rutas por autenticación y rol
├── types/
│   └── index.ts                 # Tipos compartidos: Categoria, Producto, Ingrediente…
└── widgets/
    ├── cart-icon/
    │   └── ui/CartIcon.tsx      # Ícono del carrito con badge de cantidad
    └── ingredientes-table/
        └── ui/IngredientesTable.tsx
```

---

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:8000
```

Si no se define, el cliente usa `http://localhost:8000` por defecto.

---

## Tests

El proyecto usa **Vitest** con jsdom y `@testing-library/react`. Los tests corren sin servidor ni navegador real.

### Cobertura

| Archivo de test | Módulo | Tests |
|---|---|---|
| `src/features/pedido-estado/lib/fsm.test.ts` | `fsm.ts` | transiciones staff/cliente, `getNextStates`, `requiereMotivo`, labels |
| `src/shared/lib/format.test.ts` | `format.ts` | `toNumber`, `formatARS`, `formatDateTime` |
| `src/features/cart/model/cartStore.test.ts` | `cartStore.ts` | add/remove/update/clear, `totalItems`, `subtotal` |
| `src/shared/store/authStore.test.ts` | `authStore.ts` | login, logout, `setTokens`, `hasRole` |

### Correr los tests

```bash
# Correr todos los tests una vez
npm run test

# Modo watch (re-corre al guardar)
npm run test:watch

# Con reporte de cobertura
npm run test:coverage
```

---

## Comandos de referencia rápida

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview

# Tests
npm run test
```

---

## Credenciales de acceso

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | admin@foodstore.com | Admin1234! |
| Gestor de Pedidos (Cocina) | cocina@foodstore.com | Cocina1234! |
| Gestor de Stock | stock@foodstore.com | Stock1234! |

> Los usuarios que se registran reciben el rol `CLIENT` automáticamente.
> Las cuentas de staff se crean automáticamente con el seed del backend.

---

## Changelog

### 24/05/2026 — Parcial 2

---

#### Nueva página: Gestión de Usuarios (`/admin/usuarios`)

Página exclusiva para el rol `ADMIN`. Implementa el panel de administración de usuarios que el backend ya tenía completo pero no tenía interfaz.

- Tabla paginada de usuarios con avatar de iniciales, nombre, email, roles como badges de colores y fecha de registro
- Filtro por rol: tabs "Todos / Admin / Pedidos / Stock / Clientes"
- Modal de gestión al hacer clic en "Gestionar →":
  - Información del usuario (ID, email, celular, fecha de registro)
  - Roles actuales con botón "×" para quitar cada uno en tiempo real
  - Selector de "Asignar rol" que solo muestra los roles que el usuario aún no tiene
  - Zona de peligro: baja lógica con confirmación en dos pasos
- Usuarios dados de baja se muestran con opacidad reducida y etiqueta "· Baja"
- Archivos nuevos: `pages/AdminUsuariosPage.tsx`
- Archivos modificados: `App.tsx` (ruta `/admin/usuarios`), `Layout.tsx` (nav item + breadcrumb), `services/api.ts` (adminApi + tipos)

---

#### Módulo Tienda — `HomeStorePage`

| Cambio | Descripción |
|---|---|
| Búsqueda en tiempo real | Debounce de 400 ms — el catálogo se filtra mientras se escribe, sin necesidad de presionar "Buscar" |
| Modal de detalle de producto | Clic en cualquier card abre un modal con descripción completa, categorías (pills), lista de ingredientes con cantidades y botón "Agregar al carrito" |
| Stock visible en cards | Cada card muestra las unidades disponibles: texto gris normal, naranja con `¡Solo X!` cuando quedan ≤3, rojo "Sin stock" y botón deshabilitado cuando es 0 |
| Toast notification | Al agregar un producto (desde card o modal), aparece un toast en la esquina inferior derecha con el nombre del producto — desaparece automáticamente |
| Paginación estable | Grid con `min-h` fijo — la barra de paginación ya no salta de posición entre páginas con distinta cantidad de productos |
| Estilos de paginación | Botón activo con color brand, botón deshabilitado en gris claro |

---

#### Módulo Checkout — `CheckoutPage`

| Cambio | Descripción |
|---|---|
| Selector de tipo de entrega | Nueva sección con dos opciones: "Retiro en local" (sin costo adicional) y "Envío a domicilio" (+$50) |
| Dirección condicional | La sección de selección de dirección solo aparece cuando se elige "Envío a domicilio" |
| Costo de envío correcto | El resumen lateral muestra "$0 — Gratis" para retiro y "+$50" para domicilio, reflejando el mismo comportamiento del backend |
| Orden de formas de pago | Transferencia bancaria aparece primero, Efectivo segundo (ordenados por código) |

---

#### Módulo Productos — `ProductoDetallePage`

| Cambio | Descripción |
|---|---|
| Panel de Stock | Nueva sección "Stock y Disponibilidad" visible para ADMIN y STOCK: input numérico para unidades + toggle Activo/Inactivo + botón "Guardar cambios" con feedback "✓ Guardado" |
| Badges en header | El encabezado del producto ahora muestra el estado (Activo/Inactivo) con color dinámico y el stock actual (`Stock: X u.`) |

---

#### Infraestructura y tipos

| Archivo | Cambio |
|---|---|
| `services/api.ts` | Agregados tipos `UsuarioAdmin`, `PaginatedUsuariosAdmin`; helper `delJson<T>` para DELETE con body JSON; objeto `adminApi` con `getUsuarios`, `asignarRol`, `removerRol`, `deleteUsuario` |
| `types/index.ts` | Agregados `stock_cantidad: number` y `disponible: boolean` a `ProductoDetalle`; `stock_cantidad?: number` y `disponible?: boolean` a `ProductoUpdate` |
| `App.tsx` | Ruta `/admin/usuarios` bajo `ProtectedRoute allowedRoles={["ADMIN"]}` |
| `Layout.tsx` | Ítem "👥 Usuarios" en sidebar (solo ADMIN); entrada `usuarios` en `breadcrumbMap` |