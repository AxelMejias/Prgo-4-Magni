import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ingredientesApi } from "../../../services/api";
import type { Ingrediente } from "../../../types";
import { ingredienteApi } from "../../../entities/ingrediente/api";

interface InsumoSelectorProps {
  open: boolean;
  onClose: () => void;
  selectedIds: number[];
  onToggle: (ing: Ingrediente) => void;
}

export default function InsumoSelector({
  open,
  onClose,
  selectedIds,
  onToggle,
}: InsumoSelectorProps) {
  const [search, setSearch] = useState("");
  const [soloTerminados, setSoloTerminados] = useState<boolean | undefined>(undefined);
  const [soloAlergenos, setSoloAlergenos] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);

const { data, isLoading } = useQuery({
  queryKey: ["insumos-selector", search, soloTerminados, soloAlergenos, page],
    queryFn: () =>
    ingredienteApi.getAll({
        nombre: search || undefined,
        es_alergeno: soloAlergenos,
        page: page,
        size: 12,
    }),
  enabled: open,
});

  if (!open) return null;

  function handleReset() {
    setSearch("");
    setSoloTerminados(undefined);
    setSoloAlergenos(undefined);
    setPage(1);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-surface-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col border border-surface-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 bg-surface-50 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-success-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">🧂</span>
            </div>
            <div>
              <h2 className="font-semibold text-surface-800 text-base">Seleccionar Insumos</h2>
              <p className="text-xs text-surface-400">
                {selectedIds.length} insumo{selectedIds.length !== 1 ? "s" : ""} seleccionado{selectedIds.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-700 hover:bg-surface-200 transition-all text-lg leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Filtros */}
        <div className="px-6 py-3 border-b border-surface-100 bg-white shrink-0">
          <div className="flex gap-3 items-center flex-wrap">
            {/* Buscador */}
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar insumo..."
                className="w-full pl-9 pr-4 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
              />
            </div>

            {/* Filtro alérgeno */}
            <div className="flex gap-1 bg-surface-100 p-1 rounded-xl">
              {[
                { label: "Todos", value: undefined },
                { label: "⚠️ Alérgenos", value: true },
                { label: "Sin alérgeno", value: false },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => { setSoloAlergenos(opt.value); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    soloAlergenos === opt.value
                      ? "bg-white text-surface-800 shadow-sm"
                      : "text-surface-500 hover:text-surface-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Filtro producto terminado */}
            <div className="flex gap-1 bg-surface-100 p-1 rounded-xl">
              {[
                { label: "Todos", value: undefined },
                { label: "📦 Terminados", value: true },
                { label: "Materias primas", value: false },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => { setSoloTerminados(opt.value); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    soloTerminados === opt.value
                      ? "bg-white text-surface-800 shadow-sm"
                      : "text-surface-500 hover:text-surface-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Reset */}
            {(search || soloAlergenos !== undefined || soloTerminados !== undefined) && (
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 text-xs font-semibold text-danger-600 bg-danger-50 hover:bg-danger-100 rounded-xl transition cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Grilla de insumos */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {data && data.items.length === 0 && (
            <div className="text-center py-16 text-surface-400">
              <p className="text-3xl mb-2">🧂</p>
              <p className="font-medium">No se encontraron insumos</p>
              <p className="text-xs mt-1">Probá con otros filtros</p>
            </div>
          )}

          {data && (
            <>
              {/* Filtro adicional por producto terminado (client-side sobre los resultados) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data.items
                  .filter((ing) =>
                    soloTerminados === undefined
                      ? true
                      : ing.es_producto_terminado === soloTerminados
                  )
                  .map((ing) => {
                    const isSelected = selectedIds.includes(ing.id);
                    return (
                      <button
                        key={ing.id}
                        type="button"
                        onClick={() => onToggle(ing)}
                        className={`relative text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "border-brand-500 bg-brand-50"
                            : "border-surface-200 bg-white hover:border-brand-300 hover:bg-surface-50"
                        }`}
                      >
                        {/* Check */}
                        {isSelected && (
                          <span className="absolute top-2 right-2 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                            ✓
                          </span>
                        )}

                        {/* Badges */}
                        <div className="flex gap-1 mb-2 flex-wrap">
                          {ing.es_producto_terminado && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-600">
                              📦 Terminado
                            </span>
                          )}
                          {ing.es_alergeno && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">
                              ⚠️ Alérgeno
                            </span>
                          )}
                        </div>

                        <p className={`font-semibold text-sm leading-tight mb-1 ${isSelected ? "text-brand-700" : "text-surface-800"}`}>
                          {ing.nombre}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-surface-400 bg-surface-100 px-2 py-0.5 rounded-lg">
                            {ing.unidad_medida}
                          </span>
                          <span className="text-xs font-semibold text-success-700">
                            ${Number(ing.costo_unitario).toLocaleString("es-AR")}
                          </span>
                        </div>

                        {/* Stock */}
                        <div className="mt-1.5">
                          <div className="flex items-center justify-between text-[10px] text-surface-400 mb-0.5">
                            <span>Stock</span>
                            <span className={Number(ing.stock_cantidad) <= Number(ing.stock_minimo) && Number(ing.stock_minimo) > 0 ? "text-danger-500 font-bold" : ""}>
                              {Number(ing.stock_cantidad).toLocaleString("es-AR")} {ing.unidad_medida}
                              {Number(ing.stock_cantidad) <= Number(ing.stock_minimo) && Number(ing.stock_minimo) > 0 && " ⚠️"}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>

              {/* Paginación */}
              {data.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-surface-200 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    ← Anterior
                  </button>
                  <span className="text-xs text-surface-500">
                    {page} / {data.pages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= data.pages}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-surface-200 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-100 bg-surface-50 rounded-b-2xl shrink-0 flex items-center justify-between">
          <p className="text-xs text-surface-400">
            Hacé click en un insumo para seleccionarlo o deseleccionarlo
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition cursor-pointer"
          >
            Confirmar ({selectedIds.length})
          </button>
        </div>
      </div>
    </div>
  );
}