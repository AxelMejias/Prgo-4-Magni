import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from "recharts";
import { estadisticasApi } from "../shared/api/estadisticasApi";
import { formatARS } from "../shared/lib/format";

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
          <div className="grid grid-cols-3 gap-4">
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
          </div>

          {/* ── Fila 3: gráficos lado a lado ─────────────────────────────── */}
          {ventasDia.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-surface-200 rounded-2xl p-5">
                <h2 className="font-bold text-surface-900 text-sm mb-0.5">Ingresos por día</h2>
                <p className="text-xs text-surface-400 mb-4">Solo pagos aprobados, en ARS.</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={ventasDia} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={40} />
                    <Tooltip formatter={(value: number) => [formatARS(value), "Ingreso"]} labelFormatter={(l) => `Fecha: ${l}`} />
                    <Bar dataKey="ingreso" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white border border-surface-200 rounded-2xl p-5">
                <h2 className="font-bold text-surface-900 text-sm mb-0.5">Pedidos por día</h2>
                <p className="text-xs text-surface-400 mb-4">Cantidad de pedidos completados por día.</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={ventasDia} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={30} />
                    <Tooltip formatter={(value: number) => [value, "Pedidos"]} />
                    <Line type="monotone" dataKey="pedidos" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-surface-200 rounded-2xl p-6 text-center text-surface-400 text-sm">
              Sin datos de ventas para el período seleccionado.
            </div>
          )}

          {/* ── Fila 4: top productos ─────────────────────────────────────── */}
          {topProductos.length > 0 && (
            <div className="bg-white border border-surface-200 rounded-2xl p-5">
              <h2 className="font-bold text-surface-900 mb-4">Productos más vendidos</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold text-surface-500 uppercase tracking-wide border-b border-surface-100">
                    <th className="pb-2 pr-4">#</th>
                    <th className="pb-2 pr-4">Producto</th>
                    <th className="pb-2 pr-4 text-right">Unidades</th>
                    <th className="pb-2 text-right">Ingreso total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-50">
                  {topProductos.map((p, i) => (
                    <tr key={p.producto_id}>
                      <td className="py-2 pr-4 text-surface-400 font-mono text-xs">{i + 1}</td>
                      <td className="py-2 pr-4 font-medium text-surface-900">{p.nombre}</td>
                      <td className="py-2 pr-4 text-right text-surface-700">{p.cantidad_total}</td>
                      <td className="py-2 text-right font-semibold text-surface-900">{formatARS(p.ingreso_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
