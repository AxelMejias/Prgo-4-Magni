import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "../store/authStore";

const _apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:8000") as string;
const WS_BASE = _apiUrl.replace(/^http/, "ws") + "/ws/pedidos";

export interface WsMessage {
  event: string;
  pedido_id?: number;
  estado_anterior?: string | null;
  estado_nuevo?: string;
  usuario_id?: number | null;
  motivo?: string | null;
  timestamp?: string;
  // synthetic (generado por el hook, no viene del servidor)
  data?: unknown;
}

interface UseOrderStatusWSOptions {
  onMessage?: (msg: WsMessage) => void;
  enabled?: boolean;
}

/**
 * Intenta refrescar el access token usando el refresh token del store.
 * Devuelve true si el refresh fue exitoso.
 */
async function tryRefreshToken(): Promise<boolean> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${_apiUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      logout();
      return false;
    }
    const data = await res.json() as { access_token: string; refresh_token: string };
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

/**
 * Hook que gestiona una conexión WebSocket persistente con el backend.
 *
 * AUTENTICACIÓN
 * El JWT se pasa como query param ?token=<accessToken> según la spec TPI v6.0.
 * El token se lee del authStore en cada intento de conexión, por lo que un
 * refresh de token se aplica automáticamente en el siguiente reintento.
 * Si no hay token (usuario no logueado), no se abre ninguna conexión.
 *
 * CLOSE CODES
 * 4001 — token expirado: el hook llama al interceptor de refresh y reconecta.
 * 1008 — token inválido/malformado: no se reintenta.
 * 1000 — cierre limpio: no se reintenta.
 *
 * ROOMS
 * Al conectarse el backend une el socket a "role:{rol}" de forma automática.
 * Para recibir eventos de un pedido específico llamar a subscribeToOrder(id).
 *
 * RECONEXIÓN CON BACKOFF EXPONENCIAL
 * Si la conexión cae por cualquier razón distinta a 1000/1008, reintenta con:
 *   intento 1 → 2 s, intento 2 → 4 s ... máximo 30 s.
 */
export function useOrderStatusWS({
  onMessage,
  enabled = true,
}: UseOrderStatusWSOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);

  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let retryCount = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let currentWs: WebSocket | null = null;

    const closeCleanly = (ws: WebSocket) => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.addEventListener("open", () => ws.close(1000), { once: true });
      } else if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000);
      }
    };

    const connect = () => {
      if (cancelled) return;

      const token = useAuthStore.getState().accessToken;
      if (!token) return;

      const wsUrl = `${WS_BASE}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);
      currentWs = ws;
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) { ws.close(1000); return; }
        retryCount = 0;
        onMessageRef.current?.({ event: "WS_CONNECTED", data: null });
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        try {
          const msg = JSON.parse(event.data as string) as WsMessage;
          onMessageRef.current?.(msg);
        } catch {
          // mensaje malformado — ignorar
        }
      };

      ws.onerror = () => {
        // Los errores siempre van seguidos de onclose; toda la lógica va ahí.
      };

      ws.onclose = (e) => {
        if (wsRef.current === ws) wsRef.current = null;
        currentWs = null;

        const wasClean    = e.code === 1000;
        const wasRejected = e.code === 1008; // token inválido, no retry
        const wasExpired  = e.code === 4001; // token expirado, refresh y retry

        if (cancelled || wasClean || wasRejected) return;

        if (wasExpired) {
          tryRefreshToken().then((ok) => {
            if (ok && !cancelled) connect();
          });
          return;
        }

        retryCount++;
        const delay = Math.min(1000 * 2 ** retryCount, 30_000);
        retryTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimer !== null) clearTimeout(retryTimer);
      if (currentWs) closeCleanly(currentWs);
      wsRef.current = null;
    };
  }, [enabled]);

  const subscribeToOrder = useCallback((orderId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ action: "subscribe-order", order_id: orderId })
      );
    }
  }, []);

  const unsubscribeFromOrder = useCallback((orderId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ action: "unsubscribe-order", order_id: orderId })
      );
    }
  }, []);

  return { subscribeToOrder, unsubscribeFromOrder };
}
