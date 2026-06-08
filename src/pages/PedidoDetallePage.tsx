import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "react-router-dom";
import { pedidoApi } from "../entities/pedido/api";
import type { EstadoCodigo } from "../entities/pedido/model";
import { useAuthStore } from "../shared/store/authStore";
import { useWebSocket, type WsMessage } from "../shared/hooks/useWebSocket";
import EstadoBadge from "../features/pedido-estado/ui/EstadoBadge";
import HistorialList from "../features/pedido-estado/ui/HistorialList";
import {
  ESTADO_LABELS,
  getNextStates,
  requiereMotivo,
} from "../features/pedido-estado/lib/fsm";
import { formatARS, formatDateTime, toNumber } from "../shared/lib/format";

export default function PedidoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const pedidoId = Number(id);
  const location = useLocation();
  const queryClient    = useQueryClient();
  const hasRole        = useAuthStore((s) => s.hasRole);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const esStaff = hasRole(["ADMIN", "PEDIDOS"]);

  // Overlay "Pago aprobado" que se desvanece sobre el comprobante
  const paymentApproved = (location.state as { paymentApproved?: boolean; paymentId?: string } | null)?.paymentApproved;
  const paymentComprobante = (location.state as { paymentId?: string } | null)?.paymentId;
  const [overlayMounted, setOverlayMounted] = useState(!!paymentApproved);
  const [overlayVisible, setOverlayVisible] = useState(!!paymentApproved);

  useEffect(() => {
    if (!paymentApproved) return;
    const fadeTimer   = setTimeout(() => setOverlayVisible(false), 1400);
    const unmountTimer = setTimeout(() => setOverlayMounted(false), 2300);
    return () => { clearTimeout(fadeTimer); clearTimeout(unmountTimer); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Ref para subscribeToOrder (evita closure vicio en el callback de WS)
  const subscribeRef = useRef<(id: number) => void>(() => {});

  const { subscribeToOrder } = useWebSocket({
    enabled: isAuthenticated && !!pedidoId,
    onMessage: useCallback(
      (msg: WsMessage) => {
        if (msg.event === "WS_CONNECTED") {
          // Para clientes: suscribirse a la room específica del pedido
          subscribeRef.current(pedidoId);
        } else if (msg.event === "NUEVO_PEDIDO" || msg.event.startsWith("PEDIDO_")) {
          queryClient.invalidateQueries({
            queryKey: ["pedidos", "detalle", pedidoId],
          });
          queryClient.invalidateQueries({
            queryKey: ["pedidos", "detalle", pedidoId, "historial"],
          });
        }
      },
      [queryClient, pedidoId]
    ),
  });

  useEffect(() => { subscribeRef.current = subscribeToOrder; }, [subscribeToOrder]);

  const [motivoCancelar, setMotivoCancelar] = useState("");
  const [restaurarStock, setRestaurarStock] = useState(true);
  const [error, setError] = useState("");

  // ── Queries
  const { data: pedido, isLoading } = useQuery({
    queryKey: ["pedidos", "detalle", pedidoId],
    queryFn: () => pedidoApi.getById(pedidoId),
    enabled: !!pedidoId,
  });

  const { data: historial } = useQuery({
    queryKey: ["pedidos", "detalle", pedidoId, "historial"],
    queryFn: () => pedidoApi.getHistorial(pedidoId),
    enabled: !!pedidoId,
  });

  // ── Mutations: avanzar (staff) y cancelar (client)
  const invalidarPedido = () => {
    queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    queryClient.invalidateQueries({
      queryKey: ["pedidos", "detalle", pedidoId],
    });
    queryClient.invalidateQueries({
      queryKey: ["pedidos", "detalle", pedidoId, "historial"],
    });
  };

  const avanzarMutation = useMutation({
    mutationFn: ({
      estado_hacia,
      motivo,
      restaurar_stock,
    }: {
      estado_hacia: EstadoCodigo;
      motivo?: string;
      restaurar_stock?: boolean;
    }) => pedidoApi.avanzarEstado(pedidoId, { estado_hacia, motivo, restaurar_stock }),
    onSuccess: () => {
      invalidarPedido();
      setError("");
      setMotivoCancelar("");
      setRestaurarStock(true);
    },
    onError: (err: Error) => setError(err.message),
  });

  const cancelarMutation = useMutation({
    mutationFn: ({ motivo, restaurarStock }: { motivo: string; restaurarStock: boolean }) =>
      pedidoApi.cancelar(pedidoId, motivo, restaurarStock),
    onSuccess: () => {
      invalidarPedido();
      setError("");
      setMotivoCancelar("");
      setRestaurarStock(true);
    },
    onError: (err: Error) => setError(err.message),
  });

  if (isLoading) return <p className="text-surface-500">Cargando pedido…</p>;
  if (!pedido)   return <p className="text-danger-600">Pedido no encontrado.</p>;

  const nextStates = getNextStates(pedido.estado_codigo, esStaff);

  function handleAvanzar(estado: EstadoCodigo) {
    setError("");
    if (requiereMotivo(estado)) {
      if (!motivoCancelar.trim()) {
        setError("Para cancelar es obligatorio indicar un motivo.");
        return;
      }
      if (esStaff) {
        avanzarMutation.mutate({
          estado_hacia: estado,
          motivo: motivoCancelar,
          restaurar_stock: restaurarStock,
        });
      } else {
        cancelarMutation.mutate({ motivo: motivoCancelar, restaurarStock });
      }
    } else {
      avanzarMutation.mutate({ estado_hacia: estado });
    }
  }

  return (
    <>
      {/* Overlay "Pago aprobado" — se desvanece sobre el comprobante */}
      {overlayMounted && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-[900ms] ${overlayVisible ? "opacity-100" : "opacity-0"}`}
        >
          <div className="text-center space-y-4 px-8">
            <div className="text-8xl">✅</div>
            <h1 className="text-3xl font-bold text-surface-900">¡Pago aprobado!</h1>
            <p className="text-surface-600">Tu pedido fue confirmado y está siendo procesado.</p>
            {paymentComprobante && (
              <p className="text-xs text-surface-400">Comprobante MP: {paymentComprobante}</p>
            )}
          </div>
        </div>
      )}

    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to={esStaff ? "/admin/pedidos" : "/mis-pedidos"}
        className="text-sm text-brand-600 hover:underline"
      >
        ← Volver
      </Link>

      {/* Header */}
      <header className="bg-white rounded-2xl border border-surface-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-surface-900">
                Pedido #{pedido.id}
              </h1>
              <EstadoBadge estado={pedido.estado_codigo} />
            </div>
            <p className="text-sm text-surface-500">
              Creado el {formatDateTime(pedido.created_at)}
            </p>
            <p className="text-sm text-surface-500">
              Pago: <strong>{pedido.forma_pago_codigo}</strong>
              {pedido.direccion_id && (
                <> · Dirección #{pedido.direccion_id}</>
              )}
            </p>
            {pedido.notas && (
              <p className="text-sm text-surface-600 mt-2 italic">
                "{pedido.notas}"
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-surface-500">Total</p>
            <p className="text-2xl font-bold text-brand-700">
              {formatARS(pedido.total)}
            </p>
          </div>
        </div>
      </header>

      {/* Detalles (snapshot pattern) */}
      <section className="bg-white rounded-2xl border border-surface-200 p-6">
        <h2 className="font-bold text-surface-900 mb-4">Items</h2>
        <ul className="divide-y divide-surface-100">
          {pedido.detalles.map((d) => (
            <li
              key={d.producto_id}
              className="py-3 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-surface-900">
                  {d.cantidad}× {d.nombre_snapshot}
                </p>
                <p className="text-xs text-surface-500">
                  {formatARS(d.precio_snapshot)} c/u
                </p>
                {d.personalizacion && d.personalizacion.length > 0 && (
                  <p className="text-xs text-purple-600 mt-1">
                    Sin: {d.personalizacion.join(", ")}
                  </p>
                )}
              </div>
              <p className="font-semibold">{formatARS(d.subtotal_snap)}</p>
            </li>
          ))}
        </ul>

        <div className="border-t border-surface-200 mt-4 pt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-surface-600">Subtotal</span>
            <span>{formatARS(pedido.subtotal)}</span>
          </div>
          {toNumber(pedido.descuento) > 0 && (
            <div className="flex justify-between text-success-700">
              <span>Descuento</span>
              <span>−{formatARS(pedido.descuento)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-surface-600">Envío</span>
            <span>{formatARS(pedido.costo_envio)}</span>
          </div>
          <div className="flex justify-between font-bold pt-2 border-t border-surface-100">
            <span>Total</span>
            <span className="text-brand-700">{formatARS(pedido.total)}</span>
          </div>
        </div>
      </section>

      {/* Completar pago — solo para ESPERANDO_PAGO con init_point disponible */}
      {pedido.estado_codigo === "ESPERANDO_PAGO" && pedido.init_point && (
        <section className="bg-warning-50 rounded-2xl border border-warning-200 p-6 space-y-3">
          <h2 className="font-bold text-warning-800">Pago pendiente</h2>
          <p className="text-sm text-warning-700">
            Este pedido fue creado pero el pago no fue completado. Podés retomar el pago
            o cancelar el pedido si ya no lo necesitás.
          </p>
          <div className="flex gap-3 flex-wrap">
            <a
              href={pedido.init_point}
              className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors"
            >
              Completar pago con MercadoPago
            </a>
          </div>
        </section>
      )}

      {/* Acciones de FSM */}
      {nextStates.length > 0 && (
        <section className="bg-white rounded-2xl border border-surface-200 p-6">
          <h2 className="font-bold text-surface-900 mb-4">
            {esStaff ? "Avanzar estado" : "Acciones"}
          </h2>

          {/* Si entre los siguientes hay CANCELADO, mostrar motivo + opción de stock */}
          {nextStates.includes("CANCELADO") && (
            <div className="mb-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">
                  Motivo (obligatorio para cancelar)
                </label>
                <input
                  type="text"
                  value={motivoCancelar}
                  onChange={(e) => setMotivoCancelar(e.target.value)}
                  placeholder="Ej: sin stock, cliente arrepentido…"
                  className="w-full px-3 py-2 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className={`rounded-xl border p-3 ${restaurarStock ? "bg-success-50 border-success-200" : "bg-warning-50 border-warning-200"}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restaurarStock}
                    onChange={(e) => setRestaurarStock(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-brand-600 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-semibold text-surface-800">
                      Restaurar stock de insumos
                    </p>
                    <p className="text-xs text-surface-500 mt-0.5">
                      {restaurarStock
                        ? "Se devolverá el stock de los ingredientes usados en este pedido."
                        : "El stock NO se devolverá (usalo cuando los ingredientes ya fueron consumidos en elaboración)."}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {nextStates.map((s) => (
              <button
                key={s}
                onClick={() => handleAvanzar(s)}
                disabled={
                  avanzarMutation.isPending || cancelarMutation.isPending
                }
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                  s === "CANCELADO"
                    ? "bg-danger-500 text-white hover:bg-danger-600"
                    : "bg-brand-600 text-white hover:bg-brand-700"
                }`}
              >
                → {ESTADO_LABELS[s]}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-3 rounded-xl bg-danger-50 border border-danger-200 px-3 py-2 text-sm text-danger-700">
              {error}
            </div>
          )}
        </section>
      )}

      {/* Historial */}
      <section className="bg-white rounded-2xl border border-surface-200 p-6">
        <h2 className="font-bold text-surface-900 mb-4">Historial</h2>
        <HistorialList historial={historial ?? []} />
      </section>
    </div>
    </>
  );
}