# Parcial 1 — Programación IV

Sistema de gestión de productos gastronómicos con categorías e ingredientes. Aplicación Fullstack construida con **FastAPI + SQLModel** en el backend y **React + TypeScript + TanStack Query** en el frontend.

---

## Video de Presentación

> **Link al video:** [https://www.youtube.com/watch?v=pc7Yp6V-ziM](https://www.youtube.com/watch?v=pc7Yp6V-ziM)

---

## Tecnologías

### Backend
- **Python 3.12+**
- **FastAPI** — framework web moderno y de alto rendimiento
- **SQLModel** — ORM con tipado estático (SQLAlchemy + Pydantic)
- **PostgreSQL** — base de datos relacional
- **Uvicorn** — servidor ASGI
- **python-dotenv** — variables de entorno

### Frontend
- **React 19 + TypeScript**
- **Vite 6** — bundler
- **TanStack Query v5** — server state management
- **React Router DOM v7** — navegación SPA
- **Tailwind CSS 4** — estilos utilitarios

---

## Arquitectura y Decisiones Técnicas

### Unit of Work (UoW)

El patrón **Unit of Work** encapsula una unidad lógica de trabajo contra la base de datos: agrupa todas las operaciones de una misma transacción bajo una única sesión y garantiza que, si algo falla en el medio, se ejecuta un `rollback` automático dejando los datos en estado consistente.

Lo aplicamos porque en operaciones como la creación de un producto hay múltiples escrituras encadenadas: se inserta el producto, luego los vínculos con categorías, luego los vínculos con ingredientes. Sin UoW, un fallo a mitad del proceso dejaría registros huérfanos en las tablas de link. Con UoW, o todo se confirma junto (`commit`) o nada se guarda.

**Decisión de diseño:** el UoW vive en la capa de servicios, no en los routers. Los routers solo reciben datos y llaman al servicio; es el servicio quien decide qué constituye una transacción. Esto mantiene los routers limpios y la lógica de negocio centralizada.

```python
# Ejemplo en producto_service.py
def create(data: ProductoCreate) -> ProductoResponse:
    with UnitOfWork() as uow:          # abre sesión
        producto = Producto(...)
        uow.productos.add(producto)
        for cat_id in data.categoria_ids:
            uow.productos.add_categoria_link(producto.id, cat_id)
        # si cualquier línea falla → rollback automático
        uow.session.flush()
        return _build_response(uow, producto)
                                       # al salir del with → commit
```

### Patrón Repository

Cada entidad tiene su propio repositorio que centraliza todas las consultas a la base de datos. El `ProductoRepository`, por ejemplo, expone métodos como `get_all`, `get_by_id`, `get_categorias`, `add_categoria_link`, etc.

Lo aplicamos para separar la lógica de acceso a datos de la lógica de negocio. Los servicios trabajan con una abstracción (`uow.productos.get_all(...)`) sin importarles si el dato viene de PostgreSQL u otro origen. Esto hace el código más testeable y más fácil de mantener.

El UoW expone los tres repositorios como propiedades: `uow.categorias`, `uow.ingredientes`, `uow.productos`.

### Auditoría de Datos

Todos los modelos (`Categoria`, `Ingrediente`, `Producto`) tienen campos de auditoría:
- `created_at` — se asigna automáticamente al crear el registro
- `updated_at` — se actualiza en cada modificación

Estos campos se exponen en todos los schemas de respuesta, permitiendo trazabilidad temporal de cada dato.

### Relación Reflexiva en Categoría

El modelo `Categoria` tiene un campo `parent_id` que referencia la misma tabla (`foreign_key="categoria.id"`). Esto permite estructurar categorías en jerarquías: una categoría "Carnes" puede tener subcategorías como "Carnes rojas" o "Aves". El endpoint `GET /categorias/{id}/subcategorias` devuelve todas las categorías hijas de una categoría padre.

---

## Estructura del Proyecto

```
Parcial1Esp/
├── backend/
│   ├── main.py                   # Entry point + CORS + lifespan
│   ├── requirements.txt
│   ├── migration.sql             # ALTER TABLE para columnas de auditoría
│   ├── .env                      # DATABASE_URL (no versionado)
│   └── app/
│       ├── models/               # SQLModel — tablas DB con relaciones N:N
│       │   ├── links.py          # ProductoCategoria, ProductoIngrediente
│       │   ├── categoria.py      # Relación reflexiva (parent_id) + auditoría
│       │   ├── ingrediente.py    # Auditoría (created_at, updated_at)
│       │   └── producto.py       # Relationship back_populates + auditoría
│       ├── schemas/              # Pydantic — contratos de entrada/salida
│       ├── services/             # Lógica de negocio + UoW
│       ├── routers/              # Endpoints HTTP con Annotated, Query, Path
│       ├── repositories/         # Acceso a datos encapsulado por entidad
│       │   ├── categoria_repository.py
│       │   ├── ingrediente_repository.py
│       │   └── producto_repository.py
│       └── uow/                  # Unit of Work (gestión de transacciones)
│
└── frontend/
    ├── src/
    │   ├── pages/                # CategoriasPage, IngredientesPage, ProductosPage, ProductoDetallePage
    │   ├── components/           # Layout, Modal
    │   ├── services/             # api.ts (cliente HTTP tipado)
    │   └── types/                # Interfaces TypeScript
    └── vite.config.ts
```

---

## Modelo de Datos

```
Categoria (parent_id → self)
    │
    └─── ProductoCategoria ─── Producto ─── ProductoIngrediente ─── Ingrediente
              (N:N)                               (N:N con cantidad)
```

- `Categoria` soporta jerarquía mediante relación reflexiva (`parent_id`)
- `ProductoIngrediente` extiende la relación N:N con el atributo `cantidad`
- Todos los modelos incluyen `created_at` y `updated_at` para auditoría

---

## Cómo Ejecutar

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Crear archivo .env con:
# DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@localhost:5432/parcial1_db

uvicorn main:app --reload
```

> Si es la primera vez con una base de datos existente, ejecutar `migration.sql` en pgAdmin para agregar las columnas de auditoría.

API disponible en: `http://localhost:8000`  
Swagger UI: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App disponible en: `http://localhost:5173`

> El backend debe estar corriendo antes de iniciar el frontend.

---

## Endpoints Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/categorias/` | Listar con filtros y paginación |
| GET | `/categorias/{id}` | Obtener categoría por ID |
| GET | `/categorias/{id}/subcategorias` | Listar subcategorías (relación reflexiva) |
| POST | `/categorias/` | Crear categoría |
| PUT | `/categorias/{id}` | Actualizar categoría |
| DELETE | `/categorias/{id}` | Eliminar categoría |
| GET | `/ingredientes/` | Listar con filtros y paginación |
| GET | `/ingredientes/{id}` | Obtener ingrediente por ID |
| POST | `/ingredientes/` | Crear ingrediente |
| PUT | `/ingredientes/{id}` | Actualizar ingrediente |
| DELETE | `/ingredientes/{id}` | Eliminar ingrediente |
| GET | `/productos/` | Listar con filtros (nombre, precio, categoría) |
| GET | `/productos/{id}` | Detalle con categorías e ingredientes |
| POST | `/productos/` | Crear con categorías e ingredientes |
| PUT | `/productos/{id}` | Actualizar producto |
| DELETE | `/productos/{id}` | Eliminar producto |
