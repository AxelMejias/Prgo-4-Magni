import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../features/cart/model/cartStore";
import { formatARS } from "../shared/lib/format";

export default function CarritoPage() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const updateCantidad = useCartStore((s) => s.updateCantidad);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);

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

      <ul className="space-y-3">
        {items.map((it) => (
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
                value={it.cantidad}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1) updateCantidad(it.producto_id, val);
                }}
                className="w-10 text-center text-sm font-semibold border border-surface-200 rounded-lg py-0.5 focus:outline-none focus:ring-2 focus:ring-brand-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => updateCantidad(it.producto_id, it.cantidad + 1)}
                className="w-7 h-7 rounded-lg border border-surface-300 text-surface-700 hover:bg-surface-100 cursor-pointer"
              >
                +
              </button>
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
        ))}
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
          className="w-full mt-3 px-5 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
        >
          Realizar pedido →
        </button>
      </div>
    </div>
  );
}