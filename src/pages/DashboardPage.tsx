import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { estadisticasApi } from "../shared/api/estadisticasApi";
import { formatARS, toNumber } from "../shared/lib/format";
import { ESTADO_LABELS } from "../features/pedido-estado/lib/fsm";
import type { EstadoCodigo } from "../entities/pedido/model";

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
/** "2026-06-14" → "14-06" para los ejes. */
function ddmm(iso: string): string {
  return iso.slice(8, 10) + "-" + iso.slice(5, 7);
}

// Colores por estado (espejo de EstadoBadge, en hex para recharts).
const ESTADO_COLORS: Record<EstadoCodigo, string> = {
  PENDIENTE:  "#f59e0b",
  CONFIRMADO: "#6366f1",
  EN_PREP:    "#a855f7",
  ENTREGADO:  "#10b981",
  CANCELADO:  "#ef4444",
};

const FORMA_PAGO_LABELS: Record<string, string> = {
  EFECTIVO:      "Efectivo",
  TRANSFERENCIA: "Transferencia",
  MERCADOPAGO:   "MercadoPago",
};
const FORMA_PAGO_COLORS = ["#10b981", "#6366f1", "#06b6d4", "#f59e0b", "#a855f7"];

export default function DashboardPage() {
  const [desde, setDesde] = useState(hace30);
  const [hasta, setHasta] = useState(hoy);
  const [aplicado, setAplicado] = useState({ desde: hace30(), hasta: hoy() });

  const habilitado = !!aplicado.desde && !!aplicado.hasta;

  // KPI cards — no dependen del período (resumen del negocio "vivo").
  const resumenQ = useQuery({
    queryKey: ["est-resumen"],
    queryFn: () => estadisticasApi.getResumen(),
  });

  // Distribución por estado — tampoco depende del período.
  const estadosQ = useQuery({
    queryKey: ["est-pedidos-por-estado"],
    queryFn: () => estadisticasApi.getPedidosPorEstado(),
  });

  // Gráficos dependientes del período seleccionado.
  const ventasQ = useQuery({
    queryKey: ["est-ventas", aplicado.desde, aplicado.hasta],
    queryFn: () => estadisticasApi.getVentas(aplicado.desde, aplicado.hasta, "day"),
    enabled: habilitado,
  });
  const productosQ = useQuery({
    queryKey: ["est-productos-top", aplicado.desde, aplicado.hasta],
    queryFn: () => estadisticasApi.getProductosTop(aplicado.desde, aplicado.hasta, 5),
    enabled: habilitado,
  });
  const ingresosQ = useQuery({
    queryKey: ["est-ingresos", aplicado.desde, aplicado.hasta],
    queryFn: () => estadisticasApi.getIngresos(aplicado.desde, aplicado.hasta),
    enabled: habilitado,
  });

  function handleActualizar() {
    if (desde && hasta) setAplicado({ desde, hasta });
  }

  // ── Datos derivados para los gráficos ─────────────────────────────────────
  const ventasData = (ventasQ.data ?? []).map((v) => ({
    periodo: ddmm(v.periodo),
    ventas: toNumber(v.total_ventas),
    pedidos: v.cantidad_pedidos,
  }));

  const productosData = (productosQ.data ?? []).map((p) => ({
    nombre: p.nombre,
    cantidad: p.cantidad_vendida,
    ingresos: toNumber(p.ingresos),
  }));

  const estadosData = (estadosQ.data ?? []).map((e) => ({
    estado: e.estado_codigo,
    label: ESTADO_LABELS[e.estado_codigo as EstadoCodigo] ?? e.estado_codigo,
    cantidad: e.cantidad,
    color: ESTADO_COLORS[e.estado_codigo as EstadoCodigo] ?? "#94a3b8",
  }));

  const ingresosData = (ingresosQ.data ?? []).map((i) => ({
    forma: FORMA_PAGO_LABELS[i.forma_pago_codigo] ?? i.forma_pago_codigo,
    total: toNumber(i.total),
    cantidad: i.cantidad,
  }));

  const resumen = resumenQ.data;

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

      {/* ── Fila 2: KPI cards (GET /estadisticas/resumen) ─────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Ventas de hoy"
          value={resumen ? formatARS(resumen.ventas_hoy) : "—"}
          icon="💰"
          color="bg-success-50 border-success-200"
          valueColor="text-success-700"
        />
        <KpiCard
          label="Ventas del mes"
          value={resumen ? formatARS(resumen.ventas_mes) : "—"}
          icon="📈"
          color="bg-brand-50 border-brand-200"
          valueColor="text-brand-700"
        />
        <KpiCard
          label="Ticket promedio"
          value={resumen ? formatARS(resumen.ticket_promedio) : "—"}
          icon="🧾"
          color="bg-warning-50 border-warning-200"
          valueColor="text-warning-700"
        />
        <KpiCard
          label="Pedidos activos"
          value={resumen ? String(resumen.pedidos_activos) : "—"}
          icon="📦"
          color="bg-purple-50 border-purple-200"
          valueColor="text-purple-700"
        />
      </div>

      {/* ── Fila 3: ventas (Line) + productos top (Bar) ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Ventas por día"
          subtitle="Ingresos confirmados (pagos aprobados), en ARS."
          isLoading={ventasQ.isLoading}
          isError={ventasQ.isError}
          isEmpty={ventasData.length === 0}
        >
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ventasData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="periodo" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={40} />
              <Tooltip formatter={(value) => [formatARS(value as number), "Ventas"] as [string, string]} labelFormatter={(l) => `Fecha: ${l}`} />
              <Line type="monotone" dataKey="ventas" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Productos más vendidos"
          subtitle="Unidades vendidas en el período (top 5)."
          isLoading={productosQ.isLoading}
          isError={productosQ.isError}
          isEmpty={productosData.length === 0}
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={productosData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="nombre" tick={{ fontSize: 10 }} interval={0} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={30} />
              <Tooltip formatter={(value) => [value as number, "Unidades"] as [number, string]} />
              <Bar dataKey="cantidad" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Fila 4: estados (Pie) + ingresos por forma de pago (Bar) ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Pedidos por estado"
          subtitle="Distribución de todos los pedidos según su estado actual."
          isLoading={estadosQ.isLoading}
          isError={estadosQ.isError}
          isEmpty={estadosData.length === 0}
        >
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={estadosData}
                dataKey="cantidad"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(e) => `${e.name}: ${e.value}`}
                labelLine={false}
              >
                {estadosData.map((e) => (
                  <Cell key={e.estado} fill={e.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value as number, (name as string) ?? "Pedidos"] as [number, string]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Ingresos por forma de pago"
          subtitle="Total cobrado por método (pagos aprobados), en ARS."
          isLoading={ingresosQ.isLoading}
          isError={ingresosQ.isError}
          isEmpty={ingresosData.length === 0}
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={ingresosData}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="forma" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={(value) => [formatARS(value as number), "Ingresos"] as [string, string]} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {ingresosData.map((d, i) => (
                  <Cell key={d.forma} fill={FORMA_PAGO_COLORS[i % FORMA_PAGO_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title, subtitle, isLoading, isError, isEmpty, children,
}: {
  title: string;
  subtitle: string;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-surface-200 rounded-2xl p-5">
      <h2 className="font-bold text-surface-900 text-sm mb-0.5">{title}</h2>
      <p className="text-xs text-surface-400 mb-4">{subtitle}</p>
      {isLoading ? (
        <p className="text-surface-400 text-sm py-12 text-center">Cargando…</p>
      ) : isError ? (
        <p className="text-danger-600 text-sm py-12 text-center font-semibold">Error al cargar los datos.</p>
      ) : isEmpty ? (
        <p className="text-surface-400 text-sm py-12 text-center">Sin datos para el período seleccionado.</p>
      ) : (
        children
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
