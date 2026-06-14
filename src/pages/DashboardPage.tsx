import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line,
  PieChart, Pie, Cell,
} from "recharts";
import { estadisticasApi } from "../shared/api/estadisticasApi";
import { formatARS } from "../shared/lib/format";

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: "#f59e0b",
  CONFIRMADO: "#3b82f6",
  EN_PREP: "#8b5cf6",
  EN_CAMINO: "#06b6d4",
  ENTREGADO: "#10b981",
  CANCELADO: "#ef4444",
  ESPERANDO_PAGO: "#9ca3af",
};
const DEFAULT_COLOR = "#6366f1";

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function hoy(): string {
  return toLocalDateStr(new Date());
}
function hace30(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return toLocalDateStr(d);
}

export default function DashboardPage() {
  const [desde, setDesde] = useState(hace30);
  const [hasta, setHasta] = useState(hoy);
  const [aplicado, setAplicado] = useState({ desde: hace30(), hasta: hoy() });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard", aplicado.desde, aplicado.hasta],
    queryFn: () => estadisticasApi.getDashboard(aplicado.desde, aplicado.hasta),
    enabled: !!aplicado.desde && !!aplicado.hasta,
  });

  function handleActualizar() {
    if (desde && hasta) setAplicado({ desde, hasta });
  }

  const ventasDia = (data?.ventas_por_dia ?? []).map((v) => ({
    fecha: v.fecha.slice(8, 10) + "-" + v.fecha.slice(5, 7),
    ingreso: Number(v.ingreso),
    pedidos: v.pedidos,
  }));

  const topProductos = data?.productos_mas_vendidos ?? [];

  return (
    <div className="flex flex-col gap-5 h-full">

      {/* ── Fila 1: título + filtro ───────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
          <p className="text-sm text-surface-500">Métricas de ventas del período seleccionado.</p>
        </div>
        <div className="flex items-end gap-3 bg-white border border-surface-200 rounded-2xl px-5 py-3 flex-wrap">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-600">Desde</label>
            <input
              type="date"
              value={desde}
              max={hasta}
              onChange={(e) => setDesde(e.target.value)}
              className="border border-surface-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-600">Hasta</label>
            <input
              type="date"
              value={hasta}
              min={desde}
              max={hoy()}
              onChange={(e) => setHasta(e.target.value)}
              className="border border-surface-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={handleActualizar}
            className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
          >
            Actualizar
          </button>
        </div>
      </div>

      {isLoading && <p className="text-surface-500 text-sm">Cargando estadísticas…</p>}
      {isError  && <p className="text-danger-600 text-sm font-semibold">Error al cargar el dashboard.</p>}

      {data && (
        <>
          {/* ── Fila 2: KPI cards ────────────────────────────────────────── */}
          <div className="grid grid-cols-4 gap-4">
            <KpiCard
              label="Ingresos confirmados"
              value={formatARS(data.ingreso_total)}
              icon="💰"
              color="bg-success-50 border-success-200"
              valueColor="text-success-700"
            />
            <KpiCard
              label="Pedidos completados"
              value={String(data.pedidos_completados)}
              icon="📦"
              color="bg-brand-50 border-brand-200"
              valueColor="text-brand-700"
            />
            <KpiCard
              label="Ticket promedio"
              value={formatARS(data.ticket_promedio)}
              icon="🧾"
              color="bg-warning-50 border-warning-200"
              valueColor="text-warning-700"
            />
            <KpiCard
              label="Pedidos activos"
              value={String(data.pedidos_activos)}
              icon="🔄"
              color="bg-purple-50 border-purple-200"
              valueColor="text-purple-700"
            />
          </div>

          {/* ── Fila 3: ventas por período — LineChart con 2 líneas ──────── */}
          <div className="bg-white border border-surface-200 rounded-2xl p-5">
            <h2 className="font-bold text-surface-900 text-sm mb-0.5">Ventas por período</h2>
            <p className="text-xs text-surface-400 mb-4">
              Ingresos confirmados (ARS, eje izq.) y cantidad de pedidos (eje der.) por día.
            </p>
            {ventasDia.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={ventasDia} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    width={48}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10 }}
                    allowDecimals={false}
                    width={28}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === "ingreso"
                        ? [formatARS(value), "Ingresos"]
                        : [value, "Pedidos"]
                    }
                    labelFormatter={(l) => `Fecha: ${l}`}
                  />
                  <Legend formatter={(v) => (v === "ingreso" ? "Ingresos" : "Pedidos")} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="ingreso"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="pedidos"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-surface-400 text-sm text-center py-8">
                Sin datos de ventas para el período seleccionado.
              </p>
            )}
          </div>

          {/* ── Fila 4: top productos — BarChart ─────────────────────────── */}
          {topProductos.length > 0 && (
            <div className="bg-white border border-surface-200 rounded-2xl p-5">
              <h2 className="font-bold text-surface-900 text-sm mb-0.5">Productos más vendidos</h2>
              <p className="text-xs text-surface-400 mb-4">Ingresos totales por producto. El tooltip muestra unidades vendidas.</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={topProductos.map((p) => ({
                    nombre: p.nombre.length > 14 ? p.nombre.slice(0, 14) + "…" : p.nombre,
                    ingreso: Number(p.ingreso_total),
                    cantidad_vendida: p.cantidad_total,
                  }))}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 10 }} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    width={48}
                  />
                  <Tooltip
                    formatter={(value: number, _name: string, entry) => [
                      `${formatARS(value)} · ${entry.payload.cantidad_vendida} uds.`,
                      "Ingreso",
                    ]}
                  />
                  <Bar dataKey="ingreso" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Fila 5: distribución estados + ingresos por forma pago ────── */}
          <div className="grid grid-cols-2 gap-4">
            {/* PieChart: distribución por estado */}
            <div className="bg-white border border-surface-200 rounded-2xl p-5">
              <h2 className="font-bold text-surface-900 text-sm mb-0.5">Distribución por estado</h2>
              <p className="text-xs text-surface-400 mb-4">Cantidad de pedidos en cada estado.</p>
              {data.pedidos_por_estado.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.pedidos_por_estado.map((e) => ({
                        name: e.estado_codigo,
                        value: e.cantidad,
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      label={({ name, percent }) =>
                        percent > 0.05 ? `${name.replace("_", " ")} ${(percent * 100).toFixed(0)}%` : ""
                      }
                      labelLine={false}
                    >
                      {data.pedidos_por_estado.map((e) => (
                        <Cell
                          key={e.estado_codigo}
                          fill={ESTADO_COLORS[e.estado_codigo] ?? DEFAULT_COLOR}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v, "Pedidos"]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-surface-400 text-sm text-center py-8">Sin pedidos registrados.</p>
              )}
            </div>

            {/* BarChart horizontal: ingresos por forma de pago */}
            <div className="bg-white border border-surface-200 rounded-2xl p-5">
              <h2 className="font-bold text-surface-900 text-sm mb-0.5">Ingresos por forma de pago</h2>
              <p className="text-xs text-surface-400 mb-4">Solo pagos aprobados en el período, en ARS.</p>
              {data.ingresos_por_forma_pago.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    layout="vertical"
                    data={data.ingresos_por_forma_pago}
                    margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      type="category"
                      dataKey="forma_pago"
                      tick={{ fontSize: 10 }}
                      width={95}
                    />
                    <Tooltip
                      formatter={(value: number, _name: string, entry) => [
                        `${formatARS(value)} (${entry.payload.cantidad_pedidos} pedidos)`,
                        "Ingreso",
                      ]}
                    />
                    <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-surface-400 text-sm text-center py-8">Sin datos para el período.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({
  label, value, icon, color, valueColor,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
  valueColor: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${color}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <p className="text-xs font-semibold text-surface-600 uppercase tracking-wide">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}
