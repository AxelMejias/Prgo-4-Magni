import type { Ingrediente, PaginatedIngredientes } from "../../../entities/ingrediente/model";

interface IngredientesTableProps {
  data: PaginatedIngredientes;
  onEdit: (ing: Ingrediente) => void;
  onDelete: (ing: Ingrediente) => void;
  onPageChange: (page: number) => void;
  isDeleting: boolean;
  canManage?: boolean;
}

function formatARS(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(n);
}

export default function IngredientesTable({
  data,
  onEdit,
  onDelete,
  onPageChange,
  isDeleting,
  canManage = false,
}: IngredientesTableProps) {
  const { items, total, page, size, pages } = data;

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="bg-surface-50 border-b border-surface-200">
            <th className="text-left px-4 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">ID</th>
            <th className="text-left px-4 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">Nombre</th>
            <th className="text-left px-4 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">Unidad</th>
            <th className="text-right px-4 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">Costo unit.</th>
            <th className="text-right px-4 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">Stock</th>
            <th className="text-right px-4 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">Mínimo</th>
            <th className="text-center px-4 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">Flags</th>
            <th className="text-center px-4 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center py-16 text-surface-400">
                <p className="text-3xl mb-2">🧂</p>
                <p className="font-medium">No se encontraron ingredientes</p>
                <p className="text-xs mt-1">Probá con otros filtros o creá uno nuevo</p>
              </td>
            </tr>
          )}
          {items.map((ing, i) => {
            const isDeleted = !!ing.deleted_at;
            const stockBajo = !isDeleted && Number(ing.stock_cantidad) <= Number(ing.stock_minimo) && Number(ing.stock_minimo) > 0;

            return (
              <tr
                key={ing.id}
                className={`border-b border-surface-100 last:border-0 transition-colors ${
                  isDeleted
                    ? "bg-gray-50 opacity-60"
                    : i % 2 === 0
                    ? "bg-white hover:bg-surface-50/50"
                    : "bg-surface-50/30 hover:bg-surface-50"
                }`}
              >
                {/* ID */}
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-100 text-xs font-bold text-surface-500">
                    {ing.id}
                  </span>
                </td>

                {/* Nombre */}
                <td className="px-4 py-3.5">
                  <p className={`font-semibold text-sm ${isDeleted ? "line-through text-surface-400" : "text-surface-800"}`}>
                    {ing.nombre}
                  </p>
                  {ing.descripcion && (
                    <p className="text-xs text-surface-400 truncate max-w-[160px]">{ing.descripcion}</p>
                  )}
                </td>

                {/* Unidad */}
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                    📏 {ing.unidad_medida}
                  </span>
                </td>

                {/* Costo unitario */}
                <td className="px-4 py-3.5 text-right">
                  <span className="text-sm font-semibold text-surface-700">
                    {formatARS(Number(ing.costo_unitario))}
                  </span>
                </td>

                {/* Stock actual */}
                <td className="px-4 py-3.5 text-right">
                  <span className={`text-sm font-bold ${stockBajo ? "text-danger-600" : "text-surface-700"}`}>
                    {Number(ing.stock_cantidad).toLocaleString("es-AR")}
                    {stockBajo && <span className="ml-1 text-[10px]">⚠️</span>}
                  </span>
                </td>

                {/* Stock mínimo */}
                <td className="px-4 py-3.5 text-right">
                  <span className="text-xs text-surface-400">
                    {Number(ing.stock_minimo).toLocaleString("es-AR")}
                  </span>
                </td>

                {/* Flags */}
                <td className="px-4 py-3.5">
                  <div className="flex flex-col gap-1 items-center">
                    {ing.es_alergeno && (
                      <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        ⚠️ Alérgeno
                      </span>
                    )}
                    {ing.es_producto_terminado && (
                      <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-600 border border-brand-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        📦 Terminado
                      </span>
                    )}
                    {!ing.es_alergeno && !ing.es_producto_terminado && (
                      <span className="text-surface-300 text-xs">—</span>
                    )}
                  </div>
                </td>

                {/* Acciones */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-center gap-2">
                    {!isDeleted && canManage && (
                      <>
                        <button
                          onClick={() => onEdit(ing)}
                          className="p-2 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 transition-all text-xs font-semibold cursor-pointer"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => onDelete(ing)}
                          disabled={isDeleting}
                          className="p-2 rounded-lg bg-danger-50 text-danger-600 hover:bg-danger-100 disabled:opacity-50 transition-all text-xs font-semibold cursor-pointer"
                        >
                          🗑️ Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer paginación */}
      <div className="px-6 py-3 bg-surface-50 border-t border-surface-200 flex items-center justify-between">
        <span className="text-xs text-surface-400">
          {total} resultado{total !== 1 && "s"} — página {page} de {pages || 1}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-surface-200 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            ← Anterior
          </button>
          {(() => {
            const startPage = Math.max(1, Math.min(page - 2, pages - 4));
            const endPage = Math.min(pages, startPage + 4);
            return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
              const p = startPage + i;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    p === page
                      ? "bg-brand-500 text-white shadow-sm"
                      : "border border-surface-200 hover:bg-surface-100 text-surface-600"
                  }`}
                >
                  {p}
                </button>
              );
            });
          })()}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pages}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-surface-200 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}