from typing import List

from pydantic import BaseModel

from app.schemas.order_item import OrderItemCreate, OrderItemDetailRead, OrderItemRead


class OrderCreate(BaseModel):
    user_email: str
    items: List[OrderItemCreate]


# Respuesta al crear una orden
class OrderRead(BaseModel):
    id: int
    user_email: str
    total_amount: float
    items: List[OrderItemRead]

    model_config = {"from_attributes": True}


# Respuesta al obtener una orden por id (con detalle completo)
class OrderDetailRead(BaseModel):
    id: int
    user_email: str
    total_amount: float
    items: List[OrderItemDetailRead]

    model_config = {"from_attributes": True}


# Respuesta paginada
class OrderPaginatedRead(BaseModel):
    total: int
    data: List[OrderRead]
