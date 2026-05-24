import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { pedidoApi } from "../entities/pedido/api";
import type { EstadoCodigo, PedidoFilters } from "../entities/pedido/model";
import EstadoBadge from "../features/pedido-estado/ui/EstadoBadge";
import { formatARS, formatDateTime } from "../shared/lib/format";

const PAGE_SIZE = 15;

const TABS: { value: EstadoCodigo | ""; label: string }[] = [
  { value: "",           label: "Todos" },
  { value: "PENDIENTE",  label: "Pendientes" },
  { value: "CONFIRMADO", label: "Confirmados" },
  { value: "EN_PREP",    label: "En prep." },
  { value: "EN_CAMINO",  label: "En camino" },
  { value: "ENTREGADO",  label: "Entregados" },
  { value: "CANCELADO",  label: "Cancelados" },
];

export default function AdminPedidosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page     = parseInt(searchParams.get("page") ?? "1", 10);
  const estadoQs = (searchParams.get("estado") as EstadoCodigo) ?? "";

  const filters: PedidoFilters = {
    page,
    size: PAGE_SIZE,
    estado_codigo: estadoQs || undefined,
  };

  // ── useQuery: el backend ve que sos STAFF y devuelve TODOS los pedidos
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["pedidos", filters],
    queryFn: () => pedidoApi.getAll(filters),
  });

  function setEstado(estado: EstadoCodigo | "") {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", "1");
      if (estado) params.set("estado", estado);
      else params.delete("estado");
      return params;
    });
  }

  function setPage(p: number) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", String(p));
      return params;
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">
            Panel de pedidos
          </h1>
          <p className="text-sm text-surface-500">
            Vista de cajero — avanzá los estados del flujo.
          </p>
        </div>
        {data && (
          <div className="text-right">
            <p className="text-xs text-surface-500">Mostrando</p>
            <p className="font-bold text-surface-900">
              {data.items.length} / {data.total}
            </p>
          </div>
        )}
      </header>

      {/* Tabs por estado */}
      <div className="flex flex-wrap gap-2 border-b border-surface-200 pb-3">
        {TABS.map((t) => (
          <button
            key={t.value || "TODOS"}
            onClick={() => setEstado(t.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              estadoQs === t.value
                ? "bg-brand-600 text-white"
                : "bg-white border border-surface-300 text-surface-700 hover:bg-surface-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-surface-500">Cargando…</p>}
      {isError && (
        <p className="text-danger-600">
          Error: {(error as Error)?.message ?? "desconocido"}
        </p>
      )}

      {data && (
        <>
          <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 text-xs text-surface-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Pago</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {data.items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-surface-500"
                    >
                      Sin pedidos en este estado.
                    </td>
                  </tr>
                ) : (
                  data.items.map((p) => (
                    <tr key={p.id} className="table-row-hover">
                      <td className="px-4 py-3 font-mono font-semibold">
                        #{p.id}
                      </td>
                      <td className="px-4 py-3 text-surface-700">
                        ID {p.usuario_id}
                      </td>
                      <td className="px-4 py-3">
                        <EstadoBadge estado={p.estado_codigo} />
                      </td>
                      <td className="px-4 py-3 text-surface-700">
                        {p.forma_pago_codigo}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-brand-700">
                        {formatARS(p.total)}
                      </td>
                      <td className="px-4 py-3 text-xs text-surface-500">
                        {formatDateTime(p.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/admin/pedidos/${p.id}`}
                          className="text-brand-600 font-semibold hover:underline text-xs"
                        >
                          Gestionar →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-surface-300 text-sm disabled:opacity-50"
              >
                ←
              </button>
              <span className="text-sm text-surface-600">
                Página {data.page} de {data.pages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= data.pages}
                className="px-3 py-1.5 rounded-lg border border-surface-300 text-sm disabled:opacity-50"
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}