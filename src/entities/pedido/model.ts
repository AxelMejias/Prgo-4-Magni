// FSM v7 — exactamente 5 estados (sin EN_CAMINO ni ESPERANDO_PAGO).
export type EstadoCodigo =
  | "PENDIENTE"
  | "CONFIRMADO"
  | "EN_PREP"
  | "ENTREGADO"
  | "CANCELADO";

export interface EstadoPedido {
  codigo: EstadoCodigo;
  descripcion: string;
  orden: number;
  es_terminal: boolean;
}

export interface FormaPago {
  codigo: string;       // "EFECTIVO" | "TRANSFERENCIA" | "MERCADOPAGO"
  descripcion: string;
  habilitado: boolean;
}

// ─── Request schemas ────────────────────────────────────────────────────────
export interface ItemPedidoRequest {
  producto_id: number;
  cantidad: number;                   // ≥ 1
  personalizacion?: number[] | null;  // IDs de ingredientes removidos
}

export interface PedidoCreate {
  direccion_id?: number | null;
  forma_pago_codigo: string;
  items: ItemPedidoRequest[];         // min_length=1
  notas?: string | null;
}

export interface AvanzarEstadoRequest {
  estado_hacia: EstadoCodigo;
  motivo?: string | null;             // obligatorio si estado_hacia=CANCELADO
  restaurar_stock?: boolean;          // default true
}

export interface CancelarPedidoRequest {
  motivo: string;                     // min_length=1
  restaurar_stock?: boolean;          // default true
}

// ─── Response schemas ───────────────────────────────────────────────────────
// Nota: Decimals vienen serializados como string (Pydantic v2). Tipamos
// como number | string y normalizamos con toNumber() en los componentes.

export interface DetallePedido {
  producto_id: number;
  cantidad: number;
  nombre_snapshot: string;
  precio_snapshot: number | string;
  subtotal_snap: number | string;
  personalizacion?: number[] | null;
  created_at: string;
}

export interface PedidoListItem {
  id: number;
  usuario_id: number;
  estado_codigo: EstadoCodigo;
  forma_pago_codigo: string;
  total: number | string;
  created_at: string;
  updated_at?: string | null;
}

export interface Pedido {
  id: number;
  usuario_id: number;
  direccion_id?: number | null;
  estado_codigo: EstadoCodigo;
  forma_pago_codigo: string;
  subtotal: number | string;
  descuento: number | string;
  costo_envio: number | string;
  total: number | string;
  notas?: string | null;
  created_at: string;
  updated_at?: string | null;
  detalles: DetallePedido[];
  init_point?: string | null;
}

export interface PaginatedPedidos {
  items: PedidoListItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface HistorialEstado {
  id: number;
  estado_desde?: EstadoCodigo | null;
  estado_hacia: EstadoCodigo;
  usuario_id?: number | null;
  motivo?: string | null;
  created_at: string;
}

export interface PedidoFilters {
  estado_codigo?: EstadoCodigo;
  page: number;
  size: number;
}