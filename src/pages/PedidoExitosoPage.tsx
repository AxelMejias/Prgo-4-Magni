import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCartStore } from "../features/cart/model/cartStore";

const REDIRECT_SECONDS = 5;

export default function PedidoExitosoPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const clearCart = useCartStore((s) => s.clear);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  const mpStatus = params.get("collection_status") ?? params.get("status") ?? "approved";
  const pedidoId = params.get("external_reference");
  const paymentId = params.get("payment_id") ?? params.get("collection_id");

  const isApproved = mpStatus === "approved";
  const isPending  = mpStatus === "pending" || mpStatus === "in_process";
  const isFailure  = !isApproved && !isPending;

  const redirectTarget = pedidoId ? `/mis-pedidos/${pedidoId}` : "/mis-pedidos";

  // Detectar si estamos dentro del popup abierto por CheckoutPage.
  // Usamos sessionStorage (sobrevive navegaciones dentro de la misma pestaña)
  // porque window.opener puede ser nulificado por COOP cuando el popup pasa por MP.
  const [isPopup] = useState(() => sessionStorage.getItem("mp_popup") === "1");

  useEffect(() => {
    if (!isPopup) return;
    // Limpiar la marca y señalar al main window para que detecte el resultado
    sessionStorage.removeItem("mp_popup");
    localStorage.setItem(
      "mp_pago_resultado",
      JSON.stringify({
        pedido_id: pedidoId ? parseInt(pedidoId) : null,
        status: mpStatus,
        payment_id: paymentId ? parseInt(paymentId) : null,
      })
    );
    window.close();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isApproved && !isPopup) clearCart();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isFailure || isPopup) return;
    if (countdown <= 0) {
      navigate(redirectTarget);
      return;
    }
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown, navigate, isFailure, isPopup, redirectTarget]);

  // No renderizar nada en el popup — se está cerrando
  if (isPopup) return null;

  if (isApproved) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-6">
        <div className="text-7xl">✅</div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">¡Pago aprobado!</h1>
          {pedidoId && (
            <p className="text-surface-500 mt-1 text-sm">Pedido #{pedidoId}</p>
          )}
          {paymentId && (
            <p className="text-xs text-surface-400 mt-0.5">Comprobante MP: {paymentId}</p>
          )}
        </div>
        <p className="text-surface-600 text-sm">
          Tu pedido fue confirmado y está siendo procesado.
        </p>
        <div className="bg-success-50 border border-success-200 rounded-2xl p-4 space-y-2">
          <p className="text-success-700 text-sm font-medium">
            Redirigiendo a tu pedido en {countdown}s…
          </p>
          <div className="h-1.5 bg-success-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-success-500 transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / REDIRECT_SECONDS) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(redirectTarget)}
            className="px-6 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
          >
            Ver mi pedido
          </button>
          <button
            onClick={() => navigate("/mis-pedidos")}
            className="px-6 py-2.5 rounded-xl border border-surface-300 text-surface-700 font-semibold hover:bg-surface-50 transition-colors"
          >
            Mis pedidos
          </button>
          <button
            onClick={() => navigate("/tienda")}
            className="px-6 py-2.5 rounded-xl border border-surface-300 text-surface-700 font-semibold hover:bg-surface-50 transition-colors"
          >
            Ir a la tienda
          </button>
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-6">
        <div className="text-7xl">⏳</div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Pago en proceso</h1>
          {pedidoId && (
            <p className="text-surface-500 mt-1 text-sm">Pedido #{pedidoId}</p>
          )}
        </div>
        <p className="text-surface-600 text-sm">
          Tu pago está pendiente de confirmación. Te notificaremos cuando se acredite.
        </p>
        <div className="bg-warning-50 border border-warning-200 rounded-2xl p-4 space-y-2">
          <p className="text-warning-700 text-sm font-medium">
            Redirigiendo a tus pedidos en {countdown}s…
          </p>
          <div className="h-1.5 bg-warning-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-warning-500 transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / REDIRECT_SECONDS) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate("/mis-pedidos")}
            className="px-6 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
          >
            Ver mis pedidos
          </button>
          <button
            onClick={() => navigate("/tienda")}
            className="px-6 py-2.5 rounded-xl border border-surface-300 text-surface-700 font-semibold hover:bg-surface-50 transition-colors"
          >
            Ir a la tienda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto text-center py-16 space-y-6">
      <div className="text-7xl">❌</div>
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Pago no completado</h1>
        {pedidoId && (
          <p className="text-surface-500 mt-1 text-sm">Pedido #{pedidoId}</p>
        )}
      </div>
      <p className="text-surface-600 text-sm">
        El pago no fue procesado. Tu pedido está guardado — podés cancelarlo
        o intentar pagar nuevamente desde <strong>Mis pedidos</strong>.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => navigate(redirectTarget)}
          className="px-6 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
        >
          Ver mi pedido
        </button>
        <button
          onClick={() => navigate("/tienda")}
          className="px-6 py-2.5 rounded-xl border border-surface-300 text-surface-700 font-semibold hover:bg-surface-50 transition-colors"
        >
          Volver a la tienda
        </button>
      </div>
    </div>
  );
}
