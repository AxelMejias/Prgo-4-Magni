import { useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriasApi } from "../../../services/api";
import type { Categoria, CategoriaInput } from "../../../types";

interface CategoriaQuickCreateProps {
  open: boolean;
  onClose: () => void;
  /** Lista plana de categorías existentes, para elegir la categoría padre. */
  categorias: Categoria[];
  /** Se invoca con la categoría recién creada para que el padre la autoseleccione. */
  onCreated: (cat: Categoria) => void;
}

/**
 * Mini-formulario para crear una categoría (raíz o subcategoría de una existente)
 * sin abandonar el alta/edición de producto. Al crear, invalida las queries de
 * categorías para que la nueva aparezca en toda la app y la autoselecciona en el
 * producto que se está editando.
 */
export default function CategoriaQuickCreate({
  open,
  onClose,
  categorias,
  onCreated,
}: CategoriaQuickCreateProps) {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);
  const [error, setError] = useState("");

  function reset() {
    setNombre("");
    setDescripcion("");
    setParentId(null);
    setError("");
  }

  const createMutation = useMutation({
    mutationFn: (payload: CategoriaInput) => categoriasApi.create(payload),
    onSuccess: (cat) => {
      // La nueva categoría debe aparecer en la lista plana, en el árbol y en los
      // filtros de toda la app.
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      queryClient.invalidateQueries({ queryKey: ["categorias-tree"] });
      queryClient.invalidateQueries({ queryKey: ["categorias-store"] });
      onCreated(cat);
      reset();
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Cortar la propagación: este modal se monta dentro del <form> del producto;
    // sin esto, el submit burbujea por el árbol de React hasta el form del producto
    // y dispara su envío (cerrando el modal sin crear la categoría).
    e.stopPropagation();
    setError("");
    if (nombre.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    createMutation.mutate({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      parent_id: parentId,
    });
  }

  function handleClose() {
    reset();
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-surface-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-surface-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 bg-surface-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">🏷️</span>
            </div>
            <h2 className="font-semibold text-surface-800 text-base">Nueva categoría</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-700 hover:bg-surface-200 transition-all text-lg leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">
              Nombre <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              autoFocus
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Bebidas"
              className="w-full px-3 py-2 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">
              Categoría padre <span className="text-surface-400">(opcional)</span>
            </label>
            <select
              value={parentId ?? ""}
              onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition bg-white"
            >
              <option value="">— Es categoría raíz —</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <p className="text-[11px] text-surface-400 mt-1">
              Dejala en raíz para una categoría principal, o elegí una existente para crear una subcategoría.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition bg-white"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-danger-50 border border-danger-200 px-3 py-2 text-sm text-danger-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl border border-surface-300 text-surface-700 text-sm font-semibold hover:bg-surface-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold disabled:opacity-50 transition cursor-pointer"
            >
              {createMutation.isPending ? "Creando..." : "Crear y asignar"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
