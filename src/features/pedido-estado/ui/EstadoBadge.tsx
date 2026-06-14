import type { EstadoCodigo } from "../../../entities/pedido/model";
import { ESTADO_LABELS } from "../lib/fsm";

const STYLES: Record<EstadoCodigo, string> = {
  PENDIENTE:  "bg-warning-100 text-warning-600 ring-warning-500/20",
  CONFIRMADO: "bg-brand-100 text-brand-700 ring-brand-500/20",
  EN_PREP:    "bg-purple-100 text-purple-700 ring-purple-500/20",
  ENTREGADO:  "bg-success-100 text-success-700 ring-success-500/20",
  CANCELADO:  "bg-danger-100 text-danger-700 ring-danger-500/20",
};

interface Props {
  estado: EstadoCodigo;
}

export default function EstadoBadge({ estado }: Props) {
  return (
    <span
      className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 ring-inset ${STYLES[estado]}`}
    >
      {ESTADO_LABELS[estado]}
    </span>
  );
}