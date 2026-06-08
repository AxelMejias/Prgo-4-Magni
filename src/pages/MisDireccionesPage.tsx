import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  direccionApi,
  type Direccion,
  type DireccionCreate,
} from "../entities/direccion/api";

const EMPTY_FORM: DireccionCreate = {
  alias: "",
  linea1: "",
  linea2: "",
  ciudad: "",
  provincia: "",
  codigo_postal: "",
  es_principal: false,
};

export default function MisDireccionesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Direccion | null>(null);
  const [form, setForm] = useState<DireccionCreate>(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["mis-direcciones"],
    queryFn: () => direccionApi.getAll(1, 50),
  });

  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: ["mis-direcciones"] });

  const createMutation = useMutation({
    mutationFn: (payload: DireccionCreate) => direccionApi.create(payload),
    onSuccess: () => { invalidar(); cerrarModal(); },
    onError: (err: Error) => setFormError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DireccionCreate }) =>
      direccionApi.update(id, payload),
    onSuccess: () => { invalidar(); cerrarModal(); },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => direccionApi.delete(id),
    onSuccess: invalidar,
  });

  const principalMutation = useMutation({
    mutationFn: (id: number) => direccionApi.marcarPrincipal(id),
    onSuccess: invalidar,
  });

  function abrirCrear() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function abrirEditar(dir: Direccion) {
    setEditing(dir);
    setForm({
      alias: dir.alias ?? "",
      linea1: dir.linea1,
      linea2: dir.linea2 ?? "",
      ciudad: dir.ciudad,
      provincia: dir.provincia ?? "",
      codigo_postal: dir.codigo_postal ?? "",
      es_principal: dir.es_principal,
    });
    setFormError("");
    setShowModal(true);
  }

  function cerrarModal() {
    setShowModal(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const payload: DireccionCreate = {
      ...form,
      alias: form.alias || undefined,
      linea2: form.linea2 || undefined,
      provincia: form.provincia || undefined,
      codigo_postal: form.codigo_postal || undefined,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Mis Direcciones</h1>
          <p className="text-sm text-surface-500">
            Gestioná tus direcciones de entrega.
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          + Nueva dirección
        </button>
      </header>

      {isLoading && <p className="text-surface-500">Cargando direcciones…</p>}

      {data && data.items.length === 0 && (
        <div className="bg-white rounded-2xl border border-surface-200 p-12 text-center text-surface-400">
          No tenés direcciones guardadas aún.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((dir) => (
          <article
            key={dir.id}
            className={`bg-white rounded-2xl border p-5 flex flex-col gap-3 ${
              dir.es_principal
                ? "border-brand-400 shadow-md shadow-brand-100"
                : "border-surface-200"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                {dir.alias && (
                  <p className="text-xs font-bold text-brand-600 uppercase tracking-wide">
                    {dir.alias}
                  </p>
                )}
                <p className="font-semibold text-surface-900 text-sm">{dir.linea1}</p>
                {dir.linea2 && (
                  <p className="text-xs text-surface-500">{dir.linea2}</p>
                )}
                <p className="text-xs text-surface-500">
                  {dir.ciudad}
                  {dir.provincia ? `, ${dir.provincia}` : ""}
                  {dir.codigo_postal ? ` (${dir.codigo_postal})` : ""}
                </p>
              </div>
              {dir.es_principal && (
                <span className="text-[10px] bg-brand-100 text-brand-700 font-bold px-2 py-0.5 rounded-full shrink-0">
                  Principal
                </span>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {!dir.es_principal && (
                <button
                  onClick={() => principalMutation.mutate(dir.id)}
                  disabled={principalMutation.isPending}
                  className="text-xs px-3 py-1.5 rounded-lg border border-brand-300 text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  Marcar principal
                </button>
              )}
              <button
                onClick={() => abrirEditar(dir)}
                className="text-xs px-3 py-1.5 rounded-lg border border-surface-300 text-surface-600 hover:bg-surface-50 transition-colors"
              >
                Editar
              </button>
              <button
                onClick={() => {
                  if (confirm("¿Eliminar esta dirección?"))
                    deleteMutation.mutate(dir.id);
                }}
                className="text-xs px-3 py-1.5 rounded-lg border border-danger-200 text-danger-600 hover:bg-danger-50 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-modal">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <h2 className="font-bold text-surface-900">
                {editing ? "Editar dirección" : "Nueva dirección"}
              </h2>
              <button onClick={cerrarModal} className="text-surface-400 hover:text-surface-700 text-xl leading-none">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {[
                { label: "Alias (ej: Casa, Trabajo)", key: "alias", required: false },
                { label: "Dirección línea 1 *", key: "linea1", required: true },
                { label: "Dirección línea 2", key: "linea2", required: false },
                { label: "Ciudad *", key: "ciudad", required: true },
                { label: "Provincia", key: "provincia", required: false },
                { label: "Código Postal", key: "codigo_postal", required: false },
              ].map(({ label, key, required }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-surface-700 mb-1">
                    {label}
                  </label>
                  <input
                    type="text"
                    required={required}
                    value={form[key as keyof DireccionCreate] as string ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    className="w-full border border-surface-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              ))}

              <label className="flex items-center gap-2 text-sm text-surface-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.es_principal ?? false}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, es_principal: e.target.checked }))
                  }
                  className="rounded"
                />
                Marcar como dirección principal
              </label>

              {formError && (
                <p className="text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-xl px-3 py-2">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2 rounded-xl border border-surface-300 text-sm text-surface-700 hover:bg-surface-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors"
                >
                  {isSaving ? "Guardando…" : editing ? "Guardar cambios" : "Crear dirección"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}