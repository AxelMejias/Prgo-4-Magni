import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { pedidoApi } from "../entities/pedido/api";
import type { EstadoCodigo } from "../entities/pedido/model";
import { useAuthStore } from "../shared/store/authStore";
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
  const queryClient = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const esStaff = hasRole(["ADMIN", "COCINERO"]);

  const [motivoCancelar, setMotivoCancelar] = useState("");
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
    }: {
      estado_hacia: EstadoCodigo;
      motivo?: string;
    }) => pedidoApi.avanzarEstado(pedidoId, { estado_hacia, motivo }),
    onSuccess: () => {
      invalidarPedido();
      setError("");
      setMotivoCancelar("");
    },
    onError: (err: Error) => setError(err.message),
  });

  const cancelarMutation = useMutation({
    mutationFn: (motivo: string) => pedidoApi.cancelar(pedidoId, motivo),
    onSuccess: () => {
      invalidarPedido();
      setError("");
      setMotivoCancelar("");
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
      // CLIENT usa /cancelar, STAFF usa /avanzar
      if (esStaff) {
        avanzarMutation.mutate({
          estado_hacia: estado,
          motivo: motivoCancelar,
        });
      } else {
        cancelarMutation.mutate(motivoCancelar);
      }
    } else {
      avanzarMutation.mutate({ estado_hacia: estado });
    }
  }

  return (
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

      {/* Acciones de FSM */}
      {nextStates.length > 0 && (
        <section className="bg-white rounded-2xl border border-surface-200 p-6">
          <h2 className="font-bold text-surface-900 mb-4">
            {esStaff ? "Avanzar estado" : "Acciones"}
          </h2>

          {/* Si entre los siguientes hay CANCELADO, mostrar input de motivo */}
          {nextStates.includes("CANCELADO") && (
            <div className="mb-4">
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
  );
}