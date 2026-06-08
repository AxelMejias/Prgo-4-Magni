import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productosApi } from "../services/api";
import { formatARS } from "../shared/lib/format";

const FEATURES = [
  {
    icon: "🌟",
    title: "Calidad garantizada",
    desc: "Ingredientes frescos seleccionados cada día para ofrecerte siempre lo mejor.",
  },
  {
    icon: "🚀",
    title: "Entrega rápida",
    desc: "Tu pedido se prepara al instante. Seguí cada paso desde tu cuenta.",
  },
  {
    icon: "💳",
    title: "Pagá como quieras",
    desc: "Efectivo, transferencia bancaria o MercadoPago. Vos elegís cómo abonar.",
  },
];

export default function InicioPage() {
  const navigate = useNavigate();

  // Usa el mismo prefijo "productos" para que la invalidación desde ProductosPage los limpie también
  const { data: destacadosData } = useQuery({
    queryKey: ["productos", "inicio-destacados"],
    queryFn: () => productosApi.getAll(1, 4, { solo_disponibles: true, solo_destacados: true }),
  });

  const sinDestacados = destacadosData !== undefined && destacadosData.items.length === 0;

  const { data: fallbackData } = useQuery({
    queryKey: ["productos", "inicio-fallback"],
    queryFn: () => productosApi.getAll(1, 4, { solo_disponibles: true }),
    enabled: sinDestacados,
  });

  const featuredItems = destacadosData && destacadosData.items.length > 0
    ? destacadosData.items
    : (fallbackData?.items ?? []);

  return (
    <div className="space-y-10">
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-purple-600 p-10 md:p-14 text-white">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 right-24 w-56 h-56 rounded-full bg-white/5 translate-y-1/3 pointer-events-none" />
        <div className="absolute top-1/2 right-10 text-9xl opacity-10 select-none pointer-events-none">
          🍔
        </div>

        <div className="relative z-10 max-w-xl">
          <p className="text-brand-100 text-xs font-bold uppercase tracking-[0.2em] mb-3">
            Bienvenido a
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Food Store
          </h1>
          <p className="text-brand-100 text-lg mb-8 leading-relaxed max-w-sm">
            Los mejores productos, preparados con ingredientes frescos. Pedí directo desde tu mesa.
          </p>
          <button
            onClick={() => navigate("/tienda")}
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-brand-700 font-bold rounded-2xl hover:bg-brand-50 transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            Ver la tienda <span>→</span>
          </button>
        </div>
      </section>

      {/* ── ¿Por qué elegirnos? ──────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-surface-800 mb-4">¿Por qué elegirnos?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl border border-surface-200 p-6 flex gap-4 items-start hover:shadow-sm transition-shadow"
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

      {/* ── Productos destacados ─────────────────────────────────────── */}
      {featuredItems.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-surface-800">Destacados</h2>
            <button
              onClick={() => navigate("/tienda")}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1"
            >
              Ver todos <span>→</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredItems.map((p) => (
              <article
                key={p.id}
                onClick={() => navigate(`/tienda?detalle=${p.id}`)}
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
                  <p className="text-xs text-surface-500 line-clamp-2 mt-0.5">
                    {p.descripcion ?? "Sin descripción"}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-brand-700">{formatARS(p.precio)}</span>
                  <span className="text-xs font-semibold text-brand-500">Ver detalle →</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
