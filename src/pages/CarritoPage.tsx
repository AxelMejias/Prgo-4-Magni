import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { useCartStore } from "../features/cart/model/cartStore";
import { productosApi } from "../services/api";
import { useStoreCatalogoRealtime } from "../shared/hooks/useStoreCatalogoRealtime";
import { formatARS } from "../shared/lib/format";

export default function CarritoPage() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const updateCantidad = useCartStore((s) => s.updateCantidad);
  const removeItem = useCartStore((s) => s.removeItem);
  const setItemStock = useCartStore((s) => s.setItemStock);
  const clear = useCartStore((s) => s.clear);

  // Stock en vivo de los productos del carrito. La key arranca con ["productos"]
  // para que el canal realtime de la tienda (que invalida ["productos"]) refresque
  // estos datos cuando otro cliente consume stock.
  useStoreCatalogoRealtime();
  const stockQueries = useQueries({
    queries: items.map((it) => ({
      queryKey: ["productos", "cart-stock", it.producto_id],
      queryFn: () => productosApi.getById(it.producto_id),
      staleTime: 0,
    })),
  });

  // Stock disponible por producto (null = sin receta / sin límite).
  const stockById = new Map<number, number | null>();
  items.forEach((it, idx) => {
    const d = stockQueries[idx]?.data;
    if (d) stockById.set(it.producto_id, d.stock_disponible);
  });

  // Sincroniza el tope en vivo hacia el store (recorta cantidades si bajó el stock).
  useEffect(() => {
    items.forEach((it, idx) => {
      const d = stockQueries[idx]?.data;
      if (d && it.stock !== d.stock_disponible) {
        setItemStock(it.producto_id, d.stock_disponible);
      }
    });
  });

  function stockDe(producto_id: number, fallback?: number | null): number | null {
    return stockById.has(producto_id) ? stockById.get(producto_id)! : fallback ?? null;
  }
  function estaSinStock(producto_id: number, fallback?: number | null): boolean {
    const s = stockDe(producto_id, fallback);
    return s !== null && s <= 0;
  }

  const haySinStock = items.some((it) => estaSinStock(it.producto_id, it.stock));
  const isValidando = stockQueries.some((q) => q.isLoading);
  // El total excluye los ítems sin stock (no se van a poder comprar).
  const subtotal = items.reduce(
    (acc, it) => (estaSinStock(it.producto_id, it.stock) ? acc : acc + it.precio * it.cantidad),
    0
  );

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-xl font-bold text-surface-900 mb-2">
          Tu carrito está vacío
        </h1>
        <p className="text-surface-500 mb-6">
          Volvé al catálogo y agregá algo rico.
        </p>
        <Link
          to="/tienda"
          className="inline-block px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Mi carrito</h1>
        <button
          onClick={() => {
            if (confirm("¿Vaciar el carrito?")) clear();
          }}
          className="text-xs text-danger-600 hover:text-danger-700 font-semibold"
        >
          Vaciar
        </button>
      </header>

      {haySinStock && (
        <div className="flex items-start gap-3 bg-danger-50 border border-danger-200 rounded-xl px-4 py-3 text-sm text-danger-700">
          <span className="shrink-0 mt-0.5">⚠️</span>
          <span>
            Algún producto se quedó <strong>sin stock</strong> mientras estaba en tu carrito.
            Quitalo para poder continuar con la compra.
          </span>
        </div>
      )}

      <ul className="space-y-3">
        {items.map((it) => {
          const stock = stockDe(it.producto_id, it.stock);
          const sinStock = stock !== null && stock <= 0;
          const enMaximo = stock !== null && stock > 0 && it.cantidad >= stock;

          if (sinStock) {
            return (
              <li
                key={it.producto_id}
                className="bg-surface-50 rounded-2xl border border-danger-200 p-4 flex items-center gap-4 opacity-90"
              >
                <div className="w-14 h-14 bg-white border border-surface-100 rounded-xl flex items-center justify-center text-2xl shrink-0 overflow-hidden grayscale">
                  {it.image_url ? (
                    <img src={it.image_url} alt={it.nombre} className="w-full h-full object-contain" />
                  ) : (
                    <span>🍔</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-surface-500 truncate line-through">{it.nombre}</h3>
                  <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold uppercase tracking-wide bg-danger-100 text-danger-700 px-1.5 py-0.5 rounded">
                    ⚠️ Sin stock
                  </span>
                </div>
                <button
                  onClick={() => removeItem(it.producto_id)}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-danger-500 text-white text-xs font-semibold hover:bg-danger-600 transition cursor-pointer"
                >
                  Quitar
                </button>
              </li>
            );
          }

          return (
            <li
              key={it.producto_id}
              className="bg-white rounded-2xl border border-surface-200 p-4 flex items-center gap-4"
            >
              <div className="w-14 h-14 bg-white border border-surface-100 rounded-xl flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                {it.image_url ? (
                  <img src={it.image_url} alt={it.nombre} className="w-full h-full object-contain" />
                ) : (
                  <span>🍔</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-surface-900 truncate">
                  {it.nombre}
                </h3>
                <p className="text-xs text-surface-500">
                  {formatARS(it.precio)} c/u
                </p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateCantidad(it.producto_id, it.cantidad - 1)}
                    disabled={it.cantidad <= 1}
                    className={`w-7 h-7 rounded-lg border text-sm font-bold transition-colors ${
                      it.cantidad <= 1
                        ? "border-surface-200 text-surface-300 cursor-not-allowed"
                        : "border-surface-300 text-surface-700 hover:bg-surface-100 cursor-pointer"
                    }`}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={stock ?? undefined}
                    value={it.cantidad}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 1) updateCantidad(it.producto_id, val);
                    }}
                    className="w-10 text-center text-sm font-semibold border border-surface-200 rounded-lg py-0.5 focus:outline-none focus:ring-2 focus:ring-brand-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => updateCantidad(it.producto_id, it.cantidad + 1)}
                    disabled={enMaximo}
                    className={`w-7 h-7 rounded-lg border text-sm font-bold transition-colors ${
                      enMaximo
                        ? "border-surface-200 text-surface-300 cursor-not-allowed"
                        : "border-surface-300 text-surface-700 hover:bg-surface-100 cursor-pointer"
                    }`}
                  >
                    +
                  </button>
                </div>
                {stock != null && (
                  <span
                    className={`text-[10px] font-semibold ${
                      enMaximo ? "text-warning-600" : "text-surface-400"
                    }`}
                  >
                    {enMaximo ? `Máximo: ${stock}` : `${stock} disponibles`}
                  </span>
                )}
              </div>
              <div className="w-24 text-right font-bold text-brand-700">
                {formatARS(it.precio * it.cantidad)}
              </div>
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar "${it.nombre}" del carrito?`)) removeItem(it.producto_id);
                }}
                className="text-danger-500 hover:text-danger-700 text-xl cursor-pointer"
                title="Eliminar"
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>

      <div className="bg-white rounded-2xl border border-surface-200 p-5 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-surface-600">Subtotal</span>
          <span className="font-semibold">{formatARS(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-surface-600">Envío</span>
          <span className="text-surface-500 italic">se calcula al confirmar</span>
        </div>
        <div className="flex justify-between text-lg pt-3 border-t border-surface-200">
          <span className="font-bold">Estimado</span>
          <span className="font-bold text-brand-700">{formatARS(subtotal)}</span>
        </div>
        <button
          onClick={() => navigate("/checkout")}
          disabled={haySinStock || isValidando}
          className={`w-full mt-3 px-5 py-3 rounded-xl font-semibold transition-colors ${
            haySinStock || isValidando
              ? "bg-surface-200 text-surface-400 cursor-not-allowed"
              : "bg-brand-600 text-white hover:bg-brand-700 cursor-pointer"
          }`}
        >
          {haySinStock
            ? "Quitá los productos sin stock para continuar"
            : isValidando
            ? "Verificando stock…"
            : "Realizar pedido →"}
        </button>
      </div>
    </div>
  );
}