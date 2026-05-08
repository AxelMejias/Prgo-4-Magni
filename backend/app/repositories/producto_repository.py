from typing import List, Optional
from sqlmodel import Session, select

from app.models.producto import Producto
from app.models.categoria import Categoria
from app.models.ingrediente import Ingrediente
from app.models.links import ProductoCategoria, ProductoIngrediente


class ProductoRepository:
    """Encapsula todas las queries de la tabla producto y sus tablas de link."""

    def __init__(self, session: Session):
        self.session = session

    def get_all(
        self,
        nombre: Optional[str] = None,
        precio_min: Optional[float] = None,
        precio_max: Optional[float] = None,
        categoria_id: Optional[int] = None,
        offset: int = 0,
        limit: int = 100,
    ) -> List[Producto]:
        query = select(Producto)
        if nombre:
            query = query.where(Producto.nombre.icontains(nombre))
        if precio_min is not None:
            query = query.where(Producto.precio >= precio_min)
        if precio_max is not None:
            query = query.where(Producto.precio <= precio_max)
        if categoria_id is not None:
            query = query.join(ProductoCategoria).where(
                ProductoCategoria.categoria_id == categoria_id
            )
        return list(self.session.exec(query.offset(offset).limit(limit)).all())

    def get_by_id(self, producto_id: int) -> Optional[Producto]:
        return self.session.get(Producto, producto_id)

    def get_by_nombre(self, nombre: str) -> Optional[Producto]:
        return self.session.exec(
            select(Producto).where(Producto.nombre == nombre)
        ).first()

    def get_categorias(self, producto_id: int) -> List[Categoria]:
        stmt = (
            select(Categoria)
            .join(ProductoCategoria, ProductoCategoria.categoria_id == Categoria.id)
            .where(ProductoCategoria.producto_id == producto_id)
        )
        return list(self.session.exec(stmt).all())

    def get_ingrediente_links(self, producto_id: int) -> List[ProductoIngrediente]:
        return list(
            self.session.exec(
                select(ProductoIngrediente).where(
                    ProductoIngrediente.producto_id == producto_id
                )
            ).all()
        )

    def add(self, producto: Producto) -> Producto:
        self.session.add(producto)
        self.session.flush()
        self.session.refresh(producto)
        return producto

    def add_categoria_link(self, producto_id: int, categoria_id: int) -> None:
        self.session.add(ProductoCategoria(producto_id=producto_id, categoria_id=categoria_id))

    def add_ingrediente_link(self, producto_id: int, ingrediente_id: int, cantidad: float) -> None:
        self.session.add(
            ProductoIngrediente(
                producto_id=producto_id,
                ingrediente_id=ingrediente_id,
                cantidad=cantidad,
            )
        )

    def delete_categoria_links(self, producto_id: int) -> None:
        for pc in self.session.exec(
            select(ProductoCategoria).where(ProductoCategoria.producto_id == producto_id)
        ).all():
            self.session.delete(pc)

    def delete_ingrediente_links(self, producto_id: int) -> None:
        for pi in self.session.exec(
            select(ProductoIngrediente).where(ProductoIngrediente.producto_id == producto_id)
        ).all():
            self.session.delete(pi)

    def delete(self, producto: Producto) -> None:
        self.session.delete(producto)
        self.session.flush()
