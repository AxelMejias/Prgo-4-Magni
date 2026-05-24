import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * CartItem captura un snapshot del producto al momento de agregarlo.
 * Nombre y precio quedan congelados acá hasta que se envíe el pedido al
 * backend (donde el backend hace su propio snapshot en DetallePedido).
 */
export interface CartItem {
  producto_id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  personalizacion?: number[];
}

interface CartState {
  items: CartItem[];

  // Acciones
  addItem: (item: Omit<CartItem, "cantidad">, cantidad?: number) => void;
  removeItem: (producto_id: number) => void;
  updateCantidad: (producto_id: number, cantidad: number) => void;
  clear: () => void;

  // Selectores
  totalItems: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, cantidad = 1) =>
        set((s) => {
          const existing = s.items.find(
            (i) => i.producto_id === item.producto_id
          );
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.producto_id === item.producto_id
                  ? { ...i, cantidad: i.cantidad + cantidad }
                  : i
              ),
            };
          }
          return { items: [...s.items, { ...item, cantidad }] };
        }),

      removeItem: (producto_id) =>
        set((s) => ({
          items: s.items.filter((i) => i.producto_id !== producto_id),
        })),

      updateCantidad: (producto_id, cantidad) =>
        set((s) => ({
          items:
            cantidad <= 0
              ? s.items.filter((i) => i.producto_id !== producto_id)
              : s.items.map((i) =>
                  i.producto_id === producto_id ? { ...i, cantidad } : i
                ),
        })),

      clear: () => set({ items: [] }),

      totalItems: () =>
        get().items.reduce((acc, i) => acc + i.cantidad, 0),

      subtotal: () =>
        get().items.reduce((acc, i) => acc + i.precio * i.cantidad, 0),
    }),
    {
      // Clave en localStorage — middleware persist
      name: "cart-storage",
      partialize: (state) => ({ items: state.items }),
    }
  )
);