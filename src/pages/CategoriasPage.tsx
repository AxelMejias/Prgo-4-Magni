import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriasApi } from "../services/api";
import type { Categoria, CategoriaInput } from "../types";
import Modal from "../components/Modal";
import { useAuthStore } from "../shared/store/authStore";

export default function CategoriasPage() {
  const queryClient = useQueryClient();
  const canManage = useAuthStore((s) => s.hasRole(["ADMIN"]));

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [form, setForm] = useState<CategoriaInput>({
    nombre: "",
    descripcion: "",
    parent_id: null,
  });
  const [error, setError] = useState("");

  // ── useQuery: todas las categorías (size grande para armar el tree) ──
  const { data: categorias, isLoading, isError } = useQuery({
    queryKey: ["categorias"],
    queryFn: categoriasApi.getAll,
  });

  // Diccionario id → categoria para mostrar el nombre del padre
  const byId = useMemo(() => {
    const map = new Map<number, Categoria>();
    (categorias ?? []).forEach((c) => map.set(c.id, c));
    return map;
  }, [categorias]);

  // Separar padres y subcategorías para el render jerárquico
  const padres = (categorias ?? []).filter((c) => !c.parent_id);
  const hijos = (parentId: number) =>
    (categorias ?? []).filter((c) => c.parent_id === parentId);

  // ── Mutations ────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload: CategoriaInput) => categoriasApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      closeModal();
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CategoriaInput }) =>
      categoriasApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      closeModal();
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriasApi.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categorias"] }),
    onError: (err: Error) => alert(err.message),
  });

  function openCreate(parent_id: number | null = null) {
    setEditing(null);
    setForm({ nombre: "", descripcion: "", parent_id });
    setError("");
    setModalOpen(true);
  }

  function openEdit(c: Categoria) {
    setEditing(c);
    setForm({
      nombre: c.nombre,
      descripcion: c.descripcion ?? "",
      parent_id: c.parent_id ?? null,
    });
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
    // Evitar elegirse a sí mismo como padre
    if (editing && form.parent_id === editing.id) {
      setError("Una categoría no puede ser su propio padre.");
      return;
    }

    const payload: CategoriaInput = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion?.trim() || undefined,
      parent_id: form.parent_id || null,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleDelete(c: Categoria) {
    if (window.confirm(`¿Eliminar "${c.nombre}"?`)) {
      deleteMutation.mutate(c.id);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Categorías</h1>
          <p className="text-sm text-surface-500">
            Árbol de categorías y subcategorías.
          </p>
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

      {isLoading && <p className="text-surface-500">Cargando…</p>}
      {isError && <p className="text-danger-600">Error al cargar categorías.</p>}

      {categorias && (
        <ul className="space-y-3">
          {padres.length === 0 && (
            <li className="text-center py-12 bg-white rounded-2xl border border-surface-200 text-surface-500">
              No hay categorías cargadas.
            </li>
          )}
          {padres.map((padre) => {
            const subs = hijos(padre.id);
            return (
              <li
                key={padre.id}
                className="bg-white rounded-2xl border border-surface-200 p-5"
              >
                {/* Categoría padre */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-warning-500">🏷️</span>
                      <h3 className="font-bold text-surface-900">
                        {padre.nombre}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning-100 text-warning-600">
                        CATEGORÍA
                      </span>
                    </div>
                    {padre.descripcion && (
                      <p className="text-sm text-surface-600 mt-1">
                        {padre.descripcion}
                      </p>
                    )}
                  </div>
                  {canManage && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openCreate(padre.id)}
                        className="text-xs text-brand-600 font-semibold hover:underline"
                      >
                        + Subcategoría
                      </button>
                      <button
                        onClick={() => openEdit(padre)}
                        className="text-xs text-surface-700 font-semibold hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(padre)}
                        className="text-xs text-danger-600 font-semibold hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>

                {/* Subcategorías */}
                {subs.length > 0 && (
                  <ul className="mt-4 ml-6 space-y-2 border-l-2 border-warning-200 pl-4">
                    {subs.map((sub) => (
                      <li
                        key={sub.id}
                        className="flex items-start justify-between py-2 px-3 rounded-lg bg-surface-50"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-warning-400">↳</span>
                            <span className="font-medium text-surface-800">
                              {sub.nombre}
                            </span>
                          </div>
                          {sub.descripcion && (
                            <p className="text-xs text-surface-500 ml-6 mt-0.5">
                              {sub.descripcion}
                            </p>
                          )}
                        </div>
                        {canManage && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEdit(sub)}
                              className="text-xs text-surface-700 font-semibold hover:underline"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(sub)}
                              className="text-xs text-danger-600 font-semibold hover:underline"
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Modal CRUD */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Editar categoría" : "Nueva categoría"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">
              Descripción
            </label>
            <textarea
              value={form.descripcion ?? ""}
              onChange={(e) =>
                setForm({ ...form, descripcion: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Selector de categoría padre */}
          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">
              Categoría padre <span className="text-surface-400">(opcional)</span>
            </label>
            <select
              value={form.parent_id ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  parent_id: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">— Es categoría raíz —</option>
              {(categorias ?? [])
                .filter((c) => !c.parent_id) // solo padres
                .filter((c) => !editing || c.id !== editing.id) // no editarse a sí misma
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
            </select>
            {form.parent_id && byId.has(form.parent_id) && (
              <p className="text-xs text-surface-500 mt-1">
                Será subcategoría de{" "}
                <strong>{byId.get(form.parent_id)?.nombre}</strong>.
              </p>
            )}
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
              disabled={
                createMutation.isPending || updateMutation.isPending
              }
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