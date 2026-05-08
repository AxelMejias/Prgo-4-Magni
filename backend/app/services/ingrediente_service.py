import math
from datetime import datetime
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError

from app.models.ingrediente import Ingrediente
from app.schemas.ingrediente import (
    IngredienteCreate, IngredienteUpdate, IngredienteResponse, PaginatedIngredientes,
)
from app.uow.unit_of_work import UnitOfWork


def _problem(code: str, detail: str, http_status: int):
    raise HTTPException(
        status_code=http_status,
        detail={"detail": detail, "code": code, "timestamp": datetime.utcnow().isoformat()},
    )


def get_all(
    nombre: Optional[str] = None,
    es_alergeno: Optional[bool] = None,
    unidad_medida: Optional[str] = None,
    page: int = 1,
    size: int = 20,
) -> PaginatedIngredientes:
    with UnitOfWork() as uow:
        items, total = uow.ingredientes.get_all(
            nombre=nombre,
            es_alergeno=es_alergeno,
            unidad_medida=unidad_medida,
            page=page,
            size=size,
        )
        return PaginatedIngredientes(
            items=[IngredienteResponse.model_validate(i) for i in items],
            total=total,
            page=page,
            size=size,
            pages=math.ceil(total / size) if total else 0,
        )


def get_by_id(ingrediente_id: int) -> IngredienteResponse:
    with UnitOfWork() as uow:
        ingrediente = uow.ingredientes.get_by_id(ingrediente_id)
        if not ingrediente:
            _problem("INGREDIENTE_NOT_FOUND", f"Ingrediente {ingrediente_id} no encontrado", status.HTTP_404_NOT_FOUND)
        return IngredienteResponse.model_validate(ingrediente)


def create(data: IngredienteCreate) -> IngredienteResponse:
    with UnitOfWork() as uow:
        if uow.ingredientes.get_by_nombre_any(data.nombre):
            _problem("NOMBRE_CONFLICT", f"Ya existe un ingrediente con el nombre '{data.nombre}'", status.HTTP_409_CONFLICT)
        try:
            ingrediente = Ingrediente(**data.model_dump())
            uow.ingredientes.add(ingrediente)
            return IngredienteResponse.model_validate(ingrediente)
        except IntegrityError:
            _problem("NOMBRE_CONFLICT", f"Ya existe un ingrediente con el nombre '{data.nombre}'", status.HTTP_409_CONFLICT)


def update(ingrediente_id: int, data: IngredienteUpdate) -> IngredienteResponse:
    with UnitOfWork() as uow:
        ingrediente = uow.ingredientes.get_by_id(ingrediente_id)
        if not ingrediente:
            _problem("INGREDIENTE_NOT_FOUND", f"Ingrediente {ingrediente_id} no encontrado", status.HTTP_404_NOT_FOUND)

        changes = data.model_dump(exclude_unset=True)
        if "nombre" in changes and changes["nombre"] != ingrediente.nombre:
            if uow.ingredientes.get_by_nombre_any(changes["nombre"]):
                _problem("NOMBRE_CONFLICT", f"Ya existe un ingrediente con el nombre '{changes['nombre']}'", status.HTTP_409_CONFLICT)

        for key, value in changes.items():
            setattr(ingrediente, key, value)
        ingrediente.updated_at = datetime.utcnow()
        uow.ingredientes.add(ingrediente)
        return IngredienteResponse.model_validate(ingrediente)


def delete(ingrediente_id: int) -> None:
    with UnitOfWork() as uow:
        ingrediente = uow.ingredientes.get_by_id(ingrediente_id)
        if not ingrediente:
            _problem("INGREDIENTE_NOT_FOUND", f"Ingrediente {ingrediente_id} no encontrado", status.HTTP_404_NOT_FOUND)
        uow.ingredientes.soft_delete(ingrediente)


def get_all_activos_for_export():
    with UnitOfWork() as uow:
        return [IngredienteResponse.model_validate(i) for i in uow.ingredientes.get_all_activos()]
