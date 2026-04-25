# Parcial 1 - Programación IV

Aplicación Fullstack desarrollada para el Primer Parcial de Programación IV (UTN - Tecnicatura Universitaria en Programación).

## Descripción

API REST de gestión de productos con categorías e ingredientes. Permite realizar operaciones CRUD completas con persistencia en PostgreSQL, relaciones N:N entre entidades y validaciones automáticas.

## Tecnologías

### Backend
- **FastAPI** - Framework web
- **SQLModel** - ORM con tipado (SQLAlchemy + Pydantic)
- **PostgreSQL** - Base de datos
- **Uvicorn** - Servidor ASGI
- **Python-dotenv** - Variables de entorno

### Frontend
- **React + TypeScript** - Interfaz de usuario
- **Vite** - Bundler
- **TanStack Query** - Server state
- **React Router DOM** - Navegación
- **Tailwind CSS 4** - Estilos

## Estructura del Proyecto

```
PArcial 1/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   └── app/
│       ├── models/        # SQLModel - tablas DB
│       ├── schemas/       # Pydantic - input/output
│       ├── services/      # Lógica de negocio
│       ├── routers/       # Endpoints HTTP
│       └── uow/           # Unit of Work
└── frontend/              # (a cargo de Nico)
```

## Cómo ejecutar el Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

La API estará disponible en: http://localhost:8000  
Documentación Swagger: http://localhost:8000/docs

## Integrantes

- **Axel** - Backend
- **Nico** - Frontend
- **Loe** - Video

## Video de presentación

> Link al video (completar al entregar)
