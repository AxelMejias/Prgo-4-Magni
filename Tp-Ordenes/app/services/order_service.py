from fastapi import HTTPException

from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.schemas.order import OrderCreate
from app.uow.unit_of_work import UnitOfWork


def create_order(payload: OrderCreate) -> Order:
    """
    Crea una orden con sus items.
    - Verifica que cada producto exista.
    - Calcula el total automáticamente (quantity * price por producto).
    - Guarda todo en una sola transacción (Unit of Work).
    """
    with UnitOfWork() as uow:
        order = Order(user_email=payload.user_email, total_amount=0.0)
        uow.session.add(order)
        uow.session.flush()  # genera el id de la orden sin commitear

        total = 0.0

        for item_data in payload.items:
            product = uow.session.get(Product, item_data.product_id)
            if not product:
                raise HTTPException(status_code=404, detail="Producto no encontrado")

            unit_price = product.price
            total += unit_price * item_data.quantity

            order_item = OrderItem(
                order_id=order.id,
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=unit_price,
            )
            uow.session.add(order_item)

        order.total_amount = total
        uow.session.add(order)
        uow.session.flush()

        # Refrescar para que las relaciones estén cargadas antes de cerrar sesión
        uow.session.refresh(order)
        for item in order.items:
            uow.session.refresh(item)

        return order
