import axiosClient from "./axiosClient";

export interface ProductoMasVendido {
  producto_id: number;
  nombre: string;
  cantidad_total: number;
  ingreso_total: number;
}

export interface VentasPorDia {
  fecha: string;
  pedidos: number;
  ingreso: number;
}

export interface DashboardData {
  ingreso_total: number;
  pedidos_completados: number;
  ticket_promedio: number;
  productos_mas_vendidos: ProductoMasVendido[];
  ventas_por_dia: VentasPorDia[];
}

export const estadisticasApi = {
  getDashboard: (fechaDesde: string, fechaHasta: string): Promise<DashboardData> =>
    axiosClient
      .get("/api/v1/estadisticas/dashboard", {
        params: { fecha_desde: fechaDesde, fecha_hasta: fechaHasta },
      })
      .then((r) => r.data),
};
