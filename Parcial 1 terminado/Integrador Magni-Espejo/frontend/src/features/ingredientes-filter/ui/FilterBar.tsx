interface FilterBarProps {
  nombre: string;
  esAlergeno: boolean | undefined;
  onNombreChange: (v: string) => void;
  onEsAlergenoChange: (v: boolean | undefined) => void;
  onReset: () => void;
  onExport: () => void;
  isExporting: boolean;
}

export default function FilterBar({
  nombre,
  esAlergeno,
  onNombreChange,
  onEsAlergenoChange,
  onReset,
  onExport,
  isExporting,
}: FilterBarProps) {
  const hasActiveFilters = nombre !== "" || esAlergeno !== undefined;

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

      {/* Filtro alérgeno */}
      <select
        value={esAlergeno === undefined ? "" : esAlergeno ? "true" : "false"}
        onChange={(e) => {
          if (e.target.value === "") onEsAlergenoChange(undefined);
          else onEsAlergenoChange(e.target.value === "true");
        }}
        className="border border-surface-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-white"
      >
        <option value="">Todos</option>
        <option value="true">Solo alérgenos</option>
        <option value="false">Sin alérgenos</option>
      </select>

      {/* Badge filtros activos */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-200 px-3 py-2 rounded-xl hover:bg-brand-100 transition cursor-pointer"
        >
          ✕ Limpiar filtros
        </button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Exportar Excel */}
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
