import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const _apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:8000") as string;
const WS_CATALOGO = _apiUrl.replace(/^http/, "ws") + "/ws/catalogo";

/**
 * Sincronización en vivo del catálogo en la TIENDA pública.
 *
 * Se conecta al canal WebSocket público `/ws/catalogo` (sin autenticación) y, ante
 * cualquier cambio de catálogo (productos o ingredientes), invalida las queries de
 * productos para que la tienda refleje precio/stock/disponibilidad sin recargar.
 *
 * Es el equivalente público de `useCatalogoRealtime` (panel admin, canal de staff):
 * un visitante anónimo ve el "sin stock" al instante, igual que el dashboard.
 *
 * No reporta estado al `wsStore` (la tienda no muestra el badge de conexión) y
 * reconecta con backoff exponencial si la conexión cae.
 */
export function useStoreCatalogoRealtime(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let retryCount = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let currentWs: WebSocket | null = null;

    const refrescarCatalogo = () => {
      // Las páginas de tienda usan estas familias de claves para los productos.
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      queryClient.invalidateQueries({ queryKey: ["productos-store"] });
      queryClient.invalidateQueries({ queryKey: ["productos-tienda"] });
    };

    const connect = () => {
      if (cancelled) return;
      const ws = new WebSocket(WS_CATALOGO);
      currentWs = ws;

      ws.onopen = () => {
        if (cancelled) { ws.close(1000); return; }
        retryCount = 0;
      };

      ws.onmessage = () => {
        if (cancelled) return;
        // El payload solo avisa que algo cambió; volvemos a pedir el catálogo por REST.
        refrescarCatalogo();
      };

      ws.onerror = () => {
        // onclose maneja la reconexión.
      };

      ws.onclose = (e) => {
        currentWs = null;
        if (cancelled || e.code === 1000) return;
        retryCount++;
        const delay = Math.min(1000 * 2 ** retryCount, 30_000);
        retryTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimer !== null) clearTimeout(retryTimer);
      if (currentWs) {
        if (currentWs.readyState === WebSocket.CONNECTING) {
          currentWs.addEventListener("open", () => currentWs?.close(1000), { once: true });
        } else if (currentWs.readyState === WebSocket.OPEN) {
          currentWs.close(1000);
        }
      }
    };
  }, [enabled, queryClient]);
}
