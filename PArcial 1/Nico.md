# Contexto del Proyecto para el Frontend (Nico)

> Este archivo fue generado para que Claude te ayude a construir el frontend. Leé todo antes de pedirle ayuda — así Claude tiene el contexto completo del proyecto.

---

## ¿Qué es este proyecto?

Parcial 1 de Programación IV (UTN). Es una app fullstack de gestión de **Productos** con **Categorías** e **Ingredientes**. El backend ya está 100% terminado y funcionando.

**Axel hizo el backend. Vos tenés que hacer el frontend.**

---

## El Backend (lo que ya existe)

### URL base
```
http://localhost:8000
```
Documentación interactiva: `http://localhost:8000/docs`

### Tecnologías del backend
- **FastAPI** (Python) como framework
- **SQLModel** como ORM (sobre SQLAlchemy + Pydantic)
- **PostgreSQL** como base de datos
- **Uvicorn** como servidor

### Cómo arrancarlo
```bash
cd backend
.venv\Scripts\activate
uvicorn main:app --reload
```

---

## Entidades y Relaciones

### Relaciones
- **Producto ↔ Categoría**: N:N (un producto puede tener varias categorías, una categoría puede tener varios productos)
- **Producto ↔ Ingrediente**: N:N (un producto puede tener varios ingredientes con su cantidad, un ingrediente puede estar en varios productos)

### Tablas en la DB
- `categoria`
- `ingrediente`
- `producto`
- `producto_categoria` (tabla intermedia N:N)
- `producto_ingrediente` (tabla intermedia N:N, tiene campo `cantidad`)

---

## Endpoints disponibles

### Categorías — `/categorias`

| Método | URL | Descripción | Body |
|--------|-----|-------------|------|
| GET | `/categorias/` | Listar (con filtro `nombre`, paginación `offset`/`limit`) | — |
| GET | `/categorias/{id}` | Obtener por ID | — |
| POST | `/categorias/` | Crear | `{ "nombre": "string", "descripcion": "string" }` |
| PUT | `/categorias/{id}` | Actualizar | `{ "nombre": "string", "descripcion": "string" }` |
| DELETE | `/categorias/{id}` | Eliminar | — |

**Response de categoría:**
```json
{
  "id": 1,
  "nombre": "Bebidas",
  "descripcion": "Bebidas frías y calientes"
}
```

---

### Ingredientes — `/ingredientes`

| Método | URL | Descripción | Body |
|--------|-----|-------------|------|
| GET | `/ingredientes/` | Listar (filtros: `nombre`, `unidad_medida`, paginación) | — |
| GET | `/ingredientes/{id}` | Obtener por ID | — |
| POST | `/ingredientes/` | Crear | `{ "nombre": "string", "unidad_medida": "string" }` |
| PUT | `/ingredientes/{id}` | Actualizar | `{ "nombre": "string", "unidad_medida": "string" }` |
| DELETE | `/ingredientes/{id}` | Eliminar | — |

**Response de ingrediente:**
```json
{
  "id": 1,
  "nombre": "Harina",
  "unidad_medida": "kg"
}
```

---

### Productos — `/productos`

| Método | URL | Descripción | Body |
|--------|-----|-------------|------|
| GET | `/productos/` | Listar (filtros: `nombre`, `precio_min`, `precio_max`, `categoria_id`, paginación) | — |
| GET | `/productos/{id}` | Obtener por ID con relaciones completas | — |
| POST | `/productos/` | Crear con categorías e ingredientes | ver abajo |
| PUT | `/productos/{id}` | Actualizar campos básicos | `{ "nombre": "string", "descripcion": "string", "precio": 0 }` |
| DELETE | `/productos/{id}` | Eliminar | — |

**Body para crear producto:**
```json
{
  "nombre": "Pan",
  "descripcion": "Pan artesanal",
  "precio": 500,
  "categoria_ids": [1, 2],
  "ingredientes": [
    { "ingrediente_id": 1, "cantidad": 0.5 },
    { "ingrediente_id": 2, "cantidad": 0.2 }
  ]
}
```

**Response completo de producto (GET por ID o POST):**
```json
{
  "id": 1,
  "nombre": "Pan",
  "descripcion": "Pan artesanal",
  "precio": 500,
  "categorias": [
    { "id": 1, "nombre": "Bebidas", "descripcion": "Bebidas frías y calientes" }
  ],
  "ingredientes": [
    { "id": 1, "nombre": "Harina", "unidad_medida": "kg", "cantidad": 0.5 }
  ]
}
```

**Response simplificado de producto (GET listado):**
```json
{
  "id": 1,
  "nombre": "Pan",
  "descripcion": "Pan artesanal",
  "precio": 500
}
```

### Códigos de estado HTTP que usa el backend
- `200` — OK (GET, PUT)
- `201` — Creado (POST)
- `204` — Sin contenido (DELETE)
- `404` — No encontrado
- `409` — Conflicto (nombre duplicado)
- `422` — Error de validación (Pydantic)

---

## Lo que tenés que construir (Frontend)

### Tecnologías requeridas por el parcial
- **React + TypeScript** con **Vite**
- **TanStack Query** (`@tanstack/react-query`) para server state
- **React Router DOM** para navegación
- **Tailwind CSS 4** para estilos
- **pnpm** como gestor de paquetes (recomendado)

### Páginas requeridas
1. **`/categorias`** — Tabla con listado, botón crear, editar y eliminar. Modal con formulario de alta/edición.
2. **`/ingredientes`** — Tabla con listado, botón crear, editar y eliminar. Modal con formulario de alta/edición.
3. **`/productos`** — Tabla con listado, botón crear, editar y eliminar. Modal con formulario de alta/edición (debe permitir seleccionar categorías e ingredientes con cantidades).
4. **`/productos/:id`** — Detalle del producto mostrando sus categorías e ingredientes (ruta dinámica con `useParams`).

### Estructura de carpetas sugerida para el frontend
```
frontend/
├── src/
│   ├── components/       # Componentes reutilizables (Modal, Table, Button, etc.)
│   ├── pages/            # Páginas (CategoriasPage, IngredientesPage, ProductosPage, ProductoDetalle)
│   ├── services/         # Funciones fetch a la API (api.ts o categorias.ts, etc.)
│   ├── types/            # Interfaces TypeScript
│   └── main.tsx
```

### Interfaces TypeScript que vas a necesitar
```typescript
// types/index.ts

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Ingrediente {
  id: number;
  nombre: string;
  unidad_medida: string;
}

export interface IngredienteEnProducto {
  id: number;
  nombre: string;
  unidad_medida: string;
  cantidad: number;
}

export interface ProductoListItem {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
}

export interface ProductoDetalle {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  categorias: Categoria[];
  ingredientes: IngredienteEnProducto[];
}

export interface IngredienteInput {
  ingrediente_id: number;
  cantidad: number;
}

export interface ProductoCreate {
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria_ids: number[];
  ingredientes: IngredienteInput[];
}
```

### Ejemplo de cómo conectarse al backend con TanStack Query
```typescript
// Listar categorías
const { data, isLoading, error } = useQuery({
  queryKey: ['categorias'],
  queryFn: () => fetch('http://localhost:8000/categorias/').then(r => r.json())
});

// Crear categoría
const mutation = useMutation({
  mutationFn: (data: CategoriaCreate) =>
    fetch('http://localhost:8000/categorias/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['categorias'] });
  }
});
```

---

## CORS
El backend ya tiene CORS configurado para:
- `http://localhost:5173` (Vite por defecto)
- `http://localhost:3000`

No necesitás configurar nada extra.

---

## Resumen para pedirle ayuda a Claude

Cuando le pidas ayuda a Claude, decile esto:

> "Estoy haciendo el frontend de un parcial universitario. El backend con FastAPI ya está hecho y corriendo en localhost:8000. Necesito hacer el frontend en React + TypeScript + Vite con TanStack Query, React Router DOM y Tailwind CSS 4. Las entidades son Categoría, Ingrediente y Producto (con relaciones N:N). Tengo un archivo Nico.md con todos los endpoints y tipos. [pegá el contenido de este archivo]"
