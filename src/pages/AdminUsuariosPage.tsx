import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type UsuarioAdmin } from "../services/api";

const PAGE_SIZE = 15;

const ALL_ROLES = [
  { codigo: "ADMIN",   nombre: "Administrador" },
  { codigo: "PEDIDOS",  nombre: "Gestor de Pedidos" },
  { codigo: "STOCK",   nombre: "Gestor de Stock" },
  { codigo: "CLIENT",  nombre: "Cliente" },
];

const ROLE_META: Record<string, { label: string; color: string }> = {
  ADMIN:   { label: "Admin",   color: "bg-red-100 text-red-700 border-red-200" },
  PEDIDOS:  { label: "Gestor de Pedidos", color: "bg-purple-100 text-purple-700 border-purple-200" },
  STOCK:   { label: "Stock",   color: "bg-blue-100 text-blue-700 border-blue-200" },
  CLIENT:  { label: "Cliente", color: "bg-green-100 text-green-700 border-green-200" },
};

const FILTER_TABS = [
  { label: "Todos",    value: "" },
  { label: "Admin",    value: "ADMIN" },
  { label: "Pedidos",  value: "PEDIDOS" },
  { label: "Stock",    value: "STOCK" },
  { label: "Clientes", value: "CLIENT" },
];

export default function AdminUsuariosPage() {
  const qc = useQueryClient();
  const [rolFilter, setRolFilter] = useState("");
  const [verInactivos, setVerInactivos] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<UsuarioAdmin | null>(null);
  const [rolToAdd, setRolToAdd] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-usuarios", page, rolFilter, verInactivos],
    queryFn: () => adminApi.getUsuarios(page, PAGE_SIZE, rolFilter || undefined, verInactivos),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-usuarios"] });

  const asignarMutation = useMutation({
    mutationFn: ({ id, rol }: { id: number; rol: string }) =>
      adminApi.asignarRol(id, rol),
    onSuccess: (updated) => {
      setSelected(updated);
      setRolToAdd("");
      setActionError("");
      invalidate();
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const removerMutation = useMutation({
    mutationFn: ({ id, rol }: { id: number; rol: string }) =>
      adminApi.removerRol(id, rol),
    onSuccess: (updated) => {
      setSelected(updated);
      setActionError("");
      invalidate();
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteUsuario(id),
    onSuccess: () => {
      setSelected(null);
      setConfirmDelete(false);
      invalidate();
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const reactivarMutation = useMutation({
    mutationFn: (id: number) => adminApi.reactivarUsuario(id),
    onSuccess: () => {
      setSelected(null);
      setActionError("");
      invalidate();
    },
    onError: (err: Error) => setActionError(err.message),
  });

  useEffect(() => {
    if (!selected) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [selected]);

  function openUser(u: UsuarioAdmin) {
    setSelected(u);
    setConfirmDelete(false);
    setRolToAdd("");
    setActionError("");
  }

  const availableRoles = selected
    ? ALL_ROLES.filter((r) => !selected.roles.some((ur) => ur.codigo === r.codigo))
    : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-surface-900">Usuarios</h1>
        <p className="text-sm text-surface-500">
          Gestioná los usuarios registrados y sus roles.
        </p>
      </header>

      {/* Estado: activos / inactivos (baja lógica) */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => {
            setVerInactivos(false);
            setPage(1);
          }}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            !verInactivos ? "bg-white text-brand-700 shadow-sm" : "text-surface-500 hover:text-surface-700"
          }`}
        >
          ✓ Activos
        </button>
        <button
          onClick={() => {
            setVerInactivos(true);
            setPage(1);
          }}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            verInactivos ? "bg-white text-danger-600 shadow-sm" : "text-surface-500 hover:text-surface-700"
          }`}
        >
          🗑 Dados de baja
        </button>
      </div>

      {/* Filtros por rol */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setRolFilter(tab.value);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              rolFilter === tab.value
                ? "bg-brand-600 text-white"
                : "bg-white border border-surface-200 text-surface-600 hover:border-brand-400 hover:text-brand-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabla de usuarios */}
      {isLoading ? (
        <p className="text-surface-500">Cargando usuarios…</p>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
          {!data?.items.length ? (
            <p className="p-8 text-center text-surface-500">
              Sin usuarios para este filtro.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  <th className="px-5 py-3 text-left font-semibold text-surface-500 text-xs uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-surface-500 text-xs uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-surface-500 text-xs uppercase tracking-wider">
                    Registrado
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {data.items.map((u) => (
                  <tr
                    key={u.id}
                    className={`hover:bg-surface-50 transition-colors ${
                      u.deleted_at ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs shrink-0">
                          {u.nombre[0]}
                          {u.apellido[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-surface-900">
                            {u.nombre} {u.apellido}
                          </p>
                          <p className="text-xs text-surface-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 ? (
                          <span className="text-xs text-surface-400 italic">
                            Sin roles
                          </span>
                        ) : (
                          u.roles.map((r) => {
                            const meta = ROLE_META[r.codigo] ?? {
                              label: r.codigo,
                              color: "bg-gray-100 text-gray-600 border-gray-200",
                            };
                            return (
                              <span
                                key={r.codigo}
                                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${meta.color}`}
                              >
                                {meta.label}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-surface-500">
                      {new Date(u.created_at).toLocaleDateString("es-AR")}
                      {u.deleted_at && (
                        <span className="ml-2 text-danger-500 font-semibold">
                          · Baja
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => openUser(u)}
                        className="px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100 transition-colors"
                      >
                        Gestionar →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Paginación */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              page <= 1
                ? "border-surface-200 bg-surface-100 text-surface-300 cursor-not-allowed"
                : "border-brand-600 bg-brand-600 text-white hover:bg-brand-700 cursor-pointer"
            }`}
          >
            ←
          </button>
          <span className="px-3 text-sm font-medium text-surface-600">
            Página {data.page} de {data.pages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= data.pages}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              page >= data.pages
                ? "border-surface-200 bg-surface-100 text-surface-300 cursor-not-allowed"
                : "border-brand-600 bg-brand-600 text-white hover:bg-brand-700 cursor-pointer"
            }`}
          >
            →
          </button>
        </div>
      )}

      {/* ── Modal de gestión de usuario ───────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/50 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-surface-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del modal */}
            <div className="p-6 border-b border-surface-100">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg shrink-0">
                    {selected.nombre[0]}
                    {selected.apellido[0]}
                  </div>
                  <div>
                    <h2 className="font-bold text-surface-900 text-lg">
                      {selected.nombre} {selected.apellido}
                    </h2>
                    <p className="text-sm text-surface-500">{selected.email}</p>
                    {selected.celular && (
                      <p className="text-xs text-surface-400 mt-0.5">
                        📞 {selected.celular}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-full bg-surface-100 hover:bg-surface-200 flex items-center justify-center text-surface-500 hover:text-surface-800 transition text-xl leading-none shrink-0 cursor-pointer"
                >
                  ×
                </button>
              </div>
              {selected.deleted_at && (
                <div className="mt-4 bg-danger-50 border border-danger-100 rounded-xl px-3 py-2 text-xs text-danger-700 font-medium">
                  ⚠ Usuario dado de baja el{" "}
                  {new Date(selected.deleted_at).toLocaleDateString("es-AR")}
                </div>
              )}
            </div>

            <div className="p-6 space-y-5">
              {/* Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-surface-50 rounded-xl p-3">
                  <p className="text-xs text-surface-400 mb-0.5">ID</p>
                  <p className="font-semibold text-surface-700">
                    #{selected.id}
                  </p>
                </div>
                <div className="bg-surface-50 rounded-xl p-3">
                  <p className="text-xs text-surface-400 mb-0.5">Registrado</p>
                  <p className="font-semibold text-surface-700">
                    {new Date(selected.created_at).toLocaleDateString("es-AR")}
                  </p>
                </div>
              </div>

              {/* Roles actuales */}
              <div>
                <p className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">
                  Roles actuales
                </p>
                {selected.roles.length === 0 ? (
                  <p className="text-sm text-surface-400 italic">
                    Sin roles asignados.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selected.roles.map((r) => {
                      const meta = ROLE_META[r.codigo] ?? {
                        label: r.codigo,
                        color: "bg-gray-100 text-gray-600 border-gray-200",
                      };
                      return (
                        <div key={r.codigo} className="flex items-center gap-1">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${meta.color}`}
                          >
                            {r.nombre}
                          </span>
                          <button
                            onClick={() =>
                              removerMutation.mutate({
                                id: selected.id,
                                rol: r.codigo,
                              })
                            }
                            disabled={removerMutation.isPending}
                            title="Quitar rol"
                            className="w-5 h-5 rounded-full bg-surface-200 hover:bg-danger-100 hover:text-danger-700 flex items-center justify-center text-surface-500 text-xs transition-colors cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Asignar rol */}
              {availableRoles.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">
                    Asignar rol
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={rolToAdd}
                      onChange={(e) => setRolToAdd(e.target.value)}
                      className="flex-1 border border-surface-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">Seleccioná un rol…</option>
                      {availableRoles.map((r) => (
                        <option key={r.codigo} value={r.codigo}>
                          {r.nombre}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() =>
                        rolToAdd &&
                        asignarMutation.mutate({
                          id: selected.id,
                          rol: rolToAdd,
                        })
                      }
                      disabled={!rolToAdd || asignarMutation.isPending}
                      className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
                    >
                      Asignar
                    </button>
                  </div>
                </div>
              )}

              {/* Error de acción */}
              {actionError && (
                <p className="text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-xl px-4 py-3">
                  {actionError}
                </p>
              )}

              {/* Zona de peligro */}
              {!selected.deleted_at && (
                <div className="border border-danger-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-danger-600 uppercase tracking-wider">
                    Zona de peligro
                  </p>
                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="w-full py-2 rounded-xl border border-danger-300 text-danger-600 text-sm font-semibold hover:bg-danger-50 transition-colors cursor-pointer"
                    >
                      Dar de baja este usuario
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-surface-700">
                        ¿Confirmar baja de{" "}
                        <strong>
                          {selected.nombre} {selected.apellido}
                        </strong>
                        ?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteMutation.mutate(selected.id)}
                          disabled={deleteMutation.isPending}
                          className="flex-1 py-2 rounded-xl bg-danger-600 text-white text-sm font-semibold hover:bg-danger-700 disabled:opacity-50 transition-colors"
                        >
                          Confirmar baja
                        </button>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="flex-1 py-2 rounded-xl border border-surface-300 text-surface-600 text-sm font-semibold hover:bg-surface-50 transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reactivación de un usuario dado de baja */}
              {selected.deleted_at && (
                <div className="border border-success-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-success-700 uppercase tracking-wider">
                    Reactivar cuenta
                  </p>
                  <p className="text-sm text-surface-600">
                    Volvé a habilitar a este usuario para que pueda iniciar sesión y operar.
                  </p>
                  <button
                    onClick={() => reactivarMutation.mutate(selected.id)}
                    disabled={reactivarMutation.isPending}
                    className="w-full py-2 rounded-xl bg-success-600 text-white text-sm font-semibold hover:bg-success-700 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {reactivarMutation.isPending ? "Reactivando…" : "♻️ Reactivar usuario"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
