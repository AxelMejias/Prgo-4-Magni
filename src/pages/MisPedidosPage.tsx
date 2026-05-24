// src/pages/CheckoutPage.tsx
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { pedidoApi } from "../entities/pedido/api";
import { direccionApi } from "../entities/direccion/api";
import type { PedidoCreate } from "../entities/pedido/model";
import { useCartStore } from "../features/cart/model/cartStore";
import { formatARS } from "../shared/lib/format";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const clearCart = useCartStore((s) => s.clear);

  const [formaPagoCodigo, setFormaPagoCodigo] = useState("");
  const [direccionId, setDireccionId] = useState<number | "">("");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");

  // ── useQuery #1: formas de pago habilitadas ───────────────────────────
  const { data: formasPago } = useQuery({
    queryKey: ["formas-pago"],
    queryFn: pedidoApi.getFormasPago,
  });

  // ── useQuery #2: direcciones del usuario ──────────────────────────────
  const { data: direccionesData } = useQuery({
    queryKey: ["direcciones"],
    queryFn: () => direccionApi.getAll(1, 50),
  });

  // ── useMutation: crear pedido ─────────────────────────────────────────
  const crearPedidoMutation = useMutation({
    mutationFn: (payload: PedidoCreate) => pedidoApi.create(payload),
    onSuccess: (pedido) => {
      // Invalidar caché del listado para que se vea el nuevo pedido
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      clearCart();
      navigate(`/mis-pedidos/${pedido.id}`, { replace: true });
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!formaPagoCodigo) {
      setError("Seleccioná una forma de pago.");
      return;
    }
    if (items.length === 0) {
      setError("Tu carrito está vacío.");
      return;
    }

    // Mapeo carrito → PedidoCreate (estructura exacta del backend)
    const payload: PedidoCreate = {
      forma_pago_codigo: formaPagoCodigo,
      direccion_id: direccionId === "" ? null : Number(direccionId),
      notas: notas.trim() || null,
      items: items.map((it) => ({
        producto_id: it.producto_id,
        cantidad: it.cantidad,
        personalizacion: it.personalizacion ?? null,
      })),
    };

    crearPedidoMutation.mutate(payload);
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-surface-500">
          No hay items en el carrito para confirmar.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Confirmar pedido</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-surface-200 p-6 space-y-5"
      >
        {/* Forma de pago */}
        <div>
          <label className="block text-sm font-semibold text-surface-800 mb-2">
            Forma de pago *
          </label>
          <select
            value={formaPagoCodigo}
            onChange={(e) => setFormaPagoCodigo(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Seleccionar...</option>
            {formasPago
              ?.filter((f) => f.habilitado)
              .map((f) => (
                <option key={f.codigo} value={f.codigo}>
                  {f.descripcion}
                </option>
              ))}
          </select>
        </div>

        {/* Dirección (opcional) */}
        <div>
          <label className="block text-sm font-semibold text-surface-800 mb-2">
            Dirección de entrega <span className="text-surface-500 font-normal">(opcional — si no, retira en local)</span>
          </label>
          <select
            value={direccionId}
            onChange={(e) =>
              setDireccionId(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full px-3 py-2 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Retiro en local</option>
            {direccionesData?.items.map((d) => (
              <option key={d.id} value={d.id}>
                {d.alias ? `${d.alias} — ` : ""}{d.linea1}, {d.ciudad}
                {d.es_principal ? " (principal)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-semibold text-surface-800 mb-2">
            Notas <span className="text-surface-500 font-normal">(opcional)</span>
          </label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Ej: tocar timbre, sin cebolla, etc."
            className="w-full px-3 py-2 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Resumen */}
        <div className="border-t border-surface-200 pt-4 space-y-2">
          <h3 className="text-sm font-semibold text-surface-800">Tu pedido</h3>
          <ul className="text-sm space-y-1">
            {items.map((it) => (
              <li key={it.producto_id} className="flex justify-between">
                <span className="text-surface-700">
                  {it.cantidad}× {it.nombre}
                </span>
                <span className="font-medium">
                  {formatARS(it.precio * it.cantidad)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between pt-2 border-t border-surface-100 font-bold">
            <span>Subtotal</span>
            <span className="text-brand-700">{formatARS(subtotal)}</span>
          </div>
          <p className="text-xs text-surface-500 italic">
            El total final (con envío) lo calcula el backend al confirmar.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700 whitespace-pre-line">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/carrito")}
            className="px-5 py-2.5 rounded-xl border border-surface-300 text-surface-700 font-semibold hover:bg-surface-100"
          >
            Volver
          </button>
          <button
            type="submit"
            disabled={crearPedidoMutation.isPending}
            className="flex-1 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:bg-surface-300 transition-colors"
          >
            {crearPedidoMutation.isPending
              ? "Enviando…"
              : "Confirmar pedido"}
          </button>
        </div>
      </form>
    </div>
  );
}