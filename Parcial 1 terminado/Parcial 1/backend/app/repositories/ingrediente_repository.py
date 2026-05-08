from typing import List, Optional
from sqlmodel import Session, select

from app.models.ingrediente import Ingrediente


class IngredienteRepository:
    """Encapsula todas las queries de la tabla ingrediente."""

    def __init__(self, session: Session):
        self.session = session

    def get_all(
        self,
        nombre: Optional[str] = None,
        unidad_medida: Optional[str] = None,
        offset: int = 0,
        limit: int = 100,
    ) -> List[Ingrediente]:
        query = select(Ingrediente)
        if nombre:
            query = query.where(Ingrediente.nombre.icontains(nombre))
        if unidad_medida:
            query = query.where(Ingrediente.unidad_medida.icontains(unidad_medida))
        return list(self.session.exec(query.offset(offset).limit(limit)).all())

    def get_by_id(self, ingrediente_id: int) -> Optional[Ingrediente]:
        return self.session.get(Ingrediente, ingrediente_id)

    def get_by_nombre(self, nombre: str) -> Optional[Ingrediente]:
        return self.session.exec(
            select(Ingrediente).where(Ingrediente.nombre == nombre)
        ).first()

    def add(self, ingrediente: Ingrediente) -> Ingrediente:
        self.session.add(ingrediente)
        self.session.flush()
        self.session.refresh(ingrediente)
        return ingrediente

    def delete(self, ingrediente: Ingrediente) -> None:
        self.session.delete(ingrediente)
        self.session.flush()
