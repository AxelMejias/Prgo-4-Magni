import { useState, useEffect, type FormEvent } from "react";
import Modal from "../../../components/Modal";
import type { Ingrediente, IngredienteCreate } from "../../../entities/ingrediente/model";

interface IngredienteModalProps {
  open: boolean;
  editing: Ingrediente | null;
  onClose: () => void;
  onSubmit: (data: IngredienteCreate) => void;
  isSaving: boolean;
  error: string;
  stockOnly?: boolean;
}

const EMPTY: IngredienteCreate = {
  nombre: "",
  descripcion: "",
  unidad_medida: "",
  es_alergeno: false,
  costo_unitario: 0,
  stock_cantidad: 0,
  stock_minimo: 0,
  es_producto_terminado: false,
};

export default function IngredienteModal({
  open,
  editing,
  onClose,
  onSubmit,
  isSaving,
  error,
  stockOnly = false,
}: IngredienteModalProps) {
  const [form, setForm] = useState<IngredienteCreate>(EMPTY);
  const [costoStr, setCostoStr] = useState("");
  const [stockStr, setStockStr] = useState("");
  const [minimoStr, setMinimoStr] = useState("");

  useEffect(() => {
    if (editing) {
      setForm({
        nombre: editing.nombre,
        descripcion: editing.descripcion ?? "",
        unidad_medida: editing.unidad_medida,
        es_alergeno: editing.es_alergeno,
        costo_unitario: Number(editing.costo_unitario),
        stock_cantidad: Number(editing.stock_cantidad),
        stock_minimo: Number(editing.stock_minimo),
        es_producto_terminado: editing.es_producto_terminado,
      });
      setCostoStr(String(Number(editing.costo_unitario)));
      setStockStr(String(Number(editing.stock_cantidad)));
      setMinimoStr(String(Number(editing.stock_minimo)));
    } else {
      setForm(EMPTY);
      setCostoStr("");
      setStockStr("");
      setMinimoStr("");
    }
  }, [editing, open]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar Ingrediente" : "Nuevo Ingrediente"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-danger-50 border border-danger-100 text-danger-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Nombre */}
        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-1.5">
            Nombre <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            maxLength={100}
            disabled={stockOnly}
            className="w-full border border-surface-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition disabled:bg-surface-100 disabled:opacity-60 disabled:cursor-not-allowed bg-white"
            placeholder="Ej: Harina de trigo"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-1.5">
            Descripción
          </label>
          <textarea
            value={form.descripcion ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            maxLength={500}
            rows={2}
            disabled={stockOnly}
            className="w-full border border-surface-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition disabled:bg-surface-100 disabled:opacity-60 disabled:cursor-not-allowed bg-white resize-none"
            placeholder="Descripción opcional..."
          />
        </div>

        {/* Unidad de medida */}
        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-1.5">
            Unidad de Medida <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={form.unidad_medida}
            onChange={(e) => setForm((f) => ({ ...f, unidad_medida: e.target.value }))}
            maxLength={50}
            disabled={stockOnly}
            className="w-full border border-surface-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition disabled:bg-surface-100 disabled:opacity-60 disabled:cursor-not-allowed bg-white"
            placeholder="Ej: kg, lt, unidades"
          />
        </div>

        {/* Fila: costo + stock actual + stock mínimo */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">
              Costo unitario <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={costoStr}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.,]/g, "");
                setCostoStr(val);
                setForm((f) => ({ ...f, costo_unitario: Number(val) }));
              }}
              onFocus={(e) => e.target.select()}
              className="w-full border border-surface-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition bg-white"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">
              Stock actual
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={stockStr}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.,]/g, "");
                setStockStr(val);
                setForm((f) => ({ ...f, stock_cantidad: Number(val) }));
              }}
              onFocus={(e) => e.target.select()}
              className="w-full border border-surface-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition bg-white"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">
              Stock mínimo
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={minimoStr}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.,]/g, "");
                setMinimoStr(val);
                setForm((f) => ({ ...f, stock_minimo: Number(val) }));
              }}
              onFocus={(e) => e.target.select()}
              className="w-full border border-surface-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition bg-white"
              placeholder="0"
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex flex-col gap-3">
          <div className={`flex items-center gap-3 ${stockOnly ? "opacity-50" : ""}`}>
            <input
              id="es_alergeno"
              type="checkbox"
              checked={form.es_alergeno}
              onChange={(e) => setForm((f) => ({ ...f, es_alergeno: e.target.checked }))}
              disabled={stockOnly}
              className="w-4 h-4 accent-orange-500 cursor-pointer disabled:cursor-not-allowed"
            />
            <label htmlFor="es_alergeno" className={`text-sm font-semibold text-surface-700 ${stockOnly ? "" : "cursor-pointer"}`}>
              Es alérgeno{" "}
              <span className="text-xs font-normal text-orange-500">(Reg. UE 1169/2011)</span>
            </label>
          </div>

          <div className={`flex items-center gap-3 ${stockOnly ? "opacity-50" : ""}`}>
            <input
              id="es_producto_terminado"
              type="checkbox"
              checked={form.es_producto_terminado}
              onChange={(e) => setForm((f) => ({ ...f, es_producto_terminado: e.target.checked }))}
              disabled={stockOnly}
              className="w-4 h-4 accent-brand-500 cursor-pointer disabled:cursor-not-allowed"
            />
            <label htmlFor="es_producto_terminado" className={`text-sm font-semibold text-surface-700 ${stockOnly ? "" : "cursor-pointer"}`}>
              Es producto terminado{" "}
              <span className="text-xs font-normal text-surface-400">(ej: Coca-Cola)</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-surface-600 hover:bg-surface-100 transition cursor-pointer border border-surface-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-success-500 hover:bg-success-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            {isSaving ? "Guardando..." : editing ? "Actualizar" : "Crear Ingrediente"}
          </button>
        </div>
      </form>
    </Modal>
  );
}