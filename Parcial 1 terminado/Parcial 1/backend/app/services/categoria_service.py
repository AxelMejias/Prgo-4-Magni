from typing import List, Optional
from datetime import datetime
from fastapi import HTTPException, status

from app.models.categoria import Categoria
from app.schemas.categoria import CategoriaCreate, CategoriaUpdate, CategoriaResponse
from app.uow.unit_of_work import UnitOfWork


def get_all(
    nombre: Optional[str] = None,
    offset: int = 0,
    limit: int = 100,
) -> List[CategoriaResponse]:
    with UnitOfWork() as uow:
        categorias = uow.categorias.get_all(nombre=nombre, offset=offset, limit=limit)
        return [CategoriaResponse.model_validate(c) for c in categorias]


def get_by_id(categoria_id: int) -> CategoriaResponse:
    with UnitOfWork() as uow:
        categoria = uow.categorias.get_by_id(categoria_id)
        if not categoria:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoría con ID {categoria_id} no encontrada",
            )
        return CategoriaResponse.model_validate(categoria)


def get_subcategorias(parent_id: int) -> List[CategoriaResponse]:
    """Devuelve todas las subcategorías de una categoría (relación reflexiva)."""
    with UnitOfWork() as uow:
        padre = uow.categorias.get_by_id(parent_id)
        if not padre:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoría con ID {parent_id} no encontrada",
            )
        subcategorias = uow.categorias.get_subcategorias(parent_id)
        return [CategoriaResponse.model_validate(c) for c in subcategorias]


def create(data: CategoriaCreate) -> CategoriaResponse:
    with UnitOfWork() as uow:
        if uow.categorias.get_by_nombre(data.nombre):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ya existe una categoría con el nombre '{data.nombre}'",
            )
        if data.parent_id and not uow.categorias.get_by_id(data.parent_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoría padre con ID {data.parent_id} no encontrada",
            )
        categoria = Categoria(**data.model_dump())
        uow.categorias.add(categoria)
        return CategoriaResponse.model_validate(categoria)


def update(categoria_id: int, data: CategoriaUpdate) -> CategoriaResponse:
    with UnitOfWork() as uow:
        categoria = uow.categorias.get_by_id(categoria_id)
        if not categoria:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoría con ID {categoria_id} no encontrada",
            )
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(categoria, key, value)
        categoria.updated_at = datetime.utcnow()
        uow.categorias.add(categoria)
        return CategoriaResponse.model_validate(categoria)


def delete(categoria_id: int) -> None:
    with UnitOfWork() as uow:
        categoria = uow.categorias.get_by_id(categoria_id)
        if not categoria:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoría con ID {categoria_id} no encontrada",
            )
        uow.categorias.delete(categoria)
