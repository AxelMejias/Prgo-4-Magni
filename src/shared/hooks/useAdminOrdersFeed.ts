import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import { useWsStore } from "../store/wsStore";
import type { WsMessage } from "./useOrderStatus";

const _apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:8000") as string;
const WS_ADMIN_BASE = _apiUrl.replace(/^http/, "ws") + "/ws/admin/pedidos";

interface UseAdminOrdersFeedOptions {
  onMessage?: (msg: WsMessage) => void;
  enabled?: boolean;
}

/**
 * Feed WebSocket del panel admin (doc §9.2 — canal `/ws/admin/pedidos`).
 *
 * El staff (ADMIN / PEDIDOS) recibe TODOS los eventos de pedidos automáticamente
 * vía las rooms de rol, sin suscribirse a pedidos puntuales. Igual que
 * `useOrderStatusWS`: auth por `?token=`, refresh en cierre 4001 y reconexión
 * exponencial. Reporta el estado de conexión al `wsStore`.
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
    const data = (await res.json()) as { access_token: string; refresh_token: string };
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export function useAdminOrdersFeed({
  onMessage,
  enabled = true,
}: UseAdminOrdersFeedOptions = {}) {
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

      useWsStore.getState().connecting();
      const ws = new WebSocket(`${WS_ADMIN_BASE}?token=${encodeURIComponent(token)}`);
      currentWs = ws;
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) { ws.close(1000); return; }
        retryCount = 0;
        useWsStore.getState().connect();
        onMessageRef.current?.({ event: "WS_CONNECTED", data: null });
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        try {
          const msg = JSON.parse(event.data as string) as WsMessage;
          useWsStore.getState().markEvent();
          onMessageRef.current?.(msg);
        } catch {
          // mensaje malformado — ignorar
        }
      };

      ws.onerror = () => {
        // onclose maneja la lógica de reconexión.
      };

      ws.onclose = (e) => {
        if (wsRef.current === ws) wsRef.current = null;
        currentWs = null;
        useWsStore.getState().disconnect();

        const wasClean    = e.code === 1000;
        const wasForbidden = e.code === 4003; // sin rol staff, no reintentar
        const wasExpired  = e.code === 4001;  // token expirado → refresh y retry

        if (cancelled || wasClean || wasForbidden) return;

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
}
