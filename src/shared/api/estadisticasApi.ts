import axiosClient from "./axiosClient";

// Los montos llegan como string (Decimal serializado por Pydantic) — se
// normalizan con toNumber() en la capa de UI antes de graficar.

export interface VentasPeriodoItem {
  periodo: string;
  total_ventas: number | string;
  cantidad_pedidos: number;
}

export interface ProductoTopItem {
  producto_id: number;
  nombre: string;
  cantidad_vendida: number;
  ingresos: number | string;
}

export interface PedidosEstadoItem {
  estado_codigo: string;
  cantidad: number;
}

export interface IngresosFormaPagoItem {
  forma_pago_codigo: string;
  total: number | string;
  cantidad: number;
}

export interface ResumenData {
  ventas_hoy: number | string;
  ticket_promedio: number | string;
  pedidos_activos: number;
  ventas_mes: number | string;
}

export interface AlertasStockData {
  ingredientes_stock_bajo: number;
  productos_sin_stock: number;
}

export type Agrupacion = "day" | "week" | "month";

export const estadisticasApi = {
  // GET /estadisticas/ventas — LineChart de ventas por período.
  getVentas: (
    desde: string,
    hasta: string,
    agrupacion: Agrupacion = "day"
  ): Promise<VentasPeriodoItem[]> =>
    axiosClient
      .get("/api/v1/estadisticas/ventas", { params: { desde, hasta, agrupacion } })
      .then((r) => r.data),

  // GET /estadisticas/productos-top — BarChart de ranking de productos.
  getProductosTop: (
    desde: string,
    hasta: string,
    limit = 5
  ): Promise<ProductoTopItem[]> =>
    axiosClient
      .get("/api/v1/estadisticas/productos-top", { params: { desde, hasta, limit } })
      .then((r) => r.data),

  // GET /estadisticas/pedidos-por-estado — PieChart de distribución por estado.
  getPedidosPorEstado: (): Promise<PedidosEstadoItem[]> =>
    axiosClient.get("/api/v1/estadisticas/pedidos-por-estado").then((r) => r.data),

  // GET /estadisticas/ingresos — BarChart de ingresos por forma de pago.
  getIngresos: (desde: string, hasta: string): Promise<IngresosFormaPagoItem[]> =>
    axiosClient
      .get("/api/v1/estadisticas/ingresos", { params: { desde, hasta } })
      .then((r) => r.data),

  // GET /estadisticas/resumen — KPI cards.
  getResumen: (): Promise<ResumenData> =>
    axiosClient.get("/api/v1/estadisticas/resumen").then((r) => r.data),

  // GET /estadisticas/alertas-stock — avisos de reposición para el dashboard.
  getAlertasStock: (): Promise<AlertasStockData> =>
    axiosClient.get("/api/v1/estadisticas/alertas-stock").then((r) => r.data),
};
