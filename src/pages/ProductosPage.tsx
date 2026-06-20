import { useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { productosApi, categoriasApi, ingredientesApi } from "../services/api";
import type {
  Ingrediente,
  ProductoListItem,
  ProductoCreate,
  ProductoUpdate,
} from "../types";
import Modal from "../components/Modal";
import { useAuthStore } from "../shared/store/authStore";
import InsumoSelector from "../features/productos-crud/ui/InsumoSelector";
import FilterBarProductos from "../features/productos-filter/ui/FilterBar";
import { useCatalogoRealtime } from "../shared/hooks/useCatalogoRealtime";

type Tab = "activos" | "inactivos";

const PAGE_SIZE = 5;

export default function ProductosPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  // Refresca la grilla automáticamente cuando otro usuario/pestaña cambia el catálogo.
  useCatalogoRealtime();
  const canManage = useAuthStore((s) => s.hasRole(["ADMIN"]));

  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as Tab) ?? "activos";
  const currentPage = parseInt(searchParams.get("page") ?? "1", 10);
  const nombreParam = searchParams.get("nombre") ?? "";
  const categoriaParam = searchParams.get("categoria_id");
  const categoriaId = categoriaParam ? Number(categoriaParam) : undefined;
  const conStockRaw = searchParams.get("con_stock");
  const conStock: boolean | undefined =
    conStockRaw === "true" ? true : conStockRaw === "false" ? false : undefined;

  const [nombreInput, setNombreInput] = useState(nombreParam);

  // ── Modal CRUD ─────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [margenGanancia, setMargenGanancia] = useState("30");
  const [selectedCategorias, setSelectedCategorias] = useState<number[]>([]);
  const [selectedInsumos, setSelectedInsumos] = useState<{ ingrediente_id: number; cantidad: string }[]>([]);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [selectorOpen, setSelectorOpen] = useState(false);

  // ── Excel ──────────────────────────────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    creados: number; omitidos: number; errores: { fila: number; nombre: string; motivo: string }[];
  } | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: productosData, isLoading, isError } = useQuery({
    queryKey: ["productos", "activos", currentPage, nombreParam, conStock, categoriaId],
    queryFn: () =>
      productosApi.getAll(currentPage, PAGE_SIZE, {
        nombre: nombreParam || undefined,
        // El admin gestiona TODO el catálogo (visibles y ocultos); el filtro de
        // disponibilidad ahora es por STOCK real, no por el flag visible/oculto.
        solo_disponibles: false,
        con_stock: conStock,
        categoria_id: categoriaId,
      }),
    enabled: tab === "activos",
  });

  const { data: inactivosData, isLoading: isLoadingInactivos, isError: isErrorInactivos } = useQuery({
    queryKey: ["productos", "inactivos", currentPage],
    queryFn: () => productosApi.getInactivos(currentPage, PAGE_SIZE),
    enabled: tab === "inactivos",
  });

  const { data: categorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: categoriasApi.getAll,
  });

  const { data: ingredientes } = useQuery({
    queryKey: ["ingredientes-select"],
    queryFn: ingredientesApi.getAll,
  });

  const { data: editingDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["productos", "detail-edit", editingId],
    queryFn: () => productosApi.getById(editingId!),
    enabled: !!editingId,
  });

  // Cargar datos al editar
  useEffect(() => {
    if (editingDetail && editingId) {
      setImageUrl(editingDetail.image_url ?? "");
      setSelectedCategorias(editingDetail.categorias.map((c) => c.id));
      setSelectedInsumos(
        editingDetail.insumos.map((i) => ({
          ingrediente_id: i.ingrediente_id,
          cantidad: String(i.cantidad),
        }))
      );
      setMargenGanancia(String(Math.round(Number(editingDetail.margen_ganancia) * 100)));
    }
  }, [editingDetail, editingId]);

  // Descripción automática desde insumos
  useEffect(() => {
    if (!ingredientes) return;
    const nombres = selectedInsumos
      .filter((s) => s.ingrediente_id > 0)
      .map((s) => ingredientes.find((i) => i.id === s.ingrediente_id)?.nombre)
      .filter(Boolean)
      .join(", ");
    setDescripcion(nombres || "");
  }, [selectedInsumos, ingredientes]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: ProductoCreate) => productosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      closeModal();
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductoUpdate }) =>
      productosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      closeModal();
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productosApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productos"] }),
  });

  const destacarMutation = useMutation({
    mutationFn: ({ id, destacado }: { id: number; destacado: boolean }) =>
      productosApi.toggleDestacado(id, destacado),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productos"] }),
    onError: (err: Error) => alert(err.message),
  });

  const reactivarMutation = useMutation({
    mutationFn: (id: number) => productosApi.reactivar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productos"] }),
  });

  // ── Helpers de URL ─────────────────────────────────────────────────────────
  function setCurrentPage(updater: number | ((p: number) => number)) {
    const next = typeof updater === "function" ? updater(currentPage) : updater;
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", String(next));
      return params;
    });
  }

  function switchTab(t: Tab) {
    setSearchParams({ tab: t, page: "1" });
  }

  function handleNombreChange(v: string) {
    setNombreInput(v);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", "1");
      if (v) params.set("nombre", v);
      else params.delete("nombre");
      return params;
    });
  }

  function handleConStockChange(v: boolean | undefined) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", "1");
      if (v === undefined) params.delete("con_stock");
      else params.set("con_stock", String(v));
      return params;
    });
  }

  function handleCategoriaChange(v: number | undefined) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", "1");
      if (v === undefined) params.delete("categoria_id");
      else params.set("categoria_id", String(v));
      return params;
    });
  }

  function handleResetFilters() {
    setNombreInput("");
    setSearchParams({ tab: "activos", page: "1" });
  }

  // ── Excel handlers ─────────────────────────────────────────────────────────
  async function handleExport() {
    setIsExporting(true);
    try {
      await productosApi.exportToExcel();
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImport(file: File) {
    setIsImporting(true);
    try {
      const result = await productosApi.importarExcel(file);
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ["productos"] });
    } catch (err) {
      setImportResult({
        creados: 0, omitidos: 0,
        errores: [{ fila: 0, nombre: "", motivo: err instanceof Error ? err.message : "Error inesperado" }],
      });
    } finally {
      setIsImporting(false);
    }
  }

  async function handleDescargarPlantilla() {
    await productosApi.descargarPlantilla();
  }

  // ── Modal CRUD helpers ─────────────────────────────────────────────────────
  function openCreate() {
    setEditingId(null);
    setNombre("");
    setDescripcion("");
    setImageUrl("");
    setMargenGanancia("30");
    setSelectedCategorias([]);
    setSelectedInsumos([]);
    setError("");
    setModalOpen(true);
  }

  function openEdit(prod: ProductoListItem) {
    setEditingId(prod.id);
    setNombre(prod.nombre);
    setDescripcion(prod.descripcion ?? "");
    setImageUrl(prod.image_url ?? "");
    setMargenGanancia(String(Math.round(Number(prod.margen_ganancia) * 100)));
    setSelectedCategorias([]);
    setSelectedInsumos([]);
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setImageUrl("");
    setError("");
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    setError("");
    try {
      const url = await productosApi.uploadImage(file);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir imagen");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const insumosValidos = selectedInsumos
      .filter((i) => i.ingrediente_id > 0 && Number(i.cantidad) > 0)
      .map((i) => ({ ingrediente_id: i.ingrediente_id, cantidad: Number(i.cantidad) }));

    if (insumosValidos.length === 0) {
      setError("Debe agregar al menos un insumo.");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: {
          nombre,
          descripcion: descripcion || undefined,
          image_url: imageUrl || undefined,
          margen_ganancia: Number(margenGanancia) / 100,
          categoria_ids: selectedCategorias,
          insumos: insumosValidos,
        },
      });
    } else {
      createMutation.mutate({
        nombre,
        descripcion: descripcion || undefined,
        image_url: imageUrl || undefined,
        margen_ganancia: Number(margenGanancia) / 100,
        categoria_ids: selectedCategorias,
        insumos: insumosValidos,
      });
    }
  }

  function handleDelete(id: number) {
    if (window.confirm("¿Eliminar este producto? Pasará a inactivos.")) {
      deleteMutation.mutate(id);
    }
  }

  function handleReactivar(prod: ProductoListItem) {
    if (window.confirm(`¿Reactivar "${prod.nombre}"?`)) {
      reactivarMutation.mutate(prod.id);
    }
  }

  function handleToggleInsumo(ing: Ingrediente) {
    setSelectedInsumos((prev) => {
      const exists = prev.find((s) => s.ingrediente_id === ing.id);
      if (exists) return prev.filter((s) => s.ingrediente_id !== ing.id);
      return [...prev, { ingrediente_id: ing.id, cantidad: ing.es_producto_terminado ? "1" : "" }];
    });
  }

  function removeInsumo(index: number) {
    setSelectedInsumos((prev) => prev.filter((_, i) => i !== index));
  }

  function updateInsumoId(index: number, value: number) {
    const esTerminado = ingredientes?.find((i) => i.id === value)?.es_producto_terminado;
    setSelectedInsumos((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, ingrediente_id: value, cantidad: esTerminado ? "1" : item.cantidad }
          : item
      )
    );
  }

  function updateInsumoCantidad(index: number, value: string) {
    setSelectedInsumos((prev) =>
      prev.map((item, i) => (i === index ? { ...item, cantidad: value } : item))
    );
  }

  function toggleCategoria(id: number) {
    setSelectedCategorias((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending || (!!editingId && isLoadingDetail);
  const currentData = tab === "activos" ? productosData : inactivosData;
  const currentLoading = tab === "activos" ? isLoading : isLoadingInactivos;
  const currentError = tab === "activos" ? isError : isErrorInactivos;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-xl">
            📦
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-800">Productos</h1>
            <p className="text-sm text-surface-400 mt-0.5">
              {currentData
                ? `${currentData.total} producto${currentData.total !== 1 ? "s" : ""} ${tab === "activos" ? "activos" : "inactivos"}`
                : "Cargando..."}
            </p>
          </div>
        </div>
        {canManage && tab === "activos" && (
          <button
            onClick={openCreate}
            className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span>
            Nuevo Producto
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-surface-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => switchTab("activos")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            tab === "activos" ? "bg-white text-brand-600 shadow-sm" : "text-surface-500 hover:text-surface-700"
          }`}
        >
          ✓ Activos
        </button>
        {canManage && (
          <button
            onClick={() => switchTab("inactivos")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              tab === "inactivos" ? "bg-white text-danger-600 shadow-sm" : "text-surface-500 hover:text-surface-700"
            }`}
          >
            🗑 Inactivos
            {inactivosData && inactivosData.total > 0 && (
              <span className="ml-1.5 bg-danger-100 text-danger-600 text-xs px-1.5 py-0.5 rounded-full font-bold">
                {inactivosData.total}
              </span>
            )}
          </button>
        )}
      </div>

      {/* ── Tab: Activos ── */}
      {tab === "activos" && (
        <>
          <FilterBarProductos
            nombre={nombreInput}
            conStock={conStock}
            categoriaId={categoriaId}
            categorias={categorias ?? []}
            onNombreChange={handleNombreChange}
            onConStockChange={handleConStockChange}
            onCategoriaChange={handleCategoriaChange}
            onReset={handleResetFilters}
            onExport={handleExport}
            isExporting={isExporting}
            canManage={canManage}
            onImport={handleImport}
            isImporting={isImporting}
            onDescargarPlantilla={handleDescargarPlantilla}
          />

          {currentLoading && (
            <div className="bg-white rounded-xl border border-surface-200 p-16 text-center">
              <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-surface-400 text-sm">Cargando productos...</p>
            </div>
          )}
          {currentError && (
            <div className="bg-danger-50 border border-danger-100 rounded-xl p-6 text-center text-danger-600">
              Error al cargar los productos
            </div>
          )}

          {productosData && (
            <div className="bg-white rounded-xl border border-surface-200 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-200">
                    <th className="text-left px-6 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">ID</th>
                    <th className="text-left px-6 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">Producto</th>
                    <th className="text-left px-6 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">Descripción</th>
                    <th className="text-right px-6 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">Precio</th>
                    <th className="text-right px-6 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">Margen</th>
                    <th className="text-center px-6 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosData.items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-surface-400">
                        <p className="text-3xl mb-2">📦</p>
                        <p className="font-medium">No hay productos que coincidan con los filtros</p>
                      </td>
                    </tr>
                  )}
                  {productosData.items.map((prod, i) => (
                    <tr
                      key={prod.id}
                      className={`border-b border-surface-100 last:border-0 ${
                        i % 2 === 0 ? "bg-white hover:bg-surface-50/50" : "bg-surface-50/30 hover:bg-surface-50"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-100 text-xs font-bold text-surface-500">
                          {prod.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/productos/${prod.id}`)}
                            className="font-semibold text-sm text-brand-600 hover:text-brand-800 transition-colors cursor-pointer hover:underline underline-offset-2"
                          >
                            {prod.nombre}
                          </button>
                          {!prod.disponible && (
                            <span
                              className="text-[10px] font-bold uppercase tracking-wide bg-surface-200 text-surface-500 px-1.5 py-0.5 rounded"
                              title="No visible en la tienda"
                            >
                              Oculto
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-surface-500 max-w-[200px]">
                        <span className="truncate block">
                          {prod.descripcion || <span className="italic text-surface-300">Sin descripción</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-success-50 text-success-700">
                          ${Number(prod.precio_base).toLocaleString("es-AR")}
                        </span>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                              (prod.stock_disponible ?? 1) > 0
                                ? "bg-surface-100 text-surface-600"
                                : "bg-danger-50 text-danger-600"
                            }`}
                            title="Stock real disponible, calculado desde el stock de los insumos"
                          >
                            Stock: {prod.stock_disponible ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs font-semibold text-surface-500">
                          {(Number(prod.margen_ganancia) * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/productos/${prod.id}`)}
                            className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all text-xs font-semibold cursor-pointer"
                          >
                            👁️ Ver
                          </button>
                          {canManage && (
                            <button
                              onClick={() => openEdit(prod)}
                              className="p-2 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 transition-all text-xs font-semibold cursor-pointer"
                            >
                              ✏️ Editar
                            </button>
                          )}
                          {canManage && (
                            <button
                              onClick={() =>
                                destacarMutation.mutate({ id: prod.id, destacado: !prod.destacado })
                              }
                              disabled={destacarMutation.isPending}
                              title={prod.destacado ? "Quitar de destacados" : "Destacar en Inicio"}
                              className={`p-2 rounded-lg transition-all text-xs font-semibold cursor-pointer disabled:opacity-50 ${
                                prod.destacado
                                  ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                  : "bg-surface-50 text-surface-400 hover:bg-yellow-50 hover:text-yellow-600"
                              }`}
                            >
                              ⭐
                            </button>
                          )}
                          {canManage && (
                            <button
                              onClick={() => handleDelete(prod.id)}
                              disabled={deleteMutation.isPending}
                              className="p-2 rounded-lg bg-danger-50 text-danger-600 hover:bg-danger-100 disabled:opacity-50 transition-all text-xs font-semibold cursor-pointer"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Paginación */}
              <div className="px-6 py-3 bg-surface-50 border-t border-surface-200 flex items-center justify-between">
                <span className="text-xs text-surface-400">
                  {productosData.total} resultado{productosData.total !== 1 && "s"} — página {productosData.page} de {productosData.pages || 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-surface-200 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    ← Anterior
                  </button>
                  {(() => {
                    const startPage = Math.max(1, Math.min(currentPage - 2, productosData.pages - 4));
                    const endPage = Math.min(productosData.pages, startPage + 4);
                    return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                      const p = startPage + i;
                      return (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`w-8 h-8 text-xs font-semibold rounded-lg transition cursor-pointer ${
                            p === currentPage
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
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage >= (productosData.pages || 1)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-surface-200 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Tab: Inactivos ── */}
      {tab === "inactivos" && (
        <>
          {isLoadingInactivos && (
            <div className="bg-white rounded-xl border border-surface-200 p-16 text-center">
              <div className="w-10 h-10 border-3 border-danger-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-surface-400 text-sm">Cargando productos inactivos...</p>
            </div>
          )}
          {isErrorInactivos && (
            <div className="bg-danger-50 border border-danger-100 rounded-xl p-6 text-center text-danger-600">
              Error al cargar los productos inactivos
            </div>
          )}

          {inactivosData && (
            <div className="bg-white rounded-xl border border-surface-200 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-200">
                    <th className="text-left px-6 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">ID</th>
                    <th className="text-left px-6 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">Nombre</th>
                    <th className="text-left px-6 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">Descripción</th>
                    <th className="text-right px-6 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">Precio</th>
                    <th className="text-right px-6 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">Margen</th>
                    <th className="text-center px-6 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {inactivosData.items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-surface-400">
                        <p className="text-3xl mb-2">✨</p>
                        <p className="font-medium">No hay productos inactivos</p>
                      </td>
                    </tr>
                  )}
                  {inactivosData.items.map((prod, i) => (
                    <tr
                      key={prod.id}
                      className={`border-b border-surface-100 last:border-0 bg-gray-50 opacity-75 ${i % 2 === 0 ? "" : "bg-gray-100/50"}`}
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-100 text-xs font-bold text-surface-400">
                          {prod.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-sm text-surface-400 line-through">
                          {prod.nombre}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-surface-400 max-w-[200px]">
                        <span className="truncate block">{prod.descripcion || "—"}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-surface-100 text-surface-400">
                          ${Number(prod.precio_base).toLocaleString("es-AR")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs font-semibold text-surface-400">
                          {(Number(prod.margen_ganancia) * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {canManage && (
                          <button
                            onClick={() => handleReactivar(prod)}
                            disabled={reactivarMutation.isPending}
                            className="p-2 rounded-lg bg-success-50 text-success-700 hover:bg-success-100 disabled:opacity-50 transition-all text-xs font-semibold cursor-pointer"
                          >
                            ♻️ Reactivar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="px-6 py-3 bg-surface-50 border-t border-surface-200 flex items-center justify-between">
                <span className="text-xs text-surface-400">
                  {inactivosData.total} resultado{inactivosData.total !== 1 && "s"} — página {inactivosData.page} de {inactivosData.pages || 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-surface-200 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    ← Anterior
                  </button>
                  {(() => {
                    const startPage = Math.max(1, Math.min(currentPage - 2, inactivosData.pages - 4));
                    const endPage = Math.min(inactivosData.pages, startPage + 4);
                    return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                      const p = startPage + i;
                      return (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`w-8 h-8 text-xs font-semibold rounded-lg transition cursor-pointer ${
                            p === currentPage
                              ? "bg-danger-500 text-white shadow-sm"
                              : "border border-surface-200 hover:bg-surface-100 text-surface-600"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    });
                  })()}
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage >= (inactivosData.pages || 1)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-surface-200 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal resultado importación */}
      <Modal
        open={importResult !== null}
        onClose={() => setImportResult(null)}
        title="Resultado de importación"
      >
        {importResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-success-50 border border-success-100 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-success-700">{importResult.creados}</p>
                <p className="text-xs text-success-600 font-semibold mt-1">Creados</p>
              </div>
              <div className="bg-warning-50 border border-warning-100 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-warning-700">{importResult.omitidos}</p>
                <p className="text-xs text-warning-600 font-semibold mt-1">Omitidos (ya existen)</p>
              </div>
              <div className="bg-danger-50 border border-danger-100 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-danger-700">{importResult.errores.length}</p>
                <p className="text-xs text-danger-600 font-semibold mt-1">Con error</p>
              </div>
            </div>

            {importResult.errores.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-surface-700 mb-2">Detalle de errores:</p>
                <div className="bg-surface-50 rounded-xl border border-surface-200 overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface-100 border-b border-surface-200">
                        <th className="text-left px-3 py-2 font-bold text-surface-500">Fila</th>
                        <th className="text-left px-3 py-2 font-bold text-surface-500">Nombre</th>
                        <th className="text-left px-3 py-2 font-bold text-surface-500">Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.errores.map((e, i) => (
                        <tr key={i} className="border-b border-surface-100 last:border-0">
                          <td className="px-3 py-2 text-surface-500">{e.fila}</td>
                          <td className="px-3 py-2 font-semibold text-surface-700">{e.nombre || "—"}</td>
                          <td className="px-3 py-2 text-danger-600">{e.motivo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {importResult.creados > 0 && importResult.errores.length === 0 && (
              <p className="text-sm text-success-600 font-semibold text-center">
                ✓ Todos los productos se importaron correctamente
              </p>
            )}

            <div className="flex justify-end pt-2 border-t border-surface-100">
              <button
                onClick={() => setImportResult(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal CRUD */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Editar Producto" : "Nuevo Producto"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-danger-50 border border-danger-100 text-danger-700 text-sm px-4 py-3 rounded-xl">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <ul className="space-y-1">
                  {error.split("\n").map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">
              Nombre <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border border-surface-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition bg-white"
              placeholder="Ej: Hamburguesa Clásica"
            />
          </div>

          {/* Imagen del producto */}
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">
              Imagen del producto
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl border border-surface-200 bg-surface-50 flex items-center justify-center overflow-hidden shrink-0">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">🍔</span>
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="block">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer transition ${isUploadingImage ? "bg-surface-100 text-surface-400 border-surface-200" : "bg-white text-brand-600 border-brand-300 hover:bg-brand-50"}`}>
                    {isUploadingImage ? "Subiendo..." : imageUrl ? "Cambiar imagen" : "Seleccionar imagen"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={isUploadingImage}
                      onChange={handleImageUpload}
                    />
                  </span>
                </label>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="text-xs text-danger-500 hover:text-danger-700 transition"
                  >
                    Quitar imagen
                  </button>
                )}
                <p className="text-xs text-surface-400">JPG, PNG o WebP. Máx. 5 MB.</p>
              </div>
            </div>
          </div>

          {/* Descripción automática */}
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">
              Descripción{" "}
              <span className="text-xs font-normal text-surface-400">(generada automáticamente)</span>
            </label>
            <div className="w-full border border-surface-200 rounded-xl px-4 py-2.5 text-sm bg-surface-50 text-surface-600 min-h-[42px] leading-relaxed">
              {selectedInsumos.filter((s) => s.ingrediente_id > 0).length === 0 ? (
                <span className="text-surface-300 italic">Se completará al agregar insumos...</span>
              ) : (
                <ul className="space-y-1">
                  {selectedInsumos
                    .filter((s) => s.ingrediente_id > 0)
                    .map((s) => {
                      const ing = ingredientes?.find((i) => i.id === s.ingrediente_id);
                      return ing ? (
                        <li key={s.ingrediente_id} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                          <span>{ing.nombre}</span>
                          {s.cantidad && (
                            <span className="text-surface-400 text-xs">
                              — {s.cantidad} {ing.unidad_medida}
                            </span>
                          )}
                        </li>
                      ) : null;
                    })}
                </ul>
              )}
            </div>
          </div>

          {/* Margen de ganancia */}
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">
              Margen de ganancia <span className="text-danger-500">*</span>
            </label>
            <div className="flex items-center gap-3 mb-2">
              <input
                type="number"
                min="0"
                max="999"
                step="1"
                value={margenGanancia}
                onChange={(e) => setMargenGanancia(e.target.value)}
                className="w-24 border border-surface-300 rounded-xl px-3 py-2 text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition bg-white"
              />
              <span className="text-sm font-bold text-brand-600 bg-brand-50 px-3 py-2 rounded-xl border border-brand-200 shrink-0">
                {Number(margenGanancia).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              step="1"
              value={Math.min(Number(margenGanancia), 200)}
              onChange={(e) => setMargenGanancia(e.target.value)}
              className="w-full accent-brand-600"
            />
            <div className="flex justify-between text-[10px] text-surface-400 mt-0.5">
              <span>0%</span>
              <span>100%</span>
              <span>200%</span>
            </div>
            <p className="text-xs text-surface-400 mt-1">
              El precio se calcula: costo total de insumos × (1 + margen)
            </p>
          </div>

          {/* Categorías */}
          {categorias && categorias.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">
                Categorías
              </label>
              <div className="flex flex-wrap gap-2">
                {categorias.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategoria(cat.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      selectedCategorias.includes(cat.id)
                        ? "bg-brand-500 text-white border-brand-500 shadow-sm"
                        : "bg-white text-surface-600 border-surface-300 hover:border-brand-400 hover:text-brand-600"
                    }`}
                  >
                    {selectedCategorias.includes(cat.id) && "✓ "}
                    {cat.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Insumos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-surface-700">
                Insumos <span className="text-danger-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setSelectorOpen(true)}
                className="text-brand-600 hover:text-brand-800 text-xs font-bold cursor-pointer flex items-center gap-1 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition"
              >
                + Agregar
              </button>
            </div>
            {selectedInsumos.length === 0 && (
              <div className="bg-surface-50 rounded-xl p-4 text-center border border-dashed border-surface-300">
                <p className="text-xs text-surface-400">Sin insumos seleccionados</p>
              </div>
            )}
            <div className="space-y-2">
              {selectedInsumos.map((item, index) => {
                const ing = ingredientes?.find((i) => i.id === item.ingrediente_id);
                const esTerminado = ing?.es_producto_terminado ?? false;

                // Insumo dado de baja: sigue en la receta pero ya no es un ingrediente
                // activo seleccionable. Lo mostramos como fila de solo lectura (sin el
                // desplegable que listaría todos los ingredientes), con opción de quitarlo.
                // Para reemplazarlo, el admin usa "+ Agregar".
                const esInactivo = !!ingredientes && !ing && item.ingrediente_id > 0;
                if (esInactivo) {
                  const detalle = editingDetail?.insumos.find(
                    (d) => d.ingrediente_id === item.ingrediente_id
                  );
                  return (
                    <div
                      key={index}
                      className="flex gap-2 items-center bg-danger-50 rounded-xl p-2 border border-danger-200"
                    >
                      <div className="flex-1 px-3 py-2 text-sm flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-surface-700">
                          {detalle?.nombre ?? `Ingrediente #${item.ingrediente_id}`}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-danger-100 text-danger-700 px-1.5 py-0.5 rounded">
                          Dado de baja
                        </span>
                      </div>
                      <span className="w-24 text-center text-sm text-surface-400" title="Cantidad en la receta">
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeInsumo(index)}
                        title="Quitar insumo dado de baja"
                        className="w-8 h-8 rounded-lg bg-danger-100 text-danger-600 hover:bg-danger-200 flex items-center justify-center transition cursor-pointer text-sm"
                      >
                        ×
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={index}
                    className="flex gap-2 items-center bg-surface-50 rounded-xl p-2 border border-surface-200"
                  >
                    <select
                      value={item.ingrediente_id}
                      onChange={(e) => updateInsumoId(index, Number(e.target.value))}
                      className="flex-1 border border-surface-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition bg-white"
                    >
                      <option value={0}>{ingredientes ? "Seleccionar insumo..." : "Cargando..."}</option>
                      {ingredientes
                        ?.filter((i) => !selectedInsumos.some((s, idx) => idx !== index && s.ingrediente_id === i.id))
                        .map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.nombre} ({i.unidad_medida}) — ${Number(i.costo_unitario).toLocaleString("es-AR")}
                            {i.es_producto_terminado ? " 📦" : ""}
                          </option>
                        ))}
                    </select>

                    {esTerminado ? (
                      <input
                        type="number"
                        value="1"
                        disabled
                        title="Producto terminado: cantidad fija en 1"
                        className="w-24 border border-surface-200 rounded-lg px-3 py-2 text-sm bg-surface-100 text-surface-400 cursor-not-allowed"
                      />
                    ) : (
                      <input
                        type="number"
                        min="0.001"
                        step="0.001"
                        placeholder="Cant."
                        value={item.cantidad}
                        onChange={(e) => updateInsumoCantidad(index, e.target.value)}
                        className="w-24 border border-surface-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition bg-white"
                      />
                    )}

                    {ing && item.cantidad && (
                      <span className="text-xs text-surface-400 shrink-0 w-20 text-right">
                        ${(Number(ing.costo_unitario) * Number(item.cantidad)).toLocaleString("es-AR")}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeInsumo(index)}
                      className="w-8 h-8 rounded-lg bg-danger-50 text-danger-500 hover:bg-danger-100 flex items-center justify-center transition cursor-pointer text-sm"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Preview precio calculado */}
            {selectedInsumos.some((s) => s.ingrediente_id > 0 && Number(s.cantidad) > 0) && ingredientes && (
              <div className="mt-3 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 text-sm">
                {(() => {
                  const costo = selectedInsumos.reduce((acc, s) => {
                    const ing = ingredientes.find((i) => i.id === s.ingrediente_id);
                    // Para insumos dados de baja (no están en la lista activa) usamos el
                    // costo del detalle cargado, para no subestimar el costo total.
                    const costoUnit = ing
                      ? Number(ing.costo_unitario)
                      : Number(
                          editingDetail?.insumos.find((d) => d.ingrediente_id === s.ingrediente_id)
                            ?.costo_unitario ?? 0
                        );
                    return acc + costoUnit * Number(s.cantidad);
                  }, 0);
                  const precio = costo * (1 + Number(margenGanancia) / 100);
                  return (
                    <div className="flex justify-between items-center">
                      <div className="text-surface-600 space-y-0.5">
                        <p>Costo total: <span className="font-semibold">${costo.toLocaleString("es-AR")}</span></p>
                        <p className="text-xs text-surface-400">Margen {Number(margenGanancia).toFixed(0)}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-surface-400">Precio estimado</p>
                        <p className="text-lg font-bold text-brand-700">${precio.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {editingId && isLoadingDetail && (
            <div className="text-center py-2 text-xs text-surface-400">Cargando datos actuales...</div>
          )}

          <InsumoSelector
            open={selectorOpen}
            onClose={() => setSelectorOpen(false)}
            selectedIds={selectedInsumos.map((s) => s.ingrediente_id)}
            onToggle={handleToggleInsumo}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
            <button
              type="button"
              onClick={closeModal}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-surface-600 hover:bg-surface-100 transition cursor-pointer border border-surface-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
            >
              {isSaving ? "Guardando..." : editingId ? "Actualizar" : "Crear Producto"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
