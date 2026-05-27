import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCartStore } from "../features/cart/model/cartStore";
import { pedidoApi } from "../entities/pedido/api";
import { direccionApi, type Direccion } from "../entities/direccion/api";
import { formatARS } from "../shared/lib/format";
import type { PedidoCreate } from "../entities/pedido/model";
import type { InsumoFaltante, StockInsuficienteError } from "../types";

const COSTO_ENVIO = 50;

type TipoEntrega = "retiro" | "domicilio";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);

  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>("retiro");
  const [direccionId, setDireccionId] = useState<number | "">("");
  const [formaPago, setFormaPago] = useState("");
  const [notas, setNotas] = useState("");
  const [formError, setFormError] = useState("");
  const [faltantes, setFaltantes] = useState<InsumoFaltante[]>([]);

  const { data: formasPago, isLoading: loadingPago } = useQuery({
    queryKey: ["formas-pago"],
    queryFn: pedidoApi.getFormasPago,
  });

  const { data: direccionesData } = useQuery({
    queryKey: ["mis-direcciones-checkout"],
    queryFn: () => direccionApi.getAll(1, 50),
  });
  const direcciones: Direccion[] = direccionesData?.items ?? [];

  const subtotal = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const costo_envio = tipoEntrega === "domicilio" ? COSTO_ENVIO : 0;
  const total = subtotal + costo_envio;

  const crearPedidoMutation = useMutation({
    mutationFn: (payload: PedidoCreate) => pedidoApi.create(payload),
    onSuccess: () => {
      clearCart();
      navigate("/mis-pedidos");
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: StockInsuficienteError } };
      const data = axiosErr?.response?.data;
      if (data?.code === "STOCK_INSUFICIENTE") {
        setFaltantes(data.faltantes);
        setFormError("No hay stock suficiente para completar el pedido.");
      } else {
        setFaltantes([]);
        setFormError((err as Error).message ?? "Error al crear el pedido.");
      }
    },
  });

  function handleTipoEntrega(tipo: TipoEntrega) {
    setTipoEntrega(tipo);
    setDireccionId("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFaltantes([]);

    if (items.length === 0) {
      setFormError("El carrito está vacío.");
      return;
    }
    if (!formaPago) {
      setFormError("Seleccioná una forma de pago.");
      return;
    }
    if (tipoEntrega === "domicilio" && direccionId === "") {
      setFormError("Seleccioná una dirección de entrega.");
      return;
    }

    const payload: PedidoCreate = {
      forma_pago_codigo: formaPago,
      direccion_id: tipoEntrega === "domicilio" && direccionId !== "" ? Number(direccionId) : null,
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

          {/* Tipo de entrega */}
          <section className="bg-white rounded-2xl border border-surface-200 p-5">
            <h2 className="font-bold text-surface-900 mb-4">🚚 Tipo de entrega</h2>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex flex-col items-center gap-2 cursor-pointer p-4 rounded-xl border-2 transition-all ${
                  tipoEntrega === "retiro"
                    ? "border-brand-500 bg-brand-50"
                    : "border-surface-200 hover:border-brand-300"
                }`}
              >
                <input
                  type="radio"
                  name="tipo_entrega"
                  className="sr-only"
                  checked={tipoEntrega === "retiro"}
                  onChange={() => handleTipoEntrega("retiro")}
                />
                <span className="text-2xl">🏪</span>
                <span className="text-sm font-semibold text-surface-800">Retiro en local</span>
                <span className="text-xs text-success-600 font-bold">Sin costo adicional</span>
              </label>

              <label
                className={`flex flex-col items-center gap-2 cursor-pointer p-4 rounded-xl border-2 transition-all ${
                  tipoEntrega === "domicilio"
                    ? "border-brand-500 bg-brand-50"
                    : "border-surface-200 hover:border-brand-300"
                }`}
              >
                <input
                  type="radio"
                  name="tipo_entrega"
                  className="sr-only"
                  checked={tipoEntrega === "domicilio"}
                  onChange={() => handleTipoEntrega("domicilio")}
                />
                <span className="text-2xl">🏠</span>
                <span className="text-sm font-semibold text-surface-800">Envío a domicilio</span>
                <span className="text-xs text-surface-500 font-bold">+{formatARS(COSTO_ENVIO)}</span>
              </label>
            </div>
          </section>

          {/* Dirección (solo si eligió domicilio) */}
          {tipoEntrega === "domicilio" && (
            <section className="bg-white rounded-2xl border border-surface-200 p-5">
              <h2 className="font-bold text-surface-900 mb-4">📍 Dirección de entrega</h2>

              {direcciones.length === 0 ? (
                <div className="text-center py-4 space-y-3">
                  <p className="text-sm text-surface-500">
                    No tenés direcciones guardadas.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/mis-direcciones")}
                    className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
                  >
                    Agregar dirección
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {direcciones.map((dir) => (
                    <label
                      key={dir.id}
                      className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-colors ${
                        direccionId === dir.id
                          ? "border-brand-400 bg-brand-50"
                          : "border-surface-200 hover:border-brand-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="direccion"
                        value={dir.id}
                        checked={direccionId === dir.id}
                        onChange={() => setDireccionId(dir.id)}
                        className="accent-brand-600"
                      />
                      <div className="text-sm flex-1">
                        {dir.alias && (
                          <p className="font-semibold text-brand-700">{dir.alias}</p>
                        )}
                        <p className="text-surface-700">{dir.linea1}</p>
                        <p className="text-surface-500 text-xs">
                          {dir.ciudad}{dir.provincia ? `, ${dir.provincia}` : ""}
                        </p>
                      </div>
                      {dir.es_principal && (
                        <span className="text-[10px] bg-brand-100 text-brand-700 font-bold px-2 py-0.5 rounded-full">
                          Principal
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Forma de pago */}
          <section className="bg-white rounded-2xl border border-surface-200 p-5">
            <h2 className="font-bold text-surface-900 mb-4">💳 Forma de pago</h2>

            {loadingPago ? (
              <p className="text-sm text-surface-500">Cargando…</p>
            ) : (
              <div className="space-y-2">
                {formasPago
                  ?.filter((fp) => fp.habilitado)
                  .sort((a, b) => {
                    const orden: Record<string, number> = { TRANSFERENCIA: 0, EFECTIVO: 1 };
                    return (orden[a.codigo] ?? 99) - (orden[b.codigo] ?? 99);
                  })
                  .map((fp) => (
                    <label
                      key={fp.codigo}
                      className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-colors ${
                        formaPago === fp.codigo
                          ? "border-brand-400 bg-brand-50"
                          : "border-surface-200 hover:border-brand-300"
                      }`}
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

          {/* Error general + detalle de stock insuficiente */}
          {formError && (
            <div className="bg-danger-50 border border-danger-200 rounded-xl px-4 py-3 space-y-3">
              <p className="text-sm text-danger-600 font-semibold">{formError}</p>

              {faltantes.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-danger-700 uppercase tracking-wide">
                    Insumos con stock insuficiente:
                  </p>
                  {faltantes.map((f) => (
                    <div
                      key={f.insumo_id}
                      className="flex items-center justify-between bg-white border border-danger-100 rounded-lg px-3 py-2 text-xs"
                    >
                      <span className="font-medium text-surface-800">{f.nombre}</span>
                      <div className="text-right text-surface-500 space-y-0.5">
                        <p>
                          Disponible:{" "}
                          <span className="text-danger-600 font-bold">
                            {f.stock_actual} {f.unidad_medida}
                          </span>
                        </p>
                        <p>
                          Necesario:{" "}
                          <span className="font-bold">
                            {f.stock_requerido} {f.unidad_medida}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                <span className={costo_envio === 0 ? "text-success-600 font-semibold" : ""}>
                  {costo_envio === 0 ? "Gratis" : formatARS(costo_envio)}
                </span>
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