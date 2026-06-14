import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Estado del proceso de pago/checkout (doc §12 — responsabilidad "pagos").
 *
 * Se persiste para que la selección del usuario (tipo de entrega, forma de pago,
 * dirección) sobreviva el redirect a MercadoPago y la vuelta al sitio.
 */
export type TipoEntrega = "retiro" | "domicilio";

interface CheckoutState {
  tipoEntrega: TipoEntrega;
  formaPago: string;
  direccionId: number | "";

  setTipoEntrega: (t: TipoEntrega) => void;
  setFormaPago: (codigo: string) => void;
  setDireccionId: (id: number | "") => void;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      tipoEntrega: "retiro",
      formaPago: "",
      direccionId: "",

      setTipoEntrega: (tipoEntrega) => set({ tipoEntrega }),
      setFormaPago: (formaPago) => set({ formaPago }),
      setDireccionId: (direccionId) => set({ direccionId }),
      reset: () => set({ tipoEntrega: "retiro", formaPago: "", direccionId: "" }),
    }),
    { name: "checkout-storage" }
  )
);
