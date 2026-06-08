import { useEffect, useRef, useCallback } from "react";

// Deriva la URL WS de la misma variable que usa axiosClient, para no duplicar config.
// http:// → ws://   |   https:// → wss://
const _apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:8000") as string;
const WS_URL = _apiUrl.replace(/^http/, "ws") + "/api/v1/pedidos/ws";

export interface WsMessage {
  event: string;
  data: unknown;
}

interface UseWebSocketOptions {
  onMessage?: (msg: WsMessage) => void;
  enabled?: boolean;
}

/**
 * Hook que gestiona una conexión WebSocket persistente con el backend.
 *
 * AUTENTICACIÓN
 * El backend autentica leyendo la cookie httpOnly "access_token" que el
 * navegador envía automáticamente en el handshake. No hay que pasar nada
 * manualmente. Si la cookie es inválida el servidor cierra con código 1008
 * y el hook NO reintenta (evita bucles inútiles).
 *
 * ROOMS
 * Al conectarse el backend une el socket a "role:{rol}" de forma automática.
 * Para recibir eventos de un pedido específico llamar a subscribeToOrder(id).
 *
 * EVENTOS SINTÉTICOS
 * Cuando la conexión se establece (o se restablece) el hook emite un mensaje
 * local con event = "WS_CONNECTED" antes de cualquier mensaje real del servidor.
 * Los componentes lo usan para recargar datos y re-suscribirse a pedidos activos.
 *
 * RECONEXIÓN CON BACKOFF EXPONENCIAL
 * Si la conexión cae por cualquier razón distinta a 1000/1008, reintenta con:
 *   intento 1 → 2 s, intento 2 → 4 s ... máximo 30 s.
 */
export function useWebSocket({
  onMessage,
  enabled = true,
}: UseWebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);

  // Ref sincronizada: el efecto solo depende de `enabled`, pero onMessage
  // siempre apunta a la versión más reciente sin disparar un nuevo efecto.
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

      const ws = new WebSocket(WS_URL);
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
        const wasRejected = e.code === 1008;
        if (cancelled || wasClean || wasRejected) return;

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
