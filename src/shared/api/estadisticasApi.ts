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
  pedidos_activos: number;
  productos_mas_vendidos: ProductoMasVendido[];
  ventas_por_dia: VentasPorDia[];
  pedidos_por_estado: { estado_codigo: string; cantidad: number }[];
  ingresos_por_forma_pago: { forma_pago: string; total: number; cantidad_pedidos: number }[];
}

export const estadisticasApi = {
  getDashboard: (fechaDesde: string, fechaHasta: string): Promise<DashboardData> =>
    axiosClient
      .get("/api/v1/estadisticas/dashboard", {
        params: { fecha_desde: fechaDesde, fecha_hasta: fechaHasta },
      })
      .then((r) => r.data),
};
