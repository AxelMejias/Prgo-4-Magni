import type { EstadoCodigo } from "../../../entities/pedido/model";

/**
 * Espejo de _TRANSICIONES_VALIDAS en app/modules/pedidos/service.py.
 * El service del backend es la fuente de verdad — esto es solo para
 * habilitar/deshabilitar botones en la UI antes de pegarle al API.
 */
export const TRANSICIONES_STAFF: Record<EstadoCodigo, EstadoCodigo[]> = {
  ESPERANDO_PAGO: ["PENDIENTE", "CANCELADO"],
  PENDIENTE:  ["CONFIRMADO", "CANCELADO"],
  CONFIRMADO: ["EN_PREP", "CANCELADO"],
  EN_PREP:    ["EN_CAMINO", "CANCELADO"],
  EN_CAMINO:  ["ENTREGADO"],
  ENTREGADO:  [],
  CANCELADO:  [],
};

export const TRANSICIONES_CLIENT: Record<EstadoCodigo, EstadoCodigo[]> = {
  ESPERANDO_PAGO: ["CANCELADO"],
  PENDIENTE:  ["CANCELADO"],
  CONFIRMADO: ["CANCELADO"],
  EN_PREP:    [],
  EN_CAMINO:  [],
  ENTREGADO:  [],
  CANCELADO:  [],
};

export function getNextStates(
  estadoActual: EstadoCodigo,
  esStaff: boolean
): EstadoCodigo[] {
  return esStaff
    ? TRANSICIONES_STAFF[estadoActual]
    : TRANSICIONES_CLIENT[estadoActual];
}

/** RN-05: motivo obligatorio si se cancela. */
export function requiereMotivo(destino: EstadoCodigo): boolean {
  return destino === "CANCELADO";
}

export const ESTADO_LABELS: Record<EstadoCodigo, string> = {
  ESPERANDO_PAGO: "Esperando pago",
  PENDIENTE:  "Pendiente",
  CONFIRMADO: "Confirmado",
  EN_PREP:    "En preparación",
  EN_CAMINO:  "En camino",
  ENTREGADO:  "Entregado",
  CANCELADO:  "Cancelado",
};