import axiosClient from "../../shared/api/axiosClient";
import type {
  EstadoPedido,
  FormaPago,
  PaginatedPedidos,
  Pedido,
  PedidoCreate,
  AvanzarEstadoRequest,
  HistorialEstado,
  PedidoFilters,
} from "./model";

function extractMsg(error: unknown): Error {
  if (typeof error === "object" && error !== null && "response" in error) {
    const ax = error as { response?: { data?: { detail?: unknown } } };
    const detail = ax.response?.data?.detail;
    if (typeof detail === "string") return new Error(detail);
    if (typeof detail === "object" && detail !== null && "detail" in detail) {
      return new Error(String((detail as Record<string, unknown>).detail));
    }
    if (Array.isArray(detail)) {
      // Errores Pydantic 422
      return new Error(
        detail
          .map((d: { loc: string[]; msg: string }) =>
            `${d.loc?.slice(1).join(".") || "campo"}: ${d.msg}`
          )
          .join("\n")
      );
    }
  }
  return error instanceof Error ? error : new Error("Error inesperado");
}

export const pedidoApi = {
  // ─── Catálogos ────────────────────────────────────────────────────────
  getEstados: async (): Promise<EstadoPedido[]> => {
    const { data } = await axiosClient.get<EstadoPedido[]>(
      "/api/v1/pedidos/estados"
    );
    return data;
  },

  getFormasPago: async (): Promise<FormaPago[]> => {
    const { data } = await axiosClient.get<FormaPago[]>(
      "/api/v1/pedidos/formas-pago"
    );
    return data;
  },

  // ─── Listado paginado ─────────────────────────────────────────────────
  getAll: async (filters: PedidoFilters): Promise<PaginatedPedidos> => {
    const params: Record<string, unknown> = {
      page: filters.page,
      size: filters.size,
    };
    if (filters.estado_codigo) params.estado_codigo = filters.estado_codigo;
    const { data } = await axiosClient.get<PaginatedPedidos>(
      "/api/v1/pedidos/",
      { params }
    );
    return data;
  },

  // ─── Detalle ──────────────────────────────────────────────────────────
  getById: async (id: number): Promise<Pedido> => {
    const { data } = await axiosClient.get<Pedido>(`/api/v1/pedidos/${id}`);
    return data;
  },

  getHistorial: async (id: number): Promise<HistorialEstado[]> => {
    const { data } = await axiosClient.get<HistorialEstado[]>(
      `/api/v1/pedidos/${id}/historial`
    );
    return data;
  },

  // ─── Mutaciones ───────────────────────────────────────────────────────
  create: async (payload: PedidoCreate): Promise<Pedido> => {
    // No usamos extractMsg acá para preservar response.data en onError
    // (necesario para detectar STOCK_INSUFICIENTE y PRODUCTO_NO_DISPONIBLE)
    const { data } = await axiosClient.post<Pedido>("/api/v1/pedidos/", payload);
    return data;
  },

  /** STAFF (ADMIN/PEDIDOS) — avanza por la FSM. */
  avanzarEstado: async (
    id: number,
    payload: AvanzarEstadoRequest
  ): Promise<Pedido> => {
    try {
      const { data } = await axiosClient.post<Pedido>(
        `/api/v1/pedidos/${id}/avanzar`,
        payload
      );
      return data;
    } catch (err) {
      throw extractMsg(err);
    }
  },

  /** Consulta el estado de pago en MP (para polling del popup). */
  verificarPago: async (id: number): Promise<{ status: string; payment_id: number | null }> => {
    const { data } = await axiosClient.get<{ status: string; payment_id: number | null }>(
      `/api/v1/pedidos/${id}/verificar-pago`
    );
    return data;
  },

  /** CLIENT — cancela su propio pedido (solo PENDIENTE/CONFIRMADO). */
  cancelar: async (
    id: number,
    motivo: string,
    restaurarStock: boolean = true
  ): Promise<Pedido> => {
    try {
      const { data } = await axiosClient.post<Pedido>(
        `/api/v1/pedidos/${id}/cancelar`,
        { motivo, restaurar_stock: restaurarStock }
      );
      return data;
    } catch (err) {
      throw extractMsg(err);
    }
  },
};