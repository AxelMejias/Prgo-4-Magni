import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ingredienteApi } from "../entities/ingrediente/api";
import type { Ingrediente, IngredienteCreate, IngredienteFilters } from "../entities/ingrediente/model";
import FilterBar from "../features/ingredientes-filter/ui/FilterBar";
import IngredienteModal from "../features/ingredientes-crud/ui/IngredienteModal";
import IngredientesTable from "../widgets/ingredientes-table/ui/IngredientesTable";

const DEFAULT_FILTERS: IngredienteFilters = { page: 1, size: 20 };

export default function IngredientesPage() {
  const queryClient = useQueryClient();

  // Filtros y paginación
  const [filters, setFilters] = useState<IngredienteFilters>(DEFAULT_FILTERS);
  const [nombreInput, setNombreInput] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Ingrediente | null>(null);
  const [modalError, setModalError] = useState("");

  // Export
  const [isExporting, setIsExporting] = useState(false);

  // ── Query ──────────────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ["ingredientes", filters],
    queryFn: () => ingredienteApi.getAll(filters),
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload: IngredienteCreate) => ingredienteApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredientes"] });
      closeModal();
    },
    onError: (err: Error) => setModalError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: IngredienteCreate }) =>
      ingredienteApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredientes"] });
      closeModal();
    },
    onError: (err: Error) => setModalError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ingredienteApi.softDelete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ingredientes"] }),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  function openCreate() {
    setEditing(null);
    setModalError("");
    setModalOpen(true);
  }

  function openEdit(ing: Ingrediente) {
    setEditing(ing);
    setModalError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setModalError("");
  }

  function handleSubmit(payload: IngredienteCreate) {
    setModalError("");
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleDelete(ing: Ingrediente) {
    if (window.confirm(`¿Eliminár "${ing.nombre}"? Esta acción es un borrado lógico.`)) {
      deleteMutation.mutate(ing.id);
    }
  }

  function handleNombreChange(v: string) {
    setNombreInput(v);
    setFilters((f) => ({ ...f, nombre: v || undefined, page: 1 }));
  }

  function handleEsAlergenoChange(v: boolean | undefined) {
    setFilters((f) => ({ ...f, es_alergeno: v, page: 1 }));
  }

  function handleResetFilters() {
    setNombreInput("");
    setFilters(DEFAULT_FILTERS);
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      await ingredienteApi.exportToExcel();
    } finally {
      setIsExporting(false);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center text-xl">
            🧂
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-800">Ingredientes</h1>
            <p className="text-sm text-surface-400 mt-0.5">
              {data ? `${data.total} ingrediente${data.total !== 1 ? "s" : ""} en total` : "Cargando..."}
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="bg-success-500 hover:bg-success-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span>
          Nuevo Ingrediente
        </button>
      </div>

      {/* Filtros */}
      <FilterBar
        nombre={nombreInput}
        esAlergeno={filters.es_alergeno}
        onNombreChange={handleNombreChange}
        onEsAlergenoChange={handleEsAlergenoChange}
        onReset={handleResetFilters}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* Estados */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-surface-200 p-16 text-center">
          <div className="w-10 h-10 border-3 border-success-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-surface-400 text-sm">Cargando ingredientes...</p>
        </div>
      )}
      {isError && (
        <div className="bg-danger-50 border border-danger-100 rounded-xl p-6 text-center text-danger-600">
          Error al cargar los ingredientes
        </div>
      )}

      {/* Tabla */}
      {data && (
        <IngredientesTable
          data={data}
          onEdit={openEdit}
          onDelete={handleDelete}
          onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
          isDeleting={deleteMutation.isPending}
        />
      )}

      {/* Modal */}
      <IngredienteModal
        open={modalOpen}
        editing={editing}
        onClose={closeModal}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        error={modalError}
      />
    </div>
  );
}
