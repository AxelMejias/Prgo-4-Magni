import { useRef } from "react";
import type { Categoria } from "../../../types";

interface FilterBarProductosProps {
  nombre: string;
  soloDisponibles: boolean | undefined;
  categoriaId: number | undefined;
  categorias: Categoria[];
  onNombreChange: (v: string) => void;
  onSoloDisponiblesChange: (v: boolean | undefined) => void;
  onCategoriaChange: (v: number | undefined) => void;
  onReset: () => void;
  onExport: () => void;
  isExporting: boolean;
  canManage?: boolean;
  onImport?: (file: File) => void;
  isImporting?: boolean;
  onDescargarPlantilla?: () => void;
}

export default function FilterBarProductos({
  nombre,
  soloDisponibles,
  categoriaId,
  categorias,
  onNombreChange,
  onSoloDisponiblesChange,
  onCategoriaChange,
  onReset,
  onExport,
  isExporting,
  canManage = false,
  onImport,
  isImporting = false,
  onDescargarPlantilla,
}: FilterBarProductosProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasActiveFilters = nombre !== "" || soloDisponibles !== undefined || categoriaId !== undefined;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && onImport) {
      onImport(file);
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {/* Búsqueda por nombre */}
      <input
        type="text"
        value={nombre}
        onChange={(e) => onNombreChange(e.target.value)}
        placeholder="Buscar por nombre..."
        className="border border-surface-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-white w-56"
      />

      {/* Filtro disponibilidad */}
      <select
        value={soloDisponibles === undefined ? "" : soloDisponibles ? "true" : "false"}
        onChange={(e) => {
          if (e.target.value === "") onSoloDisponiblesChange(undefined);
          else onSoloDisponiblesChange(e.target.value === "true");
        }}
        className="border border-surface-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-white"
      >
        <option value="">Todos</option>
        <option value="true">✅ Solo disponibles</option>
        <option value="false">🚫 Solo no disponibles</option>
      </select>

      {/* Filtro categoría */}
      {categorias.length > 0 && (
        <select
          value={categoriaId ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onCategoriaChange(v === "" ? undefined : Number(v));
          }}
          className="border border-surface-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-white"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      )}

      {/* Badge limpiar filtros */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-200 px-3 py-2 rounded-xl hover:bg-brand-100 transition cursor-pointer"
        >
          ✕ Limpiar filtros
        </button>
      )}

      <div className="flex-1" />

      {canManage && (
        <>
          <button
            onClick={onDescargarPlantilla}
            className="flex items-center gap-2 bg-surface-100 hover:bg-surface-200 text-surface-700 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer border border-surface-300"
          >
            📋 Plantilla
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            {isImporting ? "Importando..." : "⬆ Importar Excel"}
          </button>
        </>
      )}

      <button
        onClick={onExport}
        disabled={isExporting}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer"
      >
        {isExporting ? "Exportando..." : "⬇ Exportar Excel"}
      </button>
    </div>
  );
}
