import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { productosApi } from "../services/api";
import type { ProductoListItem } from "../types";
import { useCartStore } from "../features/cart/model/cartStore";
import { formatARS, toNumber } from "../shared/lib/format";

const PAGE_SIZE = 8;

export default function HomeStorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") ?? "1", 10);
  const nombreParam = searchParams.get("nombre") ?? "";

  const [nombreInput, setNombreInput] = useState(nombreParam);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  function showToast(nombre: string) {
    setToast(nombre);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
    setTimeout(() => setToast(null), 2600);
  }

  // ── Catálogo público ──────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ["productos-store", currentPage, nombreParam],
    queryFn: () =>
      productosApi.getAll(currentPage, PAGE_SIZE, {
        nombre: nombreParam || undefined,
        solo_disponibles: true,
      }),
  });

  // ── Detalle del producto seleccionado ─────────────────────────────────
  const { data: detail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["productos", "store-detail", detailId],
    queryFn: () => productosApi.getById(detailId!),
    enabled: !!detailId,
  });

  // Búsqueda en tiempo real con debounce de 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set("page", "1");
        if (nombreInput.trim()) params.set("nombre", nombreInput.trim());
        else params.delete("nombre");
        return params;
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [nombreInput]);

  useEffect(() => {
    if (!detailId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailId(null);
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [detailId]);

  function setPage(p: number) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", String(p));
      return params;
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    // El debounce ya actualizó los params; esto solo fuerza si el usuario apreta Enter antes de los 400ms
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", "1");
      if (nombreInput.trim()) params.set("nombre", nombreInput.trim());
      else params.delete("nombre");
      return params;
    });
  }

  function handleAdd(p: ProductoListItem, e: React.MouseEvent) {
    e.stopPropagation();
    addItem({
      producto_id: p.id,
      nombre: p.nombre,
      precio: toNumber(p.precio),
    });
    showToast(p.nombre);
  }

  function handleAddFromDetail() {
    if (!detail) return;
    addItem({
      producto_id: detail.id,
      nombre: detail.nombre,
      precio: toNumber(detail.precio),
    });
    showToast(detail.nombre);
    setDetailId(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Catálogo</h1>
          <p className="text-sm text-surface-500">
            Elegí tus productos y agregalos al carrito.
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={nombreInput}
            onChange={(e) => setNombreInput(e.target.value)}
            placeholder="Buscar..."
            className="px-3 py-2 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
          >
            Buscar
          </button>
        </form>
      </header>

      {isLoading && <p className="text-surface-500">Cargando catálogo…</p>}
      {isError && <p className="text-danger-600">Error al cargar productos.</p>}

      {data && (
        <>
          {/* Grid con altura mínima para que la paginación no suba cuando hay pocos productos */}
          <div className="min-h-[620px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 content-start">
            {data.items.length === 0 ? (
              <p className="col-span-full text-surface-500">
                Sin productos disponibles.
              </p>
            ) : (
              data.items.map((p) => (
                <article
                  key={p.id}
                  onClick={() => setDetailId(p.id)}
                  className="bg-white rounded-2xl border border-surface-200 p-4 flex flex-col gap-3 hover:shadow-md hover:border-brand-300 transition-all cursor-pointer"
                >
                  <div className="h-32 bg-gradient-to-br from-brand-100 to-purple-100 rounded-xl flex items-center justify-center text-4xl">
                    🍔
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-surface-900 line-clamp-1">
                      {p.nombre}
                    </h3>
                    <p className="text-xs text-surface-500 line-clamp-2 mt-0.5">
                      {p.descripcion ?? "Sin descripción"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-brand-700">
                        {formatARS(p.precio)}
                      </span>
                      <p className={`text-xs mt-0.5 font-medium ${
                        p.stock_cantidad === 0
                          ? "text-danger-500"
                          : p.stock_cantidad <= 3
                          ? "text-warning-600"
                          : "text-surface-400"
                      }`}>
                        {p.stock_cantidad === 0
                          ? "Sin stock"
                          : p.stock_cantidad <= 3
                          ? `¡Solo ${p.stock_cantidad} disponible${p.stock_cantidad > 1 ? "s" : ""}!`
                          : `${p.stock_cantidad} disponibles`}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleAdd(p, e)}
                      disabled={p.stock_cantidad <= 0}
                      className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 disabled:bg-surface-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {p.stock_cantidad > 0 ? "Agregar" : "Sin stock"}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* Paginación */}
          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  currentPage <= 1
                    ? "border-surface-200 bg-surface-100 text-surface-300 cursor-not-allowed"
                    : "border-brand-600 bg-brand-600 text-white hover:bg-brand-700 cursor-pointer"
                }`}
              >
                ←
              </button>
              <span className="px-3 text-sm font-medium text-surface-600">
                Página {data.page} de {data.pages}
              </span>
              <button
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= data.pages}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  currentPage >= data.pages
                    ? "border-surface-200 bg-surface-100 text-surface-300 cursor-not-allowed"
                    : "border-brand-600 bg-brand-600 text-white hover:bg-brand-700 cursor-pointer"
                }`}
              >
                →
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Toast "agregado al carrito" ──────────────────────────────── */}
      <div
        className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 bg-surface-900 text-white px-4 py-3 rounded-2xl shadow-2xl transition-all duration-300 ${
          toastVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <span className="text-xl">🛒</span>
        <div>
          <p className="text-sm font-semibold leading-tight line-clamp-1 max-w-[200px]">
            {toast}
          </p>
          <p className="text-xs text-surface-400">Agregado al carrito</p>
        </div>
      </div>

      {/* ── Modal detalle de producto ─────────────────────────────────── */}
      {detailId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/50 backdrop-blur-sm p-4"
          onClick={() => setDetailId(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-surface-200"
            onClick={(e) => e.stopPropagation()}
          >
            {isLoadingDetail ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-surface-400 text-sm">Cargando...</p>
              </div>
            ) : detail ? (
              <>
                {/* Hero */}
                <div className="h-40 bg-gradient-to-br from-brand-100 to-purple-100 rounded-t-2xl flex items-center justify-center text-6xl relative">
                  🍔
                  <button
                    onClick={() => setDetailId(null)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-surface-500 hover:text-surface-800 transition cursor-pointer text-xl leading-none"
                  >
                    ×
                  </button>
                </div>

                {/* Contenido */}
                <div className="p-6 space-y-5">
                  {/* Nombre y precio */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-surface-900">
                        {detail.nombre}
                      </h2>
                      {detail.descripcion && (
                        <p className="text-sm text-surface-500 mt-1">
                          {detail.descripcion}
                        </p>
                      )}
                    </div>
                    <span className="text-2xl font-bold text-brand-700 whitespace-nowrap">
                      {formatARS(detail.precio)}
                    </span>
                  </div>

                  {/* Categorías */}
                  {detail.categorias.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">
                        Categoría
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {detail.categorias.map((cat) => (
                          <span
                            key={cat.id}
                            className="bg-warning-50 text-warning-700 border border-warning-100 px-3 py-1 rounded-full text-xs font-semibold"
                          >
                            {cat.nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ingredientes */}
                  {detail.ingredientes.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">
                        Ingredientes
                      </p>
                      <div className="bg-surface-50 rounded-xl overflow-hidden border border-surface-100">
                        {detail.ingredientes.map((ing, i) => (
                          <div
                            key={ing.id}
                            className={`flex items-center justify-between px-4 py-2.5 border-b border-surface-100 last:border-0 ${
                              i % 2 === 0 ? "bg-white" : "bg-surface-50"
                            }`}
                          >
                            <span className="text-sm text-surface-700">
                              {ing.nombre}
                            </span>
                            <span className="text-xs font-bold text-surface-500 bg-surface-100 px-2 py-0.5 rounded-md">
                              {ing.cantidad} {ing.unidad_medida}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botón agregar */}
                  <button
                    onClick={handleAddFromDetail}
                    className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
                  >
                    Agregar al carrito — {formatARS(detail.precio)}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
