import { create } from "zustand";

/**
 * Estado de la conexión WebSocket en tiempo real (doc §12).
 *
 * Las acciones `connect`/`disconnect` solo registran el estado de conexión;
 * son llamadas exclusivamente por los hooks `useOrderStatusWS` y
 * `useAdminOrdersFeed`. Ningún componente accede a este store directamente
 * salvo para LEER el estado (p. ej. el badge "Sin conexión en tiempo real").
 */
export type WsConnectionStatus = "connecting" | "connected" | "disconnected";

interface WsState {
  status: WsConnectionStatus;
  lastEventAt: number | null;

  /** Marca el inicio de un intento de conexión. */
  connecting: () => void;
  /** Marca la conexión como establecida. */
  connect: () => void;
  /** Marca la conexión como caída/cerrada. */
  disconnect: () => void;
  /** Registra que llegó un evento (para mostrar "última actualización"). */
  markEvent: () => void;
}

export const useWsStore = create<WsState>((set) => ({
  status: "disconnected",
  lastEventAt: null,

  connecting: () => set({ status: "connecting" }),
  connect: () => set({ status: "connected" }),
  disconnect: () => set({ status: "disconnected" }),
  markEvent: () => set({ lastEventAt: Date.now() }),
}));
