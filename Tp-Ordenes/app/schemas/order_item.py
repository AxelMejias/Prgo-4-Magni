from pydantic import BaseModel, Field

from app.schemas.product import ProductRead


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


# Respuesta al crear una orden (sin detalle de producto)
class OrderItemRead(BaseModel):
    product_id: int
    quantity: int
    unit_price: float

    model_config = {"from_attributes": True}


# Respuesta al obtener una orden por id (con detalle de producto)
class OrderItemDetailRead(BaseModel):
    product: ProductRead
    quantity: int
    unit_price: float

    model_config = {"from_attributes": True}
