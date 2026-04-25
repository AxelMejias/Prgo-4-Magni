from contextlib import asynccontextmanager

from fastapi import FastAPI

import app.models  # noqa: F401 — registra todos los modelos antes de create_all
from app.database import create_db_and_tables
from app.routers.orders import router as orders_router
from app.routers.products import router as products_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="Sistema de Órdenes", lifespan=lifespan)

app.include_router(products_router)
app.include_router(orders_router)
