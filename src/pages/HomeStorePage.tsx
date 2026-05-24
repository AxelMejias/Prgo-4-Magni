import { useState } from "react";
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
  const addItem = useCartStore((s) => s.addItem);

  // ── useQuery: catálogo público (solo disponibles) ─────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ["productos-store", currentPage, nombreParam],
    queryFn: () =>
      productosApi.getAll(currentPage, PAGE_SIZE, {
        nombre: nombreParam || undefined,
        solo_disponibles: true,
      }),
  });

  function setPage(p: number) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", String(p));
      return params;
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", "1");
      if (nombreInput) params.set("nombre", nombreInput);
      else params.delete("nombre");
      return params;
    });
  }

  function handleAdd(p: ProductoListItem) {
    addItem({
      producto_id: p.id,
      nombre: p.nombre,
      precio: toNumber(p.precio),
    });
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.items.length === 0 ? (
              <p className="col-span-full text-surface-500">
                Sin productos disponibles.
              </p>
            ) : (
              data.items.map((p) => (
                <article
                  key={p.id}
                  className="bg-white rounded-2xl border border-surface-200 p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
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
                    <span className="font-bold text-brand-700">
                      {formatARS(p.precio)}
                    </span>
                    <button
                      onClick={() => handleAdd(p)}
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
                className="px-3 py-1.5 rounded-lg border border-surface-300 text-sm disabled:opacity-50"
              >
                ←
              </button>
              <span className="text-sm text-surface-600">
                Página {data.page} de {data.pages}
              </span>
              <button
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= data.pages}
                className="px-3 py-1.5 rounded-lg border border-surface-300 text-sm disabled:opacity-50"
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}