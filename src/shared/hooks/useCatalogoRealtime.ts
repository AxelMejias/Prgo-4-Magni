import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminOrdersFeed } from "./useAdminOrdersFeed";
import { useAuthStore } from "../store/authStore";
import type { WsMessage } from "./useOrderStatus";

/**
 * Sincronización en tiempo real del catálogo (ingredientes y productos).
 *
 * Escucha el canal de staff `/ws/admin/pedidos` (reutilizado por el backend para
 * emitir también eventos de catálogo) y, ante un cambio, invalida las queries de
 * React Query correspondientes para que TODAS las pestañas abiertas refresquen
 * sus datos sin recargar la página.
 *
 * Caso de uso: un admin cambia el costo de un ingrediente en una pestaña y otra
 * pestaña (ingredientes o productos) refleja el nuevo precio automáticamente.
 *
 * Nota: el costo y el stock disponible de un producto se derivan de sus insumos,
 * por eso un evento de ingrediente invalida también el catálogo de productos.
 */

const INGREDIENTE_EVENTS = new Set([
  "ingrediente_actualizado",
  "ingrediente_creado",
  "ingrediente_eliminado",
]);

const PRODUCTO_EVENTS = new Set([
  "producto_actualizado",
  "producto_creado",
  "producto_eliminado",
]);

export function useCatalogoRealtime() {
  const queryClient = useQueryClient();
  // El canal admin solo admite ADMIN / PEDIDOS; evitamos abrir un socket que el
  // backend rechazaría (4003) para roles que no corresponden.
  const enabled = useAuthStore((s) => s.hasRole(["ADMIN", "PEDIDOS"]));

  const onMessage = useCallback(
    (msg: WsMessage) => {
      if (INGREDIENTE_EVENTS.has(msg.event)) {
        queryClient.invalidateQueries({ queryKey: ["ingredientes"] });
        queryClient.invalidateQueries({ queryKey: ["ingredientes-select"] });
        queryClient.invalidateQueries({ queryKey: ["productos"] });
      } else if (PRODUCTO_EVENTS.has(msg.event)) {
        queryClient.invalidateQueries({ queryKey: ["productos"] });
      }
    },
    [queryClient]
  );

  useAdminOrdersFeed({ onMessage, enabled });
}
