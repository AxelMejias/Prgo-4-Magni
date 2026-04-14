from types import TracebackType
from typing import Optional, Type

from sqlmodel import Session

from app.database import engine


class UnitOfWork:
    """
    Encapsula una transacción de base de datos.
    Hace commit automático al salir sin error, rollback si hay excepción.
    """

    def __init__(self) -> None:
        self.session: Session = Session(engine, expire_on_commit=False)

    def __enter__(self) -> "UnitOfWork":
        return self

    def __exit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
        if exc_type:
            self.session.rollback()
        else:
            self.session.commit()
        self.session.close()
