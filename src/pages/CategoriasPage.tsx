import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriasApi } from "../services/api";
import type { Categoria, CategoriaInput, CategoriaTree } from "../types";
import Modal from "../components/Modal";
import { useAuthStore } from "../shared/store/authStore";

// ── Componente recursivo ──────────────────────────────────────────────────────

interface CategoriaNodeProps {
  nodo: CategoriaTree;
  nivel: number;
  canManage: boolean;
  onEdit: (c: Categoria) => void;
  onDelete: (c: Categoria) => void;
  onAddChild: (parentId: number) => void;
}

function CategoriaNode({ nodo, nivel, canManage, onEdit, onDelete, onAddChild }: CategoriaNodeProps) {
  const [collapsed, setCollapsed] = useState(true);
  const hasChildren = nodo.children.length > 0;

  const indentColor = [
    "border-warning-300",
    "border-brand-300",
    "border-success-300",
    "border-purple-300",
  ][nivel % 4];

  return (
    <li>
      <div
        className={`flex items-start justify-between rounded-xl px-4 py-3 ${
          nivel === 0 ? "bg-white border border-surface-200 shadow-sm" : "bg-surface-50"
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasChildren ? (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-5 h-5 flex items-center justify-center text-surface-400 hover:text-surface-700 shrink-0"
            >
              {collapsed ? "▶" : "▼"}
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-surface-900 text-sm">{nodo.nombre}</span>
              {nivel === 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning-100 text-warning-600">
                  RAÍZ
                </span>
              )}
              {hasChildren && (
                <span className="text-[10px] text-surface-400">
                  ({nodo.children.length} subcategoría{nodo.children.length !== 1 ? "s" : ""})
                </span>
              )}
            </div>
            {nodo.descripcion && (
              <p className="text-xs text-surface-500 mt-0.5">{nodo.descripcion}</p>
            )}
          </div>
        </div>

        {canManage && (
          <div className="flex gap-2 shrink-0 ml-3">
            <button
              onClick={() => onAddChild(nodo.id)}
              className="text-xs text-brand-600 font-semibold hover:underline"
            >
              + Sub
            </button>
            <button
              onClick={() => onEdit({ id: nodo.id, nombre: nodo.nombre, descripcion: nodo.descripcion, parent_id: nodo.parent_id })}
              className="text-xs text-surface-600 font-semibold hover:underline"
            >
              Editar
            </button>
            <button
              onClick={() => onDelete({ id: nodo.id, nombre: nodo.nombre, descripcion: nodo.descripcion, parent_id: nodo.parent_id })}
              className="text-xs text-danger-600 font-semibold hover:underline"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      {hasChildren && !collapsed && (
        <ul className={`mt-1 ml-6 pl-4 border-l-2 ${indentColor} space-y-1`}>
          {nodo.children.map((hijo) => (
            <CategoriaNode
              key={hijo.id}
              nodo={hijo}
              nivel={nivel + 1}
              canManage={canManage}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function filtrarArbol(nodos: CategoriaTree[], texto: string): CategoriaTree[] {
  if (!texto.trim()) return nodos;
  const lower = texto.toLowerCase();
  return nodos
    .map((nodo) => {
      const hijos = filtrarArbol(nodo.children, texto);
      const coincide = nodo.nombre.toLowerCase().includes(lower);
      if (coincide || hijos.length > 0) return { ...nodo, children: hijos };
      return null;
    })
    .filter(Boolean) as CategoriaTree[];
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function CategoriasPage() {
  const queryClient = useQueryClient();
  const canManage = useAuthStore((s) => s.hasRole(["ADMIN"]));

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [form, setForm] = useState<CategoriaInput>({ nombre: "", descripcion: "", parent_id: null });
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [verInactivas, setVerInactivas] = useState(false);

  const { data: tree, isLoading, isError } = useQuery({
    queryKey: ["categorias-tree"],
    queryFn: categoriasApi.getTree,
    enabled: !verInactivas,
  });

  const { data: listaPlana } = useQuery({
    queryKey: ["categorias"],
    queryFn: categoriasApi.getAll,
  });

  const { data: inactivas } = useQuery({
    queryKey: ["categorias-inactivas"],
    queryFn: categoriasApi.getInactivas,
    enabled: verInactivas,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["categorias-tree"] });
    queryClient.invalidateQueries({ queryKey: ["categorias"] });
    queryClient.invalidateQueries({ queryKey: ["categorias-inactivas"] });
  };

  const reactivarMutation = useMutation({
    mutationFn: (id: number) => categoriasApi.reactivar(id),
    onSuccess: () => { setDeleteError(""); invalidate(); },
    onError: (err: Error) => setDeleteError(err.message),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CategoriaInput) => categoriasApi.create(payload),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CategoriaInput }) =>
      categoriasApi.update(id, payload),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriasApi.delete(id),
    onSuccess: () => { setDeleteError(""); invalidate(); },
    onError: (err: Error) => setDeleteError(err.message),
  });

  function openCreate(parent_id: number | null = null) {
    setEditing(null);
    setForm({ nombre: "", descripcion: "", parent_id });
    setError("");
    setModalOpen(true);
  }

  function openEdit(c: Categoria) {
    setEditing(c);
    setForm({ nombre: c.nombre, descripcion: c.descripcion ?? "", parent_id: c.parent_id ?? null, imagen_url: c.imagen_url ?? "" });
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.nombre.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (editing && form.parent_id === editing.id) {
      setError("Una categoría no puede ser su propio padre.");
      return;
    }
    const payload: CategoriaInput = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion?.trim() || undefined,
      parent_id: form.parent_id || null,
      imagen_url: form.imagen_url?.trim() || null,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleDelete(c: Categoria) {
    setDeleteError("");
    if (window.confirm(`¿Eliminar "${c.nombre}"?`)) {
      deleteMutation.mutate(c.id);
    }
  }

  const arbolFiltrado = tree ? filtrarArbol(tree, busqueda) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Categorías</h1>
          <p className="text-sm text-surface-500">Árbol de categorías con profundidad ilimitada.</p>
        </div>
        {canManage && (
          <button
            onClick={() => openCreate(null)}
            className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
          >
            + Nueva categoría
          </button>
        )}
      </header>

      {/* Estado: activas / inactivas (baja lógica) */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setVerInactivas(false)}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            !verInactivas ? "bg-white text-brand-700 shadow-sm" : "text-surface-500 hover:text-surface-700"
          }`}
        >
          ✓ Activas
        </button>
        <button
          onClick={() => setVerInactivas(true)}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            verInactivas ? "bg-white text-danger-600 shadow-sm" : "text-surface-500 hover:text-surface-700"
          }`}
        >
          🗑 Dadas de baja
          {inactivas && inactivas.length > 0 && (
            <span className="ml-1.5 bg-danger-100 text-danger-600 text-xs px-1.5 py-0.5 rounded-full font-bold">
              {inactivas.length}
            </span>
          )}
        </button>
      </div>

      {/* Buscador (solo en activas) */}
      {!verInactivas && (
      <div className="relative w-full max-w-sm">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm">🔍</span>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar categoría..."
          className="w-full pl-9 pr-9 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition bg-white"
        />
        {busqueda && (
          <button
            onClick={() => setBusqueda("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 text-sm"
          >
            ✕
          </button>
        )}
      </div>
      )}

      {!verInactivas && isLoading && <p className="text-surface-500">Cargando…</p>}
      {!verInactivas && isError && <p className="text-danger-600">Error al cargar categorías.</p>}

      {deleteError && (
        <div className="flex items-start gap-3 bg-danger-50 border border-danger-200 rounded-xl px-4 py-3 text-sm text-danger-700">
          <span className="shrink-0 mt-0.5">⚠️</span>
          <span className="flex-1">{deleteError}</span>
          <button onClick={() => setDeleteError("")} className="shrink-0 text-danger-400 hover:text-danger-600">✕</button>
        </div>
      )}

      {!verInactivas && tree && (
        <ul className="space-y-3">
          {arbolFiltrado.length === 0 && (
            <li className="text-center py-12 bg-white rounded-2xl border border-surface-200 text-surface-500">
              {busqueda ? `Sin resultados para "${busqueda}"` : "No hay categorías cargadas."}
            </li>
          )}
          {arbolFiltrado.map((nodo) => (
            <CategoriaNode
              key={nodo.id}
              nodo={nodo}
              nivel={0}
              canManage={canManage}
              onEdit={openEdit}
              onDelete={handleDelete}
              onAddChild={(parentId) => openCreate(parentId)}
            />
          ))}
        </ul>
      )}

      {/* Lista de categorías dadas de baja (plana, con reactivar) */}
      {verInactivas && (
        <ul className="space-y-2">
          {(!inactivas || inactivas.length === 0) && (
            <li className="text-center py-12 bg-white rounded-2xl border border-surface-200 text-surface-500">
              No hay categorías dadas de baja.
            </li>
          )}
          {inactivas?.map((cat) => (
            <li
              key={cat.id}
              className="flex items-center justify-between rounded-xl px-4 py-3 bg-white border border-surface-200 opacity-90"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-surface-700 text-sm line-through">{cat.nombre}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-danger-100 text-danger-700 px-1.5 py-0.5 rounded">
                    Dada de baja
                  </span>
                </div>
                {cat.descripcion && (
                  <p className="text-xs text-surface-500 mt-0.5 truncate">{cat.descripcion}</p>
                )}
              </div>
              {canManage && (
                <button
                  onClick={() => reactivarMutation.mutate(cat.id)}
                  disabled={reactivarMutation.isPending}
                  className="shrink-0 ml-3 px-3 py-1.5 rounded-lg bg-success-50 text-success-700 text-xs font-semibold hover:bg-success-100 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  ♻️ Reactivar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Modal CRUD */}
      <Modal open={modalOpen} onClose={closeModal} title={editing ? "Editar categoría" : "Nueva categoría"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">Descripción</label>
            <textarea
              value={form.descripcion ?? ""}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">
              URL de imagen <span className="text-surface-400">(Cloudinary, opcional)</span>
            </label>
            <input
              type="url"
              value={form.imagen_url ?? ""}
              onChange={(e) => setForm({ ...form, imagen_url: e.target.value })}
              placeholder="https://res.cloudinary.com/..."
              className="w-full px-3 py-2 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {form.imagen_url ? (
              <img
                src={form.imagen_url}
                alt="Vista previa"
                className="mt-2 h-20 w-20 object-cover rounded-lg border border-surface-200"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : null}
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">
              Categoría padre <span className="text-surface-400">(opcional)</span>
            </label>
            <select
              value={form.parent_id ?? ""}
              onChange={(e) =>
                setForm({ ...form, parent_id: e.target.value ? Number(e.target.value) : null })
              }
              className="w-full px-3 py-2 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">— Es categoría raíz —</option>
              {(listaPlana ?? [])
                .filter((c) => !editing || c.id !== editing.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
            </select>
          </div>

          {error && (
            <div className="rounded-xl bg-danger-50 border border-danger-200 px-3 py-2 text-sm text-danger-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-xl border border-surface-300 text-surface-700 text-sm font-semibold hover:bg-surface-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
            >
              {editing ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}