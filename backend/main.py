from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.database import create_db_and_tables
from app.core.config import settings

# Modelos existentes
from app.models import Categoria, Ingrediente, Producto, ProductoCategoria, ProductoIngrediente  # noqa: F401
# Modelos de auth (deben registrarse antes de create_all)
from app.auth.model import Usuario, Rol, UsuarioRol, RefreshToken, PasswordResetToken  # noqa: F401

from app.routers.categorias import router as categorias_router
from app.routers.ingredientes import router as ingredientes_router
from app.routers.productos import router as productos_router
from app.auth.router import router as auth_router

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(
    title="Food Store API",
    description="API REST fullstack con FastAPI + SQLModel + PostgreSQL",
    version="2.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "Error interno del servidor"})


app.include_router(auth_router)
app.include_router(categorias_router)
app.include_router(ingredientes_router)
app.include_router(productos_router)


@app.get("/", tags=["Root"])
def root():
    return {"mensaje": "Food Store API funcionando"}
