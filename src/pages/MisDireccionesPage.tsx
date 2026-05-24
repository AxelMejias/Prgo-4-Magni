import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { direccionApi } from "../entities/direccion/api";
import type { Direccion, DireccionCreate } from "../entities/direccion/model";
import Modal from "../components/Modal";

interface FormState {
  alias: string;
  linea1: string;
  linea2: string;
  ciudad: string;
  provincia: string;
  codigo_postal: string;
  es_principal: boolean;
}

const emptyForm: FormState = {
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
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Direccion | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");

  // ── useQuery: mis direcciones ────────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ["direcciones"],
    queryFn: () => direccionApi.getAll(1, 50),
  });

  // ── useMutation: alta ────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload: DireccionCreate) => direccionApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["direcciones"] });
      closeModal();
    },
    onError: (err: Error) => setError(err.message),
  });

  // ── useMutation: edición ─────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DireccionCreate }) =>
      direccionApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["direcciones"] });
      closeModal();
    },
    onError: (err: Error) => setError(err.message),
  });

  // ── useMutation: marcar principal ────────────────────────────────────
  const principalMutation = useMutation({
    mutationFn: (id: number) => direccionApi.marcarPrincipal(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["direcciones"] }),
  });

  // ── useMutation: soft delete ─────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => direccionApi.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["direcciones"] }),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(d: Direccion) {
    setEditing(d);
    setForm({
      alias: d.alias ?? "",
      linea1: d.linea1,
      linea2: d.linea2 ?? "",
      ciudad: d.ciudad,
      provincia: d.provincia ?? "",
      codigo_postal: d.codigo_postal ?? "",
      es_principal: d.es_principal,
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

    const payload: DireccionCreate = {
      alias: form.alias.trim() || undefined,
      linea1: form.linea1.trim(),
      linea2: form.linea2.trim() || undefined,
      ciudad: form.ciudad.trim(),
      provincia: form.provincia.trim() || undefined,
      codigo_postal: form.codigo_postal.trim() || undefined,
      es_principal: form.es_principal,
    };

    if (!payload.linea1 || !payload.ciudad) {
      setError("Línea 1 y ciudad son obligatorias.");
      return;
    }

    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleDelete(d: Direccion) {
    if (window.confirm(`¿Eliminar la dirección "${d.alias ?? d.linea1}"?`)) {
      deleteMutation.mutate(d.id);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Mis direcciones</h1>
          <p className="text-sm text-surface-500">
            Gestioná tus direcciones de entrega.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          + Nueva dirección
        </button>
      </header>

      {isLoading && <p className="text-surface-500">Cargando…</p>}
      {isError && <p className="text-danger-600">Error al cargar direcciones.</p>}

      {data && (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.items.length === 0 ? (
            <li className="col-span-full text-center py-12 bg-white rounded-2xl border border-surface-200 text-surface-500">
              No tenés direcciones cargadas todavía.
            </li>
          ) : (
            data.items.map((d) => (
              <li
                key={d.id}
                className={`bg-white rounded-2xl border p-5 space-y-3 ${
                  d.es_principal
                    ? "border-brand-500 ring-2 ring-brand-100"
                    : "border-surface-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-surface-900">
                        {d.alias || "Sin alias"}
                      </h3>
                      {d.es_principal && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                          PRINCIPAL
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-surface-700 mt-1">
                      {d.linea1}
                      {d.linea2 && `, ${d.linea2}`}
                    </p>
                    <p className="text-sm text-surface-600">
                      {d.ciudad}
                      {d.provincia && `, ${d.provincia}`}
                      {d.codigo_postal && ` (${d.codigo_postal})`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-100">
                  {!d.es_principal && (
                    <button
                      onClick={() => principalMutation.mutate(d.id)}
                      disabled={principalMutation.isPending}
                      className="text-xs text-brand-600 font-semibold hover:underline disabled:opacity-50"
                    >
                      ★ Marcar como principal
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(d)}
                    className="text-xs text-surface-700 font-semibold hover:underline ml-auto"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(d)}
                    className="text-xs text-danger-600 font-semibold hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Editar dirección" : "Nueva dirección"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Alias (ej: Casa, Trabajo)"
              value={form.alias}
              onChange={(v) => setForm({ ...form, alias: v })}
            />
            <Field
              label="Código postal"
              value={form.codigo_postal}
              onChange={(v) => setForm({ ...form, codigo_postal: v })}
            />
          </div>
          <Field
            label="Línea 1 *"
            value={form.linea1}
            onChange={(v) => setForm({ ...form, linea1: v })}
            required
          />
          <Field
            label="Línea 2"
            value={form.linea2}
            onChange={(v) => setForm({ ...form, linea2: v })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Ciudad *"
              value={form.ciudad}
              onChange={(v) => setForm({ ...form, ciudad: v })}
              required
            />
            <Field
              label="Provincia"
              value={form.provincia}
              onChange={(v) => setForm({ ...form, provincia: v })}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.es_principal}
              onChange={(e) =>
                setForm({ ...form, es_principal: e.target.checked })
              }
            />
            Marcar como principal
          </label>

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
              {editing ? "Guardar cambios" : "Crear"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Pequeño helper de campo de texto para no repetir markup
function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-surface-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  );
}