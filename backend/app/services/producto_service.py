from typing import List, Optional
from datetime import datetime
from fastapi import HTTPException, status

from app.models.producto import Producto
from app.schemas.producto import (
    ProductoCreate,
    ProductoUpdate,
    ProductoListItem,
    ProductoResponse,
    CategoriaResponse,
    IngredienteDeProductoResponse,
)
from app.uow.unit_of_work import UnitOfWork


def _build_response(uow: UnitOfWork, producto: Producto) -> ProductoResponse:
    """Construye un ProductoResponse completo usando los repositorios del UoW."""
    categorias = uow.productos.get_categorias(producto.id)
    pi_links = uow.productos.get_ingrediente_links(producto.id)

    ingredientes_resp = []
    for pi in pi_links:
        ing = uow.ingredientes.get_by_id(pi.ingrediente_id)
        if ing:
            ingredientes_resp.append(
                IngredienteDeProductoResponse(
                    id=ing.id,
                    nombre=ing.nombre,
                    unidad_medida=ing.unidad_medida,
                    cantidad=pi.cantidad,
                )
            )

    return ProductoResponse(
        id=producto.id,
        nombre=producto.nombre,
        descripcion=producto.descripcion,
        precio=producto.precio,
        created_at=producto.created_at,
        updated_at=producto.updated_at,
        categorias=[CategoriaResponse.model_validate(c) for c in categorias],
        ingredientes=ingredientes_resp,
    )


def get_all(
    nombre: Optional[str] = None,
    precio_min: Optional[float] = None,
    precio_max: Optional[float] = None,
    categoria_id: Optional[int] = None,
    offset: int = 0,
    limit: int = 100,
) -> List[ProductoListItem]:
    with UnitOfWork() as uow:
        productos = uow.productos.get_all(
            nombre=nombre,
            precio_min=precio_min,
            precio_max=precio_max,
            categoria_id=categoria_id,
            offset=offset,
            limit=limit,
        )
        return [ProductoListItem.model_validate(p) for p in productos]


def get_by_id(producto_id: int) -> ProductoResponse:
    with UnitOfWork() as uow:
        producto = uow.productos.get_by_id(producto_id)
        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con ID {producto_id} no encontrado",
            )
        return _build_response(uow, producto)


def create(data: ProductoCreate) -> ProductoResponse:
    with UnitOfWork() as uow:
        if uow.productos.get_by_nombre(data.nombre):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ya existe un producto con el nombre '{data.nombre}'",
            )

        producto = Producto(
            nombre=data.nombre,
            descripcion=data.descripcion,
            precio=data.precio,
        )
        uow.productos.add(producto)

        for cat_id in data.categoria_ids:
            if not uow.categorias.get_by_id(cat_id):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Categoría con ID {cat_id} no encontrada",
                )
            uow.productos.add_categoria_link(producto.id, cat_id)

        for ing_input in data.ingredientes:
            if not uow.ingredientes.get_by_id(ing_input.ingrediente_id):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Ingrediente con ID {ing_input.ingrediente_id} no encontrado",
                )
            uow.productos.add_ingrediente_link(
                producto.id, ing_input.ingrediente_id, ing_input.cantidad
            )

        uow.session.flush()
        return _build_response(uow, producto)


def update(producto_id: int, data: ProductoUpdate) -> ProductoResponse:
    with UnitOfWork() as uow:
        producto = uow.productos.get_by_id(producto_id)
        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con ID {producto_id} no encontrado",
            )
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(producto, key, value)
        producto.updated_at = datetime.utcnow()
        uow.productos.add(producto)
        return _build_response(uow, producto)


def delete(producto_id: int) -> None:
    with UnitOfWork() as uow:
        producto = uow.productos.get_by_id(producto_id)
        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con ID {producto_id} no encontrado",
            )
        uow.productos.delete_categoria_links(producto_id)
        uow.productos.delete_ingrediente_links(producto_id)
        uow.productos.delete(producto)
