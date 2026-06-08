import type { HistorialEstado } from "../../../entities/pedido/model";
import { formatDateTime } from "../../../shared/lib/format";
import { ESTADO_LABELS } from "../lib/fsm";

interface Props {
  historial: HistorialEstado[];
}

function getEntryDisplay(h: HistorialEstado): { icon: string; iconColor: string; label: string } {
  const hacia = h.estado_hacia;
  const desde = h.estado_desde;

  if (!desde) {
    if (hacia === "ESPERANDO_PAGO") {
      return { icon: "🛒", iconColor: "text-brand-500", label: "Pedido creado — aguardando pago" };
    }
    return { icon: "📋", iconColor: "text-brand-500", label: `Pedido creado en ${ESTADO_LABELS[hacia] ?? hacia}` };
  }

  if (desde === "ESPERANDO_PAGO" && hacia === "PENDIENTE") {
    return { icon: "✅", iconColor: "text-success-600", label: "Pago confirmado" };
  }
  if (hacia === "CANCELADO") {
    return { icon: "❌", iconColor: "text-danger-500", label: `Cancelado (era: ${ESTADO_LABELS[desde] ?? desde})` };
  }
  if (hacia === "CONFIRMADO") {
    return { icon: "👍", iconColor: "text-brand-600", label: "Pedido confirmado por el local" };
  }
  if (hacia === "EN_PREP") {
    return { icon: "👨‍🍳", iconColor: "text-warning-600", label: "En preparación" };
  }
  if (hacia === "EN_CAMINO") {
    return { icon: "🚚", iconColor: "text-brand-500", label: "En camino" };
  }
  if (hacia === "ENTREGADO") {
    return { icon: "🎉", iconColor: "text-success-600", label: "Entregado" };
  }

  const desdeLabel = ESTADO_LABELS[desde] ?? desde;
  const haciaLabel = ESTADO_LABELS[hacia] ?? hacia;
  return { icon: "↗", iconColor: "text-surface-500", label: `${desdeLabel} → ${haciaLabel}` };
}

export default function HistorialList({ historial }: Props) {
  if (!historial.length) {
    return <p className="text-sm text-surface-500">Sin historial.</p>;
  }
  return (
    <ol className="space-y-3">
      {historial.map((h) => {
        const { icon, label } = getEntryDisplay(h);
        return (
          <li
            key={h.id}
            className="flex items-start gap-3 text-sm border-l-2 border-brand-200 pl-3"
          >
            <span className="text-base leading-tight">{icon}</span>
            <div className="flex-1">
              <p className="font-medium text-surface-800">{label}</p>
              <p className="text-xs text-surface-500">{formatDateTime(h.created_at)}</p>
              {h.motivo && (
                <p className="text-xs italic text-surface-600 mt-1">
                  {h.motivo}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
