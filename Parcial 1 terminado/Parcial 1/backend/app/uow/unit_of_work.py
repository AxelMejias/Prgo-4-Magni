from sqlmodel import Session
from app.database import engine


class UnitOfWork:
    """
    Patrón Unit of Work: encapsula el ciclo de vida de la sesión y provee acceso
    a los repositorios. Hace commit automático al salir del bloque `with` si no
    hubo excepciones, o rollback si ocurrió algún error.

    Uso:
        with UnitOfWork() as uow:
            resultado = uow.categorias.get_by_id(1)
    """

    def __init__(self):
        self.session: Session = Session(engine)

    def __enter__(self) -> "UnitOfWork":
        # Importes locales para evitar circularidades al arrancar
        from app.repositories.categoria_repository import CategoriaRepository
        from app.repositories.ingrediente_repository import IngredienteRepository
        from app.repositories.producto_repository import ProductoRepository

        self.categorias = CategoriaRepository(self.session)
        self.ingredientes = IngredienteRepository(self.session)
        self.productos = ProductoRepository(self.session)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.session.rollback()
        else:
            self.session.commit()
        self.session.close()

    def commit(self):
        self.session.commit()

    def rollback(self):
        self.session.rollback()
