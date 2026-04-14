# Importar todos los modelos acá para que SQLAlchemy registre las tablas
# antes de cualquier llamada a create_all y resuelva los forward references
from app.models.product import Product
from app.models.order import Order
from app.models.order_item import OrderItem

__all__ = ["Product", "Order", "OrderItem"]
