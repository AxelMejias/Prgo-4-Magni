import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productosApi } from "../services/api";
import { formatARS } from "../shared/lib/format";

export default function ProductoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [disponibleInput, setDisponibleInput] = useState<boolean>(true);
  const [saved, setSaved] = useState(false);

  const { data: producto, isLoading, isError } = useQuery({
    queryKey: ["productos", id],
    queryFn: () => productosApi.getById(Number(id)),
    enabled: !!id,
  });

  useEffect(() => {
    if (producto) {
      setDisponibleInput(producto.disponible);
    }
  }, [producto]);

  const updateMutation = useMutation({
    mutationFn: (payload: { disponible: boolean }) =>
      productosApi.toggleDisponibilidad(Number(id), payload.disponible),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["productos", id] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-surface-400 text-sm">Cargando producto...</p>
      </div>
    );
  }

  if (isError || !producto) {
    return (
      <div className="text-center py-20">
        <p className="text-3xl mb-3">😕</p>
        <p className="text-danger-500 font-medium mb-4">No se pudo cargar el producto</p>
        <button
          onClick={() => navigate("/productos")}
          className="text-brand-600 hover:text-brand-800 text-sm font-semibold cursor-pointer bg-brand-50 px-4 py-2 rounded-xl hover:bg-brand-100 transition"
        >
          ← Volver a productos
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate("/productos")}
        className="text-surface-500 hover:text-surface-700 text-sm font-medium mb-6 cursor-pointer inline-flex items-center gap-2 bg-white border border-surface-200 px-4 py-2 rounded-xl hover:bg-surface-50 transition"
      >
        ← Volver a productos
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-surface-200 p-6 mb-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-brand-500 flex items-center justify-center text-2xl shadow-sm">
              📦
            </div>
            <div>
              <h1 className="text-2xl font-bold text-surface-800">{producto.nombre}</h1>
              {producto.descripcion && (
                <p className="text-surface-500 mt-1 text-sm">{producto.descripcion}</p>
              )}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="inline-flex items-center bg-surface-100 text-surface-500 px-3 py-1 rounded-lg text-xs font-bold">
                  ID: {producto.id}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${
                  producto.disponible ? "bg-success-50 text-success-700" : "bg-surface-100 text-surface-500"
                }`}>
                  {producto.disponible ? "Visible en tienda" : "Oculto"}
                </span>
                <span className="inline-flex items-center bg-brand-50 text-brand-700 px-3 py-1 rounded-lg text-xs font-bold">
                  Margen: {(Number(producto.margen_ganancia) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-surface-400 mb-1 uppercase font-bold tracking-wider">Precio</p>
            <span className="text-3xl font-bold text-success-600">
              {formatARS(Number(producto.precio))}
            </span>
            <p className="text-xs text-surface-400 mt-1">
              Costo: {formatARS(Number(producto.costo_total_insumos))}
            </p>
          </div>
        </div>
      </div>

      {/* Disponibilidad */}
      <div className="bg-white rounded-xl border border-surface-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-sm">
            👁️
          </div>
          <div>
            <h2 className="font-bold text-surface-800 text-sm">Disponibilidad</h2>
            <p className="text-xs text-surface-400">Controlá si el producto aparece en la tienda</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setDisponibleInput((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-colors ${
              disponibleInput
                ? "border-success-400 bg-success-50 text-success-700"
                : "border-surface-300 bg-surface-100 text-surface-500"
            }`}
          >
            <span className={`w-3 h-3 rounded-full ${disponibleInput ? "bg-success-500" : "bg-surface-400"}`} />
            {disponibleInput ? "Visible" : "Oculto"}
          </button>
          <button
            onClick={() => updateMutation.mutate({ disponible: disponibleInput })}
            disabled={updateMutation.isPending}
            className="px-5 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {updateMutation.isPending ? "Guardando…" : "Guardar"}
          </button>
          {saved && <span className="text-sm text-success-600 font-semibold">✓ Guardado</span>}
        </div>
      </div>

      {/* Grid: categorías e insumos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categorías */}
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-warning-50 border-b border-warning-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-warning-500 flex items-center justify-center text-sm">🏷️</div>
            <div>
              <h2 className="font-bold text-surface-800 text-sm">Categorías</h2>
              <p className="text-xs text-surface-400">
                {producto.categorias.length} asignada{producto.categorias.length !== 1 && "s"}
              </p>
            </div>
          </div>
          <div className="p-6">
            {producto.categorias.length === 0 ? (
              <p className="text-center text-surface-300 text-sm py-6">Sin categorías asignadas</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {producto.categorias.map((cat) => (
                  <div key={cat.id} className="bg-warning-50 border border-warning-100 rounded-xl px-4 py-2.5">
                    <p className="text-sm font-semibold text-warning-600">{cat.nombre}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Insumos */}
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-success-50 border-b border-success-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-success-500 flex items-center justify-center text-sm">🧂</div>
            <div>
              <h2 className="font-bold text-surface-800 text-sm">Insumos</h2>
              <p className="text-xs text-surface-400">
                {producto.insumos.length} insumo{producto.insumos.length !== 1 && "s"}
              </p>
            </div>
          </div>
          <div className="p-0">
            {producto.insumos.length === 0 ? (
              <p className="text-center text-surface-300 text-sm py-10">Sin insumos asignados</p>
            ) : (
              <>
                {producto.insumos.map((ins, i) => {
                  const stockBajo = Number(ins.stock_actual) <= 0;
                  return (
                    <div
                      key={ins.ingrediente_id}
                      className={`flex items-center justify-between px-6 py-3.5 border-b border-surface-100 last:border-0 ${
                        i % 2 === 0 ? "bg-white" : "bg-surface-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-md bg-success-50 flex items-center justify-center text-xs font-bold text-success-600">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-surface-700">{ins.nombre}</p>
                          <p className={`text-xs ${stockBajo ? "text-danger-500 font-semibold" : "text-surface-400"}`}>
                            Stock: {Number(ins.stock_actual).toLocaleString("es-AR")} {ins.unidad_medida}
                            {stockBajo && " ⚠️"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1 rounded-lg text-xs font-bold">
                          {ins.cantidad} {ins.unidad_medida}
                        </span>
                        <p className="text-xs text-surface-400 mt-1">
                          {formatARS(Number(ins.subtotal))}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {/* Total insumos */}
                <div className="px-6 py-3 bg-surface-50 border-t border-surface-200 flex justify-between text-sm font-semibold">
                  <span className="text-surface-600">Costo total insumos</span>
                  <span className="text-surface-800">{formatARS(Number(producto.costo_total_insumos))}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}