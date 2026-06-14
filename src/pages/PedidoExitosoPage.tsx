import { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCartStore } from "../features/cart/model/cartStore";
import { useUiStore } from "../shared/store/uiStore";
import { pedidoApi } from "../entities/pedido/api";

export default function PedidoExitosoPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const clearCart = useCartStore((s) => s.clear);
  const showPaymentOverlay = useUiStore((s) => s.showPaymentOverlay);
  const confirmedRef = useRef(false);

  const mpStatus = params.get("collection_status") ?? params.get("status") ?? "approved";
  const pedidoId = params.get("external_reference");
  const paymentId = params.get("payment_id") ?? params.get("collection_id");

  const isApproved = mpStatus === "approved";
  const isPending  = mpStatus === "pending" || mpStatus === "in_process";
  const isFailure  = !isApproved && !isPending;

  // Approved: esperar confirmación del backend antes de navegar
  useEffect(() => {
    if (!isApproved || confirmedRef.current) return;
    confirmedRef.current = true;
    clearCart();
    if (pedidoId) {
      showPaymentOverlay(paymentId ?? undefined);
      pedidoApi.confirmarPagoMp(Number(pedidoId))
        .catch(() => {})
        .finally(() => {
          navigate(`/mis-pedidos/${pedidoId}`, { replace: true });
        });
    } else {
      navigate("/mis-pedidos", { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pending: redirigir a mis-pedidos tras un momento
  useEffect(() => {
    if (!isPending) return;
    const t = setTimeout(() => navigate("/mis-pedidos", { replace: true }), 3000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isPending) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-6">
        <div className="text-7xl">⏳</div>
        <h1 className="text-2xl font-bold text-surface-900">Pago en proceso</h1>
        <p className="text-surface-600 text-sm">
          Tu pago está pendiente de confirmación. Te notificaremos cuando se acredite.
        </p>
        <p className="text-surface-400 text-xs">Redirigiendo a tus pedidos…</p>
      </div>
    );
  }

  if (isFailure) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-6">
        <div className="text-7xl">❌</div>
        <h1 className="text-2xl font-bold text-surface-900">Pago no completado</h1>
        <p className="text-surface-600 text-sm">
          El pago fue cancelado o rechazado. No se realizó ningún cargo ni se creó ningún pedido.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate("/store")}
            className="px-6 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
          >
            Volver a la tienda
          </button>
          <button
            onClick={() => navigate("/carrito")}
            className="px-6 py-2.5 rounded-xl border border-surface-300 text-surface-700 font-semibold hover:bg-surface-50 transition-colors"
          >
            Ver carrito
          </button>
        </div>
      </div>
    );
  }

  // Approved: se navega inmediatamente, este return es solo el instante antes
  return null;
}
