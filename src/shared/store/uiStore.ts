import { create } from "zustand";

interface UiStore {
  paymentOverlay: { paymentId?: string } | null;
  showPaymentOverlay: (paymentId?: string) => void;
  clearPaymentOverlay: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  paymentOverlay: null,
  showPaymentOverlay: (paymentId) => set({ paymentOverlay: { paymentId } }),
  clearPaymentOverlay: () => set({ paymentOverlay: null }),
}));
