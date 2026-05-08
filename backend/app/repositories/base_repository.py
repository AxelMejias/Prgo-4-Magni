from typing import Generic, Optional, Type, TypeVar
from sqlmodel import SQLModel, Session, select

T = TypeVar("T", bound=SQLModel)


class BaseRepository(Generic[T]):
    """
    Repositorio genérico. Provee operaciones CRUD básicas.
    Las subclases pueden sobreescribir get_by_id para aplicar filtros
    adicionales (ej: soft delete con deleted_at IS NULL).
    """

    def __init__(self, session: Session, model: Type[T]):
        self.session = session
        self.model = model

    def get_by_id(self, entity_id: int) -> Optional[T]:
        return self.session.get(self.model, entity_id)

    def add(self, entity: T) -> T:
        self.session.add(entity)
        self.session.flush()
        self.session.refresh(entity)
        return entity

    def hard_delete(self, entity: T) -> None:
        self.session.delete(entity)
        self.session.flush()

    def count(self, statement) -> int:
        from sqlalchemy import func, select as sa_select
        count_stmt = sa_select(func.count()).select_from(statement.subquery())
        return self.session.exec(count_stmt).one()
