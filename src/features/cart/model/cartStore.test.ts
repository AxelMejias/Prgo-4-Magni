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
  useCartStore.setState({ items: [] });
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
