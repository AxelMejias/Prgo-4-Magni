import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { pedidoApi } from "../entities/pedido/api";
import type { EstadoCodigo, PaginatedPedidos } from "../entities/pedido/model";
import EstadoBadge from "../features/pedido-estado/ui/EstadoBadge";
import { formatARS, formatDateTime, toNumber } from "../shared/lib/format";
import { useWebSocket, type WsMessage } from "../shared/hooks/useWebSocket";
import { useAuthStore } from "../shared/store/authStore";

const PAGE_SIZE = 10;
const ESTADOS: { codigo: EstadoCodigo | ""; label: string }[] = [
  { codigo: "", label: "Todos" },
  { codigo: "PENDIENTE",  label: "Pendientes" },
  { codigo: "CONFIRMADO", label: "Confirmados" },
  { codigo: "EN_PREP",    label: "En preparación" },
  { codigo: "ENTREGADO",  label: "Entregados" },
  { codigo: "CANCELADO",  label: "Cancelados" },
];

const TERMINAL_ESTADOS = new Set<EstadoCodigo>(["ENTREGADO", "CANCELADO"]);

export default function MisPedidosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const estadoParam = (searchParams.get("estado") ?? "") as EstadoCodigo | "";

  const queryClient    = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Refs para evitar closures viejos en el callback de WS
  const dataRef      = useRef<PaginatedPedidos | undefined>(undefined);
  const subscribeRef = useRef<(id: number) => void>(() => {});

  const { subscribeToOrder } = useWebSocket({
    enabled: isAuthenticated,
    onMessage: useCallback(
      (msg: WsMessage) => {
        if (msg.event === "WS_CONNECTED") {
          // Recargá la lista y suscribite a los pedidos activos conocidos
          queryClient.invalidateQueries({ queryKey: ["mis-pedidos"] });
          dataRef.current?.items
            .filter((p) => !TERMINAL_ESTADOS.has(p.estado_codigo))
            .forEach((p) => subscribeRef.current(p.id));
        } else if (msg.event === "NUEVO_PEDIDO" || msg.event.startsWith("PEDIDO_")) {
          queryClient.invalidateQueries({ queryKey: ["mis-pedidos"] });
        }
      },
      [queryClient]
    ),
  });

  // Mantener refs actualizados
  useEffect(() => { subscribeRef.current = subscribeToOrder; }, [subscribeToOrder]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["mis-pedidos", page, estadoParam],
    queryFn: () =>
      pedidoApi.getAll({
        page,
        size: PAGE_SIZE,
        estado_codigo: estadoParam || undefined,
      }),
  });

  // Cuando los datos cargan, sincronizar el ref y suscribirse a pedidos activos
  useEffect(() => {
    dataRef.current = data;
    if (!data) return;
    data.items
      .filter((p) => !TERMINAL_ESTADOS.has(p.estado_codigo))
      .forEach((p) => subscribeRef.current(p.id));
  }, [data]);

  function setPage(p: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(p));
      return next;
    });
  }

  function setEstado(codigo: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", "1");
      if (codigo) next.set("estado", codigo);
      else next.delete("estado");
      return next;
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-surface-900">Mis Pedidos</h1>
        <p className="text-sm text-surface-500">
          Seguí el estado de tus pedidos en tiempo real.
        </p>
      </header>

      {/* Filtros de estado */}
      <div className="flex gap-2 flex-wrap">
        {ESTADOS.map((e) => (
          <button
            key={e.codigo}
            onClick={() => setEstado(e.codigo)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              estadoParam === e.codigo
                ? "bg-brand-600 text-white"
                : "bg-surface-100 text-surface-600 hover:bg-surface-200"
            }`}
          >
            {e.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-surface-500">Cargando pedidos…</p>}
      {isError && (
        <p className="text-danger-600 bg-danger-50 border border-danger-200 rounded-xl px-4 py-3 text-sm">
          Error al cargar pedidos.
        </p>
      )}

      {data && data.items.length === 0 && (
        <div className="bg-white rounded-2xl border border-surface-200 p-12 text-center">
          <p className="text-surface-400 text-sm">No tenés pedidos en este estado.</p>
          <Link
            to="/tienda"
            className="mt-3 inline-block text-sm text-brand-600 hover:underline"
          >
            Ir a la tienda →
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {data?.items.map((pedido) => {
          // Un pedido MERCADOPAGO que sigue PENDIENTE = pago aún no confirmado
          // (el pago aprobado lo avanza a CONFIRMADO).
          const esperandoPago =
            pedido.estado_codigo === "PENDIENTE" &&
            pedido.forma_pago_codigo === "MERCADOPAGO";
          return (
            <Link
              key={pedido.id}
              to={`/mis-pedidos/${pedido.id}`}
              className={`block bg-white rounded-2xl border p-5 hover:shadow-md transition-all ${
                esperandoPago
                  ? "border-warning-300 bg-warning-50 hover:border-warning-400"
                  : "border-surface-200 hover:border-brand-200"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    esperandoPago ? "bg-warning-100 text-warning-700" : "bg-brand-100 text-brand-700"
                  }`}>
                    #{pedido.id}
                  </div>
                  <div>
                    <p className="font-semibold text-surface-900 text-sm">
                      Pedido #{pedido.id}
                    </p>
                    <p className="text-xs text-surface-500">
                      {formatDateTime(pedido.created_at)}
                    </p>
                    {esperandoPago && (
                      <p className="text-xs text-warning-600 font-semibold mt-0.5">
                        Pago pendiente — tocá para completarlo
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <EstadoBadge estado={pedido.estado_codigo} />
                  <div className="text-right">
                    <p className="text-xs text-surface-500">Total</p>
                    <p className="font-bold text-brand-700">
                      {formatARS(toNumber(pedido.total))}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Paginación */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg border border-surface-300 text-sm disabled:opacity-40"
          >
            ←
          </button>
          <span className="text-sm text-surface-600">
            Página {data.page} de {data.pages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= data.pages}
            className="px-3 py-1.5 rounded-lg border border-surface-300 text-sm disabled:opacity-40"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}