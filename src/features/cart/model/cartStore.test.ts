/**
 * cartStore.test.ts — Tests para src/features/cart/model/cartStore.ts
 *
 * Cubre: addItem, removeItem, updateCantidad, clear, totalItems, subtotal.
 *
 * Estrategia: se usa getState() / setState() directamente sobre el store
 * (patrón recomendado para Zustand v5 en unit tests sin render).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "./cartStore";

// Producto de prueba base
const prod1 = { producto_id: 1, nombre: "Pizza", precio: 1500 };
const prod2 = { producto_id: 2, nombre: "Coca", precio: 800 };

function resetStore() {
  useCartStore.setState({ items: [], ownerId: null });
}

describe("cartStore", () => {
  beforeEach(resetStore);

  // -------------------------------------------------------------------------
  // addItem
  // -------------------------------------------------------------------------
  describe("addItem", () => {
    it("agrega un producto nuevo al carrito", () => {
      useCartStore.getState().addItem(prod1);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].producto_id).toBe(1);
      expect(items[0].cantidad).toBe(1);
    });

    it("usa cantidad 1 por defecto", () => {
      useCartStore.getState().addItem(prod1);

      const { items } = useCartStore.getState();
      expect(items[0].cantidad).toBe(1);
    });

    it("acepta cantidad personalizada", () => {
      useCartStore.getState().addItem(prod1, 3);

      const { items } = useCartStore.getState();
      expect(items[0].cantidad).toBe(3);
    });

    it("incrementa cantidad si el producto ya existe", () => {
      useCartStore.getState().addItem(prod1, 2);
      useCartStore.getState().addItem(prod1, 3);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].cantidad).toBe(5);
    });

    it("no fusiona productos distintos", () => {
      useCartStore.getState().addItem(prod1);
      useCartStore.getState().addItem(prod2);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(2);
    });

    it("guarda el snapshot de nombre y precio en el momento de agregar", () => {
      useCartStore.getState().addItem(prod1);

      const { items } = useCartStore.getState();
      expect(items[0].nombre).toBe("Pizza");
      expect(items[0].precio).toBe(1500);
    });
  });

  // -------------------------------------------------------------------------
  // removeItem
  // -------------------------------------------------------------------------
  describe("removeItem", () => {
    it("elimina el producto del carrito", () => {
      useCartStore.getState().addItem(prod1);
      useCartStore.getState().addItem(prod2);

      useCartStore.getState().removeItem(1);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].producto_id).toBe(2);
    });

    it("no hace nada si el producto_id no existe", () => {
      useCartStore.getState().addItem(prod1);

      useCartStore.getState().removeItem(999);

      expect(useCartStore.getState().items).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // updateCantidad
  // -------------------------------------------------------------------------
  describe("updateCantidad", () => {
    it("actualiza la cantidad de un ítem existente", () => {
      useCartStore.getState().addItem(prod1, 1);

      useCartStore.getState().updateCantidad(1, 5);

      expect(useCartStore.getState().items[0].cantidad).toBe(5);
    });

    it("cantidad <= 0 elimina el ítem del carrito", () => {
      useCartStore.getState().addItem(prod1);

      useCartStore.getState().updateCantidad(1, 0);

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it("cantidad negativa también elimina el ítem", () => {
      useCartStore.getState().addItem(prod1);

      useCartStore.getState().updateCantidad(1, -1);

      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // tope por stock disponible
  // -------------------------------------------------------------------------
  describe("tope por stock disponible", () => {
    const prodStock = { producto_id: 3, nombre: "Empanada", precio: 500, stock: 1 };

    it("no permite agregar más unidades que el stock al crear el ítem", () => {
      useCartStore.getState().addItem(prodStock, 5);

      const item = useCartStore.getState().items[0];
      expect(item.cantidad).toBe(1);
    });

    it("clampea la suma al re-agregar un producto ya existente", () => {
      useCartStore.getState().addItem(prodStock, 1); // 1 (tope)
      useCartStore.getState().addItem(prodStock, 1); // sigue en 1

      expect(useCartStore.getState().items[0].cantidad).toBe(1);
    });

    it("updateCantidad no supera el stock", () => {
      useCartStore.getState().addItem(prodStock, 1);

      useCartStore.getState().updateCantidad(3, 30);

      expect(useCartStore.getState().items[0].cantidad).toBe(1);
    });

    it("sin stock definido (null) no topea la cantidad", () => {
      useCartStore.getState().addItem({ producto_id: 4, nombre: "Agua", precio: 300, stock: null }, 10);

      expect(useCartStore.getState().items[0].cantidad).toBe(10);
    });

    it("refresca el tope con el stock más reciente al re-agregar", () => {
      useCartStore.getState().addItem({ ...prodStock, stock: 1 }, 1);
      // El stock subió a 3 en el catálogo: el siguiente add lo refleja.
      useCartStore.getState().addItem({ ...prodStock, stock: 3 }, 1);

      const item = useCartStore.getState().items[0];
      expect(item.stock).toBe(3);
      expect(item.cantidad).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // setItemStock (sincronización de stock en vivo)
  // -------------------------------------------------------------------------
  describe("setItemStock", () => {
    const prodStock = { producto_id: 3, nombre: "Empanada", precio: 500, stock: 5 };

    it("recorta la cantidad si el stock baja por debajo de lo que hay en carrito", () => {
      useCartStore.getState().addItem(prodStock, 4); // 4 unidades (stock 5)
      useCartStore.getState().setItemStock(3, 2);    // ahora solo hay 2

      const item = useCartStore.getState().items[0];
      expect(item.stock).toBe(2);
      expect(item.cantidad).toBe(2);
    });

    it("stock 0 NO elimina el ítem (se conserva para mostrar 'Sin stock')", () => {
      useCartStore.getState().addItem(prodStock, 3);
      useCartStore.getState().setItemStock(3, 0);

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].stock).toBe(0);
    });

    it("no toca la cantidad si el stock sigue siendo suficiente", () => {
      useCartStore.getState().addItem(prodStock, 2);
      useCartStore.getState().setItemStock(3, 10);

      const item = useCartStore.getState().items[0];
      expect(item.stock).toBe(10);
      expect(item.cantidad).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // bindToUser (carrito por usuario)
  // -------------------------------------------------------------------------
  describe("bindToUser", () => {
    it("vacía el carrito si pertenecía a otro usuario", () => {
      useCartStore.getState().bindToUser(1);
      useCartStore.getState().addItem(prod1);

      useCartStore.getState().bindToUser(2); // otra cuenta

      expect(useCartStore.getState().items).toHaveLength(0);
      expect(useCartStore.getState().ownerId).toBe(2);
    });

    it("conserva el carrito si es el mismo usuario", () => {
      useCartStore.getState().bindToUser(1);
      useCartStore.getState().addItem(prod1, 2);

      useCartStore.getState().bindToUser(1); // mismo usuario

      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].cantidad).toBe(2);
    });

    it("asigna el dueño en el primer bind sin borrar lo agregado por ese dueño", () => {
      useCartStore.getState().bindToUser(5);
      useCartStore.getState().addItem(prod1);
      useCartStore.getState().bindToUser(5);

      expect(useCartStore.getState().ownerId).toBe(5);
      expect(useCartStore.getState().items).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // clear
  // -------------------------------------------------------------------------
  describe("clear", () => {
    it("vacía todo el carrito", () => {
      useCartStore.getState().addItem(prod1);
      useCartStore.getState().addItem(prod2);

      useCartStore.getState().clear();

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it("no falla con carrito vacío", () => {
      expect(() => useCartStore.getState().clear()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // totalItems
  // -------------------------------------------------------------------------
  describe("totalItems", () => {
    it("retorna 0 con carrito vacío", () => {
      expect(useCartStore.getState().totalItems()).toBe(0);
    });

    it("suma la cantidad de todos los ítems", () => {
      useCartStore.getState().addItem(prod1, 3);
      useCartStore.getState().addItem(prod2, 2);

      expect(useCartStore.getState().totalItems()).toBe(5);
    });

    it("refleja actualizaciones en tiempo real", () => {
      useCartStore.getState().addItem(prod1, 1);
      expect(useCartStore.getState().totalItems()).toBe(1);

      useCartStore.getState().addItem(prod1, 4);
      expect(useCartStore.getState().totalItems()).toBe(5);
    });
  });

  // -------------------------------------------------------------------------
  // subtotal
  // -------------------------------------------------------------------------
  describe("subtotal", () => {
    it("retorna 0 con carrito vacío", () => {
      expect(useCartStore.getState().subtotal()).toBe(0);
    });

    it("calcula precio × cantidad correctamente", () => {
      // prod1: 1500 × 2 = 3000; prod2: 800 × 1 = 800 → total 3800
      useCartStore.getState().addItem(prod1, 2);
      useCartStore.getState().addItem(prod2, 1);

      expect(useCartStore.getState().subtotal()).toBe(3800);
    });

    it("se actualiza al cambiar cantidad", () => {
      useCartStore.getState().addItem(prod1, 1); // 1500
      expect(useCartStore.getState().subtotal()).toBe(1500);

      useCartStore.getState().updateCantidad(1, 3); // 4500
      expect(useCartStore.getState().subtotal()).toBe(4500);
    });

    it("baja al quitar ítems", () => {
      useCartStore.getState().addItem(prod1, 2); // 3000
      useCartStore.getState().addItem(prod2, 1); // 800

      useCartStore.getState().removeItem(2);

      expect(useCartStore.getState().subtotal()).toBe(3000);
    });
  });
});
