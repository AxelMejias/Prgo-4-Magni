import type { HistorialEstado } from "../../../entities/pedido/model";
import { formatDateTime } from "../../../shared/lib/format";
import { ESTADO_LABELS } from "../lib/fsm";

interface Props {
  historial: HistorialEstado[];
}

export default function HistorialList({ historial }: Props) {
  if (!historial.length) {
    return <p className="text-sm text-surface-500">Sin historial.</p>;
  }
  return (
    <ol className="space-y-3">
      {historial.map((h) => (
        <li
          key={h.id}
          className="flex items-start gap-3 text-sm border-l-2 border-brand-200 pl-3"
        >
          <div className="flex-1">
            <p className="font-medium text-surface-800">
              {h.estado_desde
                ? `${ESTADO_LABELS[h.estado_desde]} → ${ESTADO_LABELS[h.estado_hacia]}`
                : `Creado en ${ESTADO_LABELS[h.estado_hacia]}`}
            </p>
            <p className="text-xs text-surface-500">{formatDateTime(h.created_at)}</p>
            {h.motivo && (
              <p className="text-xs italic text-surface-600 mt-1">
                Motivo: {h.motivo}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}