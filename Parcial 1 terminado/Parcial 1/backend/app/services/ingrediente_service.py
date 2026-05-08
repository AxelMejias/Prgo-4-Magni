from typing import List, Optional
from datetime import datetime
from fastapi import HTTPException, status

from app.models.ingrediente import Ingrediente
from app.schemas.ingrediente import IngredienteCreate, IngredienteUpdate, IngredienteResponse
from app.uow.unit_of_work import UnitOfWork


def get_all(
    nombre: Optional[str] = None,
    unidad_medida: Optional[str] = None,
    offset: int = 0,
    limit: int = 100,
) -> List[IngredienteResponse]:
    with UnitOfWork() as uow:
        ingredientes = uow.ingredientes.get_all(
            nombre=nombre, unidad_medida=unidad_medida, offset=offset, limit=limit
        )
        return [IngredienteResponse.model_validate(i) for i in ingredientes]


def get_by_id(ingrediente_id: int) -> IngredienteResponse:
    with UnitOfWork() as uow:
        ingrediente = uow.ingredientes.get_by_id(ingrediente_id)
        if not ingrediente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ingrediente con ID {ingrediente_id} no encontrado",
            )
        return IngredienteResponse.model_validate(ingrediente)


def create(data: IngredienteCreate) -> IngredienteResponse:
    with UnitOfWork() as uow:
        if uow.ingredientes.get_by_nombre(data.nombre):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ya existe un ingrediente con el nombre '{data.nombre}'",
            )
        ingrediente = Ingrediente(**data.model_dump())
        uow.ingredientes.add(ingrediente)
        return IngredienteResponse.model_validate(ingrediente)


def update(ingrediente_id: int, data: IngredienteUpdate) -> IngredienteResponse:
    with UnitOfWork() as uow:
        ingrediente = uow.ingredientes.get_by_id(ingrediente_id)
        if not ingrediente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ingrediente con ID {ingrediente_id} no encontrado",
            )
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(ingrediente, key, value)
        ingrediente.updated_at = datetime.utcnow()
        uow.ingredientes.add(ingrediente)
        return IngredienteResponse.model_validate(ingrediente)


def delete(ingrediente_id: int) -> None:
    with UnitOfWork() as uow:
        ingrediente = uow.ingredientes.get_by_id(ingrediente_id)
        if not ingrediente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ingrediente con ID {ingrediente_id} no encontrado",
            )
        uow.ingredientes.delete(ingrediente)
