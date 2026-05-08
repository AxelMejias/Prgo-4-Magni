from typing import List, Optional
from sqlmodel import Session, select

from app.models.categoria import Categoria


class CategoriaRepository:
    """Encapsula todas las queries de la tabla categoria."""

    def __init__(self, session: Session):
        self.session = session

    def get_all(
        self,
        nombre: Optional[str] = None,
        offset: int = 0,
        limit: int = 100,
    ) -> List[Categoria]:
        query = select(Categoria)
        if nombre:
            query = query.where(Categoria.nombre.icontains(nombre))
        return list(self.session.exec(query.offset(offset).limit(limit)).all())

    def get_by_id(self, categoria_id: int) -> Optional[Categoria]:
        return self.session.get(Categoria, categoria_id)

    def get_by_nombre(self, nombre: str) -> Optional[Categoria]:
        return self.session.exec(
            select(Categoria).where(Categoria.nombre == nombre)
        ).first()

    def get_subcategorias(self, parent_id: int) -> List[Categoria]:
        """Devuelve todas las categorías cuyo padre es parent_id (relación reflexiva)."""
        return list(
            self.session.exec(
                select(Categoria).where(Categoria.parent_id == parent_id)
            ).all()
        )

    def add(self, categoria: Categoria) -> Categoria:
        self.session.add(categoria)
        self.session.flush()
        self.session.refresh(categoria)
        return categoria

    def delete(self, categoria: Categoria) -> None:
        self.session.delete(categoria)
        self.session.flush()
