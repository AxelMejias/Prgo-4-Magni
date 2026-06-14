import { useState, useEffect, useMemo, useRef } from "react";
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

const FEATURES = [
  { icon: "🌟", title: "Calidad garantizada", desc: "Ingredientes frescos seleccionados cada día para ofrecerte siempre lo mejor." },
  { icon: "🚀", title: "Entrega rápida",       desc: "Tu pedido se prepara al instante. Seguí cada paso desde tu cuenta." },
  { icon: "💳", title: "Pagá como quieras",    desc: "Efectivo, transferencia bancaria o MercadoPago. Vos elegís cómo abonar." },
];

function tieneStock(insumos: ProductoListItem["insumos"]): boolean {
  if (insumos.length === 0) return true;
  return insumos.every((ins) => toNumber(ins.stock_actual) >= toNumber(ins.cantidad));
}

function StockBadge({ insumos }: { insumos: ProductoListItem["insumos"] }) {
  const ok = tieneStock(insumos);
  return (
    <span
      className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full leading-tight ${
        ok
          ? "bg-success-100 text-success-700"
          : "bg-danger-100 text-danger-600"
      }`}
    >
      {ok ? "En stock" : "Sin stock"}
    </span>
  );
}

export default function StorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage    = parseInt(searchParams.get("page")      ?? "1", 10);
  const nombreParam    = searchParams.get("nombre")             ?? "";
  const categoriaParam = parseInt(searchParams.get("categoria") ?? "0", 10);
  const sortParam      = (searchParams.get("sort")              ?? "default") as SortKey;
  const detalleParam   = parseInt(searchParams.get("detalle")   ?? "0", 10) || null;

  const [nombreInput, setNombreInput] = useState(nombreParam);
  const [detailId,    setDetailId]    = useState<number | null>(detalleParam);
  const [toast,       setToast]       = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const catalogoRef = useRef<HTMLElement>(null);
  const addItem = useCartStore((s) => s.addItem);
  const canBuy  = useAuthStore((s) => s.hasRole(["CLIENT"]));

  // ── Productos destacados ───────────────────────────────────────
  const { data: destacadosData } = useQuery({
    queryKey: ["productos", "store-destacados"],
    queryFn:  () => productosApi.getAll(1, 4, { solo_disponibles: true, solo_destacados: true }),
  });

  const sinDestacados = destacadosData !== undefined && destacadosData.items.length === 0;

  const { data: fallbackData } = useQuery({
    queryKey: ["productos", "store-fallback"],
    queryFn:  () => productosApi.getAll(1, 4, { solo_disponibles: true }),
    enabled:  sinDestacados,
  });

  const featuredItems =
    destacadosData && destacadosData.items.length > 0
      ? destacadosData.items
      : (fallbackData?.items ?? []);

  // ── Categorías (solo hojas) ────────────────────────────────────
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

  // ── Catálogo ───────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ["productos-store", currentPage, nombreParam, categoriaParam],
    queryFn:  () =>
      productosApi.getAll(currentPage, PAGE_SIZE, {
        nombre:           nombreParam || undefined,
        solo_disponibles: true,
        categoria_id:     categoriaParam || undefined,
      }),
  });

  // ── Detalle ────────────────────────────────────────────────────
  const { data: detail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["productos", "store-detail", detailId],
    queryFn:  () => productosApi.getById(detailId!),
    enabled:  !!detailId,
  });

  // ── Ordenamiento client-side ───────────────────────────────────
  const sortedItems = useMemo(() => {
    if (!data?.items) return [];
    const items = [...data.items];
    if (sortParam === "precio_asc")  return items.sort((a, b) => toNumber(a.precio_base) - toNumber(b.precio_base));
    if (sortParam === "precio_desc") return items.sort((a, b) => toNumber(b.precio_base) - toNumber(a.precio_base));
    if (sortParam === "nombre")      return items.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    return items;
  }, [data?.items, sortParam]);

  function showToast(nombre: string) {
    setToast(nombre);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
    setTimeout(() => setToast(null), 2600);
  }

  // Sync nombre input con URL
  useEffect(() => {
    setNombreInput(nombreParam);
  }, [nombreParam]);

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

  function openDetail(id: number) {
    setDetailId(id);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("detalle", String(id));
      return p;
    });
  }

  function setPage(p: number) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", String(p));
      return params;
    });
    setTimeout(() => catalogoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  }

  function setCategoria(id: number) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", "1");
      if (id) params.set("categoria", String(id));
      else params.delete("categoria");
      return params;
    });
    setTimeout(() => catalogoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
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
    addItem({ producto_id: p.id, nombre: p.nombre, precio: toNumber(p.precio_base), image_url: p.image_url ?? undefined });
    showToast(p.nombre);
  }

  function handleAddFromDetail() {
    if (!detail) return;
    addItem({ producto_id: detail.id, nombre: detail.nombre, precio: toNumber(detail.precio_base), image_url: detail.image_url ?? undefined });
    showToast(detail.nombre);
    closeDetail();
  }

  const activeCategoryName = leafCategorias.find((c) => c.id === categoriaParam)?.nombre;

  return (
    <div>

      {/* ── Hero + Features + Destacados ────────────────────────── */}
      <div className="bg-white border-b border-surface-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12">

            {/* Hero banner */}
            <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-purple-600 p-10 md:p-14 text-white">
              {/* Círculos decorativos de fondo */}
              <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="absolute bottom-0 right-24 w-56 h-56 rounded-full bg-white/5 translate-y-1/3 pointer-events-none" />
              <div className="absolute top-1/4 left-1/2 w-72 h-72 rounded-full bg-white/[0.03] pointer-events-none" />

              {/* Íconos de comida genéricos — textura decorativa, no identifican un plato */}
              <div className="absolute right-14 top-8 text-7xl opacity-[0.12] select-none pointer-events-none rotate-12">🍽️</div>
              <div className="absolute right-8 bottom-10 text-4xl opacity-[0.10] select-none pointer-events-none -rotate-6">☕</div>
              <div className="absolute right-36 bottom-8 text-3xl opacity-[0.08] select-none pointer-events-none rotate-3">🥗</div>
              <div className="absolute right-28 top-10 text-2xl opacity-[0.07] select-none pointer-events-none -rotate-12">✨</div>

              <div className="relative z-10 max-w-xl">
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3.5 py-1 text-xs font-semibold mb-5 tracking-wide">
                  ⚡ Pedidos al instante
                </div>

                <p className="text-brand-100 text-xs font-bold uppercase tracking-[0.2em] mb-3">
                  Bienvenido a
                </p>
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
                  Food Store
                </h1>
                <p className="text-brand-100 text-lg mb-8 leading-relaxed max-w-sm">
                  Los mejores productos, preparados con ingredientes frescos. Pedí directo desde tu mesa.
                </p>

                <div className="flex items-center gap-4 flex-wrap">
                  <button
                    onClick={() => catalogoRef.current?.scrollIntoView({ behavior: "smooth" })}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-white text-brand-700 font-bold rounded-2xl hover:bg-brand-50 transition-all shadow-lg hover:shadow-xl active:scale-95"
                  >
                    Ver el catálogo <span>↓</span>
                  </button>
                </div>

                {/* Mini trust bar */}
                <div className="flex items-center gap-5 mt-8 pt-6 border-t border-white/20 flex-wrap">
                  <span className="flex items-center gap-1.5 text-sm text-white/75"><span>✅</span> Ingredientes frescos</span>
                  <span className="flex items-center gap-1.5 text-sm text-white/75"><span>🔒</span> Pago seguro</span>
                  <span className="flex items-center gap-1.5 text-sm text-white/75"><span>📦</span> Seguí tu pedido en vivo</span>
                </div>
              </div>
            </section>

            {/* Features */}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {FEATURES.map((f) => (
                  <div
                    key={f.title}
                    className="bg-surface-50 rounded-2xl border border-surface-200 p-6 flex gap-4 items-start"
                  >
                    <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-2xl shrink-0">
                      {f.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-surface-900 mb-1">{f.title}</h3>
                      <p className="text-sm text-surface-500 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Productos destacados */}
            {featuredItems.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-surface-800">Destacados</h2>
                  <button
                    onClick={() => catalogoRef.current?.scrollIntoView({ behavior: "smooth" })}
                    className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1"
                  >
                    Ver todos ↓
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {featuredItems.map((p) => (
                    <article
                      key={p.id}
                      onClick={() => openDetail(p.id)}
                      className="bg-white rounded-2xl border border-surface-200 p-4 flex flex-col gap-3 hover:shadow-md hover:border-brand-300 transition-all cursor-pointer"
                    >
                      <div className="aspect-[4/3] bg-white rounded-xl overflow-hidden flex items-center justify-center text-4xl relative">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.nombre} className="max-w-full max-h-full object-contain" />
                        ) : "🍽️"}
                        <StockBadge insumos={p.insumos} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-surface-900 line-clamp-1">{p.nombre}</h3>
                        <p className="text-xs text-surface-500 line-clamp-2 mt-0.5">
                          {p.descripcion ?? "Sin descripción"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-brand-700">{formatARS(p.precio_base)}</span>
                        {canBuy && (
                          <button
                            onClick={(e) => {
                              if (!tieneStock(p.insumos)) { e.stopPropagation(); return; }
                              handleAdd(p, e);
                            }}
                            disabled={!tieneStock(p.insumos)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              tieneStock(p.insumos)
                                ? "bg-brand-600 text-white hover:bg-brand-700 cursor-pointer"
                                : "bg-surface-100 text-surface-400 cursor-not-allowed"
                            }`}
                          >
                            Agregar
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
        </div>
      </div>

      {/* ── Catálogo ─────────────────────────────────────────────── */}
      <section
        ref={catalogoRef}
        id="catalogo"
        className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6"
      >

        {/* Breadcrumb (cuando hay filtro activo) */}
        {(nombreParam || categoriaParam > 0) && (
          <nav className="flex items-center gap-2 text-sm text-surface-500">
            <button
              onClick={() => setSearchParams({})}
              className="hover:text-brand-600 font-medium transition-colors"
            >
              Inicio
            </button>
            <span>›</span>
            {activeCategoryName && (
              <span className="text-surface-800 font-semibold">{activeCategoryName}</span>
            )}
            {nombreParam && (
              <span className="text-surface-800 font-semibold">
                Búsqueda: "{nombreParam}"
              </span>
            )}
          </nav>
        )}

        {/* Encabezado del catálogo */}
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-surface-900">
            {nombreParam
              ? `Resultados para "${nombreParam}"`
              : activeCategoryName ?? "Catálogo"}
          </h2>
          {data && (
            <span className="text-sm text-surface-400">
              {data.total} {data.total === 1 ? "producto" : "productos"}
            </span>
          )}
        </div>

        {/* Filtros */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3 items-center">
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
              className="flex gap-2 flex-1 min-w-[200px] max-w-sm"
            >
              <input
                value={nombreInput}
                onChange={(e) => setNombreInput(e.target.value)}
                placeholder="Buscar producto..."
                className="flex-1 px-3 py-2 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {nombreInput && (
                <button
                  type="button"
                  onClick={() => setNombreInput("")}
                  className="px-3 py-2 rounded-xl border border-surface-200 text-sm text-surface-500 hover:bg-surface-100 transition-colors"
                >
                  ✕
                </button>
              )}
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

          {/* Chips de categoría */}
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
          // min-h garantiza que la paginación no salte cuando la última página
          // tiene menos productos que PAGE_SIZE (una sola fila en vez de dos)
          <div className="min-h-[540px] flex flex-col">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sortedItems.length === 0 ? (
                <p className="col-span-full text-surface-500 py-8 text-center">
                  Sin productos disponibles.
                </p>
              ) : (
                sortedItems.map((p) => (
                  <article
                    key={p.id}
                    onClick={() => openDetail(p.id)}
                    className="bg-white rounded-2xl border border-surface-200 p-4 flex flex-col gap-3 hover:shadow-md hover:border-brand-300 transition-all cursor-pointer"
                  >
                    <div className="aspect-[4/3] bg-white rounded-xl overflow-hidden flex items-center justify-center text-4xl relative">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.nombre} className="max-w-full max-h-full object-contain" />
                      ) : "🍽️"}
                      <StockBadge insumos={p.insumos} />
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
                      <span className="font-bold text-brand-700">{formatARS(p.precio_base)}</span>
                      {canBuy && (
                        <button
                          onClick={(e) => {
                            if (!tieneStock(p.insumos)) { e.stopPropagation(); return; }
                            handleAdd(p, e);
                          }}
                          disabled={!tieneStock(p.insumos)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            tieneStock(p.insumos)
                              ? "bg-brand-600 text-white hover:bg-brand-700 cursor-pointer"
                              : "bg-surface-100 text-surface-400 cursor-not-allowed"
                          }`}
                        >
                          Agregar
                        </button>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>

            {/* Spacer empuja la paginación al fondo del contenedor min-h */}
            <div className="flex-1" />

            {data.pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
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
          </div>
        )}
      </section>

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
                <div className="aspect-video bg-white rounded-t-2xl overflow-hidden flex items-center justify-center relative border-b border-surface-100">
                  {detail.image_url ? (
                    <img src={detail.image_url} alt={detail.nombre} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-6xl">🍽️</span>
                  )}
                  <button
                    onClick={closeDetail}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-surface-500 hover:text-surface-800 transition cursor-pointer text-xl leading-none"
                  >
                    ×
                  </button>
                </div>

                <div className="p-6 space-y-5 bg-surface-50 rounded-b-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-surface-900">{detail.nombre}</h2>
                        <StockBadge insumos={detail.insumos} />
                      </div>
                      {detail.descripcion && (
                        <p className="text-sm text-surface-500">{detail.descripcion}</p>
                      )}
                    </div>
                    <span className="text-2xl font-bold text-brand-700 whitespace-nowrap">
                      {formatARS(detail.precio_base)}
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
                        {detail.insumos.map((ins, i) => {
                          const sinStock = toNumber(ins.stock_actual) < toNumber(ins.cantidad);
                          return (
                            <div
                              key={ins.ingrediente_id}
                              className={`flex items-center justify-between px-4 py-2.5 border-b border-surface-100 last:border-0 ${
                                i % 2 === 0 ? "bg-white" : "bg-surface-50"
                              }`}
                            >
                              <span className={`text-sm ${sinStock ? "text-danger-600 font-semibold" : "text-surface-700"}`}>
                                {ins.nombre}
                                {sinStock && <span className="ml-1.5 text-[10px] font-bold text-danger-500">⚠ sin stock</span>}
                              </span>
                              <span className="text-xs font-bold text-surface-500 bg-surface-100 px-2 py-0.5 rounded-md">
                                {ins.cantidad} {ins.unidad_medida}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {canBuy && (
                    <button
                      onClick={handleAddFromDetail}
                      disabled={!tieneStock(detail.insumos)}
                      className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                        tieneStock(detail.insumos)
                          ? "bg-brand-600 text-white hover:bg-brand-700 cursor-pointer"
                          : "bg-surface-100 text-surface-400 cursor-not-allowed"
                      }`}
                    >
                      {tieneStock(detail.insumos)
                        ? `Agregar al carrito — ${formatARS(detail.precio_base)}`
                        : "Sin stock disponible"}
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
