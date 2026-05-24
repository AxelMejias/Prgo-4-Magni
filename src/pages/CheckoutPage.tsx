import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCartStore } from "../features/cart/model/cartStore";
import { pedidoApi } from "../entities/pedido/api";
import { direccionApi, type Direccion } from "../entities/direccion/api";
import { formatARS, toNumber } from "../shared/lib/format";
import type { PedidoCreate } from "../entities/pedido/model";

const COSTO_ENVIO = 50;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);

  const [direccionId, setDireccionId] = useState<number | "">("");
  const [formaPago, setFormaPago] = useState("");
  const [notas, setNotas] = useState("");
  const [formError, setFormError] = useState("");

  // Catálogos del backend
  const { data: formasPago, isLoading: loadingPago } = useQuery({
    queryKey: ["formas-pago"],
    queryFn: pedidoApi.getFormasPago,
  });

  const { data: direccionesData } = useQuery({
    queryKey: ["mis-direcciones-checkout"],
    queryFn: () => direccionApi.getAll(1, 50),
  });
  const direcciones: Direccion[] = direccionesData?.items ?? [];

  // Totales
  const subtotal = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const total = subtotal + COSTO_ENVIO;

  const crearPedidoMutation = useMutation({
    mutationFn: (payload: PedidoCreate) => pedidoApi.create(payload),
    onSuccess: () => {
      clearCart();
      navigate("/mis-pedidos");
    },
    onError: (err: Error) => setFormError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (items.length === 0) {
      setFormError("El carrito está vacío.");
      return;
    }
    if (!formaPago) {
      setFormError("Seleccioná una forma de pago.");
      return;
    }

    const payload: PedidoCreate = {
      forma_pago_codigo: formaPago,
      direccion_id: direccionId !== "" ? Number(direccionId) : null,
      notas: notas.trim() || null,
      items: items.map((i) => ({
        producto_id: i.producto_id,
        cantidad: i.cantidad,
        personalizacion: i.personalizacion ?? null,
      })),
    };

    crearPedidoMutation.mutate(payload);
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-4">
        <p className="text-4xl">🛒</p>
        <p className="text-surface-500">Tu carrito está vacío.</p>
        <button
          onClick={() => navigate("/tienda")}
          className="px-6 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
        >
          Ir a la tienda
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-surface-900">Confirmar Pedido</h1>
        <p className="text-sm text-surface-500">
          Revisá tu pedido y completá los datos de entrega.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* ─── Formulario ──────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Dirección de entrega */}
          <section className="bg-white rounded-2xl border border-surface-200 p-5">
            <h2 className="font-bold text-surface-900 mb-4">📍 Dirección de entrega</h2>

            {direcciones.length === 0 ? (
              <p className="text-sm text-surface-500">
                No tenés direcciones guardadas.{" "}
                <button
                  type="button"
                  onClick={() => navigate("/mis-direcciones")}
                  className="text-brand-600 hover:underline"
                >
                  Agregar una
                </button>{" "}
                o elegí retiro en local.
              </p>
            ) : (
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-surface-200 hover:border-brand-300 transition-colors">
                  <input
                    type="radio"
                    name="direccion"
                    value=""
                    checked={direccionId === ""}
                    onChange={() => setDireccionId("")}
                    className="accent-brand-600"
                  />
                  <span className="text-sm text-surface-700">
                    🏪 Retiro en local (sin dirección)
                  </span>
                </label>

                {direcciones.map((dir) => (
                  <label
                    key={dir.id}
                    className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-surface-200 hover:border-brand-300 transition-colors"
                  >
                    <input
                      type="radio"
                      name="direccion"
                      value={dir.id}
                      checked={direccionId === dir.id}
                      onChange={() => setDireccionId(dir.id)}
                      className="accent-brand-600"
                    />
                    <div className="text-sm">
                      {dir.alias && (
                        <p className="font-semibold text-brand-700">{dir.alias}</p>
                      )}
                      <p className="text-surface-700">{dir.linea1}</p>
                      <p className="text-surface-500 text-xs">
                        {dir.ciudad}{dir.provincia ? `, ${dir.provincia}` : ""}
                      </p>
                    </div>
                    {dir.es_principal && (
                      <span className="ml-auto text-[10px] bg-brand-100 text-brand-700 font-bold px-2 py-0.5 rounded-full">
                        Principal
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </section>

          {/* Forma de pago */}
          <section className="bg-white rounded-2xl border border-surface-200 p-5">
            <h2 className="font-bold text-surface-900 mb-4">💳 Forma de pago</h2>

            {loadingPago ? (
              <p className="text-sm text-surface-500">Cargando…</p>
            ) : (
              <div className="space-y-2">
                {formasPago
                  ?.filter((fp) => fp.habilitado)
                  .map((fp) => (
                    <label
                      key={fp.codigo}
                      className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-surface-200 hover:border-brand-300 transition-colors"
                    >
                      <input
                        type="radio"
                        name="forma_pago"
                        value={fp.codigo}
                        checked={formaPago === fp.codigo}
                        onChange={() => setFormaPago(fp.codigo)}
                        className="accent-brand-600"
                      />
                      <span className="text-sm text-surface-700">{fp.descripcion}</span>
                    </label>
                  ))}
              </div>
            )}
          </section>

          {/* Notas */}
          <section className="bg-white rounded-2xl border border-surface-200 p-5">
            <h2 className="font-bold text-surface-900 mb-3">📝 Notas (opcional)</h2>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Instrucciones especiales, alergias, referencias…"
              className="w-full border border-surface-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </section>

          {formError && (
            <p className="text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-xl px-4 py-3">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={crearPedidoMutation.isPending}
            className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {crearPedidoMutation.isPending
              ? "Procesando pedido…"
              : `Confirmar pedido — ${formatARS(total)}`}
          </button>
        </form>

        {/* ─── Resumen ──────────────────────────────────────────────── */}
        <aside className="space-y-4">
          <div className="bg-white rounded-2xl border border-surface-200 p-5 sticky top-6">
            <h2 className="font-bold text-surface-900 mb-4">Resumen</h2>

            <ul className="divide-y divide-surface-100 mb-4">
              {items.map((item) => (
                <li key={item.producto_id} className="py-2.5 flex justify-between gap-2">
                  <div className="text-sm">
                    <p className="font-medium text-surface-900 line-clamp-1">
                      {item.cantidad}× {item.nombre}
                    </p>
                    <p className="text-xs text-surface-500">
                      {formatARS(item.precio)} c/u
                    </p>
                  </div>
                  <p className="text-sm font-semibold shrink-0">
                    {formatARS(item.precio * item.cantidad)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="space-y-1.5 text-sm border-t border-surface-200 pt-4">
              <div className="flex justify-between text-surface-600">
                <span>Subtotal</span>
                <span>{formatARS(subtotal)}</span>
              </div>
              <div className="flex justify-between text-surface-600">
                <span>Envío</span>
                <span>{formatARS(COSTO_ENVIO)}</span>
              </div>
              <div className="flex justify-between font-bold text-surface-900 pt-2 border-t border-surface-100">
                <span>Total</span>
                <span className="text-brand-700">{formatARS(total)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}