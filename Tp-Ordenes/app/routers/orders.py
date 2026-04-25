from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, func, select

from app.database import get_session
from app.models.order import Order
from app.schemas.order import OrderCreate, OrderDetailRead, OrderPaginatedRead, OrderRead
from app.services.order_service import create_order

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderRead, status_code=201)
def post_order(payload: OrderCreate):
    order = create_order(payload)
    return order


@router.get("/{order_id}", response_model=OrderDetailRead)
def get_order(order_id: int, session: Session = Depends(get_session)):
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return order


@router.get("", response_model=OrderPaginatedRead)
def list_orders(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    session: Session = Depends(get_session),
):
    total = session.exec(select(func.count()).select_from(Order)).one()
    orders = session.exec(select(Order).offset(offset).limit(limit)).all()
    return OrderPaginatedRead(total=total, data=list(orders))
