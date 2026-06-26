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
  image_url?: string;
  personalizacion?: number[];
  /**
   * Tope de unidades que el cliente puede pedir = stock_disponible del producto
   * (unidades producibles según el stock de sus insumos). `null`/`undefined`
   * significa sin receta o sin límite conocido (no se topea).
   */
  stock?: number | null;
}

/** Limita la cantidad al stock disponible. Sin stock definido → no se topea. */
export function capCantidad(cantidad: number, stock?: number | null): number {
  if (stock === null || stock === undefined) return cantidad;
  return Math.min(cantidad, Math.max(0, stock));
}

interface CartState {
  items: CartItem[];
  /**
   * Id del usuario dueño del carrito. El carrito se persiste en localStorage, que
   * en un mismo navegador/perfil (o pestañas incógnito de la misma ventana) es
   * compartido. Atarlo al usuario evita que el carrito de una cuenta aparezca en
   * otra: al loguearse alguien distinto, se vacía.
   */
  ownerId: number | null;

  // Acciones
  addItem: (item: Omit<CartItem, "cantidad">, cantidad?: number) => void;
  removeItem: (producto_id: number) => void;
  updateCantidad: (producto_id: number, cantidad: number) => void;
  /**
   * Sincroniza el tope de stock de un ítem con el valor en vivo del catálogo.
   * Si el stock cae por debajo de la cantidad en carrito (y sigue > 0), recorta
   * la cantidad al máximo disponible. Si llega a 0, NO elimina el ítem: lo deja
   * para que el carrito lo muestre como "Sin stock" y bloquee la compra.
   */
  setItemStock: (producto_id: number, stock: number | null) => void;
  /**
   * Vincula el carrito al usuario logueado. Si el carrito venía de otra cuenta
   * (ownerId distinto), lo vacía antes de asignarlo al nuevo dueño.
   */
  bindToUser: (userId: number) => void;
  clear: () => void;

  // Selectores
  totalItems: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      ownerId: null,

      addItem: (item, cantidad = 1) =>
        set((s) => {
          const existing = s.items.find(
            (i) => i.producto_id === item.producto_id
          );
          if (existing) {
            // Al re-agregar refrescamos el tope con el stock más reciente del
            // catálogo y clampeamos la suma a ese stock.
            const stock = item.stock !== undefined ? item.stock : existing.stock;
            return {
              items: s.items.map((i) =>
                i.producto_id === item.producto_id
                  ? { ...i, stock, cantidad: capCantidad(i.cantidad + cantidad, stock) }
                  : i
              ),
            };
          }
          return {
            items: [...s.items, { ...item, cantidad: capCantidad(cantidad, item.stock) }],
          };
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
                  i.producto_id === producto_id
                    ? { ...i, cantidad: capCantidad(cantidad, i.stock) }
                    : i
                ),
        })),

      setItemStock: (producto_id, stock) =>
        set((s) => ({
          items: s.items.map((i) => {
            if (i.producto_id !== producto_id) return i;
            // stock 0 → conservar la cantidad para mostrar "Sin stock" (no borrar).
            // stock > 0 → recortar la cantidad si la supera.
            const cantidad =
              stock !== null && stock > 0 ? capCantidad(i.cantidad, stock) : i.cantidad;
            return { ...i, stock, cantidad };
          }),
        })),

      bindToUser: (userId) =>
        set((s) =>
          s.ownerId === userId ? s : { items: [], ownerId: userId }
        ),

      clear: () => set({ items: [] }),

      totalItems: () =>
        get().items.reduce((acc, i) => acc + i.cantidad, 0),

      subtotal: () =>
        get().items.reduce((acc, i) => acc + i.precio * i.cantidad, 0),
    }),
    {
      // Clave en localStorage — middleware persist
      name: "cart-storage",
      partialize: (state) => ({ items: state.items, ownerId: state.ownerId }),
    }
  )
);