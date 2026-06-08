import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { productosApi, categoriasApi } from "../services/api";
import type { ProductoListItem } from "../types";
import { useCartStore } from "../features/cart/model/cartStore";
import { useAuthStore } from "../shared/store/authStore";
import { formatARS, toNumber } from "../shared/lib/format";

const PAGE_SIZE = 8;

type SortKey = "default" | "precio_asc" | "precio_desc" | "nombre";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default",     label: "Ordenar por"  },
  { value: "precio_asc",  label: "Precio ↑"     },
  { value: "precio_desc", label: "Precio ↓"     },
  { value: "nombre",      label: "Nombre A-Z"   },
];

export default function TiendaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage    = parseInt(searchParams.get("page")      ?? "1", 10);
  const nombreParam    = searchParams.get("nombre")             ?? "";
  const categoriaParam = parseInt(searchParams.get("categoria") ?? "0", 10);
  const sortParam      = (searchParams.get("sort")              ?? "default") as SortKey;

  // Si viene ?detalle=N desde InicioPage, abrir el modal directamente
  const detalleParam = parseInt(searchParams.get("detalle") ?? "0", 10) || null;

  const [nombreInput,   setNombreInput]   = useState(nombreParam);
  const [detailId,      setDetailId]      = useState<number | null>(detalleParam);
  const [toast,         setToast]         = useState<string | null>(null);
  const [toastVisible,  setToastVisible]  = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const canBuy  = useAuthStore((s) => s.hasRole(["CLIENT"]));

  // ── Categorías para los chips (solo hojas, sin padres) ────────
  const { data: categorias } = useQuery({
    queryKey: ["categorias-store"],
    queryFn:  () => categoriasApi.getAll(),
    staleTime: 1000 * 60 * 10,
  });

  const leafCategorias = useMemo(() => {
    if (!categorias) return [];
    const parentIds = new Set(
      categorias.filter((c) => c.parent_id != null).map((c) => c.parent_id as number)
    );
    return categorias.filter((c) => !parentIds.has(c.id));
  }, [categorias]);

  function showToast(nombre: string) {
    setToast(nombre);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
    setTimeout(() => setToast(null), 2600);
  }

  // ── Catálogo ───────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ["productos-tienda", currentPage, nombreParam, categoriaParam],
    queryFn: () =>
      productosApi.getAll(currentPage, PAGE_SIZE, {
        nombre:          nombreParam || undefined,
        solo_disponibles: true,
        categoria_id:    categoriaParam || undefined,
      }),
  });

  // ── Detalle ────────────────────────────────────────────────────
  const { data: detail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["productos", "tienda-detail", detailId],
    queryFn:  () => productosApi.getById(detailId!),
    enabled:  !!detailId,
  });

  // ── Ordenamiento client-side ───────────────────────────────────
  const sortedItems = useMemo(() => {
    if (!data?.items) return [];
    const items = [...data.items];
    if (sortParam === "precio_asc")  return items.sort((a, b) => toNumber(a.precio) - toNumber(b.precio));
    if (sortParam === "precio_desc") return items.sort((a, b) => toNumber(b.precio) - toNumber(a.precio));
    if (sortParam === "nombre")      return items.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    return items;
  }, [data?.items, sortParam]);

  // Debounce búsqueda
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

  // ESC cierra modal
  useEffect(() => {
    if (!detailId) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeDetail(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [detailId]);

  function closeDetail() {
    setDetailId(null);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.delete("detalle");
      return p;
    });
  }

  function setPage(p: number) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", String(p));
      return params;
    });
  }

  function setCategoria(id: number) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", "1");
      if (id) params.set("categoria", String(id));
      else params.delete("categoria");
      return params;
    });
  }

  function setSort(value: SortKey) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (value === "default") params.delete("sort");
      else params.set("sort", value);
      return params;
    });
  }

  function handleAdd(p: ProductoListItem, e: React.MouseEvent) {
    e.stopPropagation();
    addItem({ producto_id: p.id, nombre: p.nombre, precio: toNumber(p.precio), image_url: p.image_url ?? undefined });
    showToast(p.nombre);
  }

  function handleAddFromDetail() {
    if (!detail) return;
    addItem({ producto_id: detail.id, nombre: detail.nombre, precio: toNumber(detail.precio), image_url: detail.image_url ?? undefined });
    showToast(detail.nombre);
    closeDetail();
  }

  return (
    <div className="space-y-6">
      {/* ── Encabezado ────────────────────────────────────────────── */}
      <header>
        <h1 className="text-2xl font-bold text-surface-900">Tienda</h1>
        <p className="text-sm text-surface-500 mt-0.5">
          Explorá nuestra carta y agregá lo que quieras al carrito.
        </p>
      </header>

      {/* ── Filtros y búsqueda ────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          {/* Búsqueda */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearchParams((prev) => {
                const params = new URLSearchParams(prev);
                params.set("page", "1");
                if (nombreInput.trim()) params.set("nombre", nombreInput.trim());
                else params.delete("nombre");
                return params;
              });
            }}
            className="flex gap-2"
          >
            <input
              value={nombreInput}
              onChange={(e) => setNombreInput(e.target.value)}
              placeholder="Buscar producto..."
              className="px-3 py-2 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-w-[200px]"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
            >
              Buscar
            </button>
          </form>

          {/* Ordenamiento */}
          <select
            value={sortParam}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="px-3 py-2 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Chips de categoría (solo hojas) */}
        {leafCategorias.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            <button
              onClick={() => setCategoria(0)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                !categoriaParam
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-white border border-surface-300 text-surface-600 hover:border-brand-400 hover:text-brand-600"
              }`}
            >
              Todas
            </button>
            {leafCategorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoria(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                  categoriaParam === cat.id
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-white border border-surface-300 text-surface-600 hover:border-brand-400 hover:text-brand-600"
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading && <p className="text-surface-500">Cargando productos…</p>}
      {isError   && <p className="text-danger-600">Error al cargar productos.</p>}

      {data && (
        <>
          {/* Grid de productos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 content-start">
            {sortedItems.length === 0 ? (
              <p className="col-span-full text-surface-500">Sin productos disponibles.</p>
            ) : (
              sortedItems.map((p) => (
                <article
                  key={p.id}
                  onClick={() => setDetailId(p.id)}
                  className="bg-white rounded-2xl border border-surface-200 p-4 flex flex-col gap-3 hover:shadow-md hover:border-brand-300 transition-all cursor-pointer"
                >
                  <div className="aspect-[4/3] bg-white rounded-xl overflow-hidden flex items-center justify-center text-4xl">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.nombre} className="max-w-full max-h-full object-contain" />
                    ) : (
                      "🍔"
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-surface-900 line-clamp-1">{p.nombre}</h3>
                    {p.categorias.length > 0 && (
                      <p className="text-[10px] text-brand-600 font-semibold mt-0.5">
                        {p.categorias.map((c) => c.nombre).join(" · ")}
                      </p>
                    )}
                    <p className="text-xs text-surface-500 line-clamp-2 mt-0.5">
                      {p.descripcion ?? "Sin descripción"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-700">{formatARS(p.precio)}</span>
                    {canBuy && (
                      <button
                        onClick={(e) => handleAdd(p, e)}
                        className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors"
                      >
                        Agregar
                      </button>
                    )}
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

      {/* ── Toast "agregado al carrito" ──────────────────────────── */}
      <div
        className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 bg-surface-900 text-white px-4 py-3 rounded-2xl shadow-2xl transition-all duration-300 ${
          toastVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <span className="text-xl">🛒</span>
        <div>
          <p className="text-sm font-semibold leading-tight line-clamp-1 max-w-[200px]">{toast}</p>
          <p className="text-xs text-surface-400">Agregado al carrito</p>
        </div>
      </div>

      {/* ── Modal detalle de producto ─────────────────────────────── */}
      {detailId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/50 backdrop-blur-sm p-4"
          onClick={closeDetail}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-surface-200"
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
                <div className="aspect-video bg-white rounded-t-2xl overflow-hidden flex items-center justify-center relative border-b border-surface-100">
                  {detail.image_url ? (
                    <img src={detail.image_url} alt={detail.nombre} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-6xl">🍔</span>
                  )}
                  <button
                    onClick={closeDetail}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-surface-500 hover:text-surface-800 transition cursor-pointer text-xl leading-none"
                  >
                    ×
                  </button>
                </div>

                {/* Contenido */}
                <div className="p-6 space-y-5 bg-surface-50 rounded-b-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-surface-900">{detail.nombre}</h2>
                      {detail.descripcion && (
                        <p className="text-sm text-surface-500 mt-1">{detail.descripcion}</p>
                      )}
                    </div>
                    <span className="text-2xl font-bold text-brand-700 whitespace-nowrap">
                      {formatARS(detail.precio)}
                    </span>
                  </div>

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

                  {detail.insumos.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">
                        Ingredientes
                      </p>
                      <div className="bg-surface-50 rounded-xl overflow-hidden border border-surface-100">
                        {detail.insumos.map((ins, i) => (
                          <div
                            key={ins.ingrediente_id}
                            className={`flex items-center justify-between px-4 py-2.5 border-b border-surface-100 last:border-0 ${
                              i % 2 === 0 ? "bg-white" : "bg-surface-50"
                            }`}
                          >
                            <span className="text-sm text-surface-700">{ins.nombre}</span>
                            <span className="text-xs font-bold text-surface-500 bg-surface-100 px-2 py-0.5 rounded-md">
                              {ins.cantidad} {ins.unidad_medida}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {canBuy && (
                    <button
                      onClick={handleAddFromDetail}
                      className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
                    >
                      Agregar al carrito — {formatARS(detail.precio)}
                    </button>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
