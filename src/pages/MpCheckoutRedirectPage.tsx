import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

// Página puente: el popup abre esta URL primero para marcar sessionStorage,
// luego redirige a MP. Cuando MP devuelve al popup a /pedido-exitoso, la
// marca persiste y esa página puede cerrarse automáticamente.
export default function MpCheckoutRedirectPage() {
  const [params] = useSearchParams();
  const url = params.get("url") ?? "";

  useEffect(() => {
    sessionStorage.setItem("mp_popup", "1");
    if (url) window.location.href = url;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm text-surface-400">Redirigiendo a MercadoPago…</p>
    </div>
  );
}
