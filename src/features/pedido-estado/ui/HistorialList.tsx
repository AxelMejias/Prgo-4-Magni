import type { HistorialEstado } from "../../../entities/pedido/model";
import { formatDateTime } from "../../../shared/lib/format";
import { ESTADO_LABELS } from "../lib/fsm";

interface Props {
  historial: HistorialEstado[];
}

function getEntryDisplay(h: HistorialEstado): { icon: string; label: string } {
  const hacia = h.estado_hacia;
  const desde = h.estado_desde;

  if (!desde) {
    return { icon: "📋", label: `Pedido creado en ${ESTADO_LABELS[hacia] ?? hacia}` };
  }

  if (hacia === "CANCELADO") {
    return { icon: "❌", label: `Cancelado (era: ${ESTADO_LABELS[desde] ?? desde})` };
  }
  if (hacia === "CONFIRMADO") {
    return { icon: "✅", label: "Pedido confirmado" };
  }
  if (hacia === "EN_PREP") {
    return { icon: "👨‍🍳", label: "En preparación" };
  }
  if (hacia === "ENTREGADO") {
    return { icon: "🎉", label: "Entregado" };
  }

  return { icon: "↗", label: `${ESTADO_LABELS[desde] ?? desde} → ${ESTADO_LABELS[hacia] ?? hacia}` };
}

export default function HistorialList({ historial }: Props) {
  if (!historial.length) {
    return <p className="text-sm text-surface-500">Sin historial.</p>;
  }

  // Más reciente primero — el índice 0 es el estado actual
  const ordenado = [...historial].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <ol className="space-y-0">
      {ordenado.map((h, idx) => {
        const { icon, label } = getEntryDisplay(h);
        const esCurrent = idx === 0;
        const esUltimo  = idx === ordenado.length - 1;

        return (
          <li key={h.id} className="flex gap-3 text-sm">
            {/* ── Línea vertical + indicador ── */}
            <div className="flex flex-col items-center shrink-0">
              {/* Indicador */}
              <div
                className={`mt-0.5 rounded-full flex items-center justify-center shrink-0 ${
                  esCurrent
                    ? "w-7 h-7 bg-brand-600 text-white text-base shadow-md shadow-brand-200"
                    : "w-5 h-5 bg-surface-200 text-surface-500 text-xs"
                }`}
              >
                {esCurrent ? icon : "·"}
              </div>
              {/* Conector hacia el siguiente */}
              {!esUltimo && (
                <div className="w-0.5 flex-1 my-1 bg-surface-200" />
              )}
            </div>

            {/* ── Contenido ── */}
            <div className={`pb-4 flex-1 ${esCurrent ? "pb-2" : ""}`}>
              {esCurrent && (
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 border border-brand-200 rounded-full px-2 py-0.5 mb-1">
                  Estado actual
                </span>
              )}
              <p className={`font-medium leading-snug ${esCurrent ? "text-surface-900" : "text-surface-500"}`}>
                {!esCurrent && <span className="mr-1.5">{icon}</span>}
                {label}
              </p>
              <p className="text-xs text-surface-400 mt-0.5">{formatDateTime(h.created_at)}</p>
              {h.motivo && (
                <p className="text-xs italic text-surface-500 mt-1">{h.motivo}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
