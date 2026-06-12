import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Filtros, { type FiltrosParticipantes } from '../components/Filtros';
import ParticipanteCard from '../components/ParticipanteCard';
import { useParticipantes } from '../context/ParticipantesContext';
import { useAuth } from '../context/AuthContext';

const filtrosIniciales: FiltrosParticipantes = {
  nombre: '',
  modalidad: 'Todas',
  nivel: 'Todos',
};

const ITEMS_POR_PAGINA = 6;

export default function ListaPage() {
  const { participantes } = useParticipantes();
  const { user } = useAuth();
  const location = useLocation();
  const [filtros, setFiltros] = useState<FiltrosParticipantes>(filtrosIniciales);
  const [paginaActual, setPaginaActual] = useState(1);
  const [mostrarBaja, setMostrarBaja] = useState(false);

  // useRef — PARTE 1: referencia al input de búsqueda para foco directo con Ctrl+B
  const filtrosRef = useRef<HTMLInputElement>(null);

  // Si llegamos desde Ctrl+B (desde cualquier pantalla), enfocar el input de búsqueda
  useEffect(() => {
    if ((location.state as { focusFiltros?: boolean })?.focusFiltros) {
      filtrosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      filtrosRef.current?.focus();
    }
  }, [location.state]);

  const limpiarFiltros = () => {
    setFiltros(filtrosIniciales);
    setPaginaActual(1);
  };

  useEffect(() => {
    setPaginaActual(1);
  }, [filtros, mostrarBaja]);

  const participantesFiltrados = participantes.filter((p) => {
    if (!p.activo && !mostrarBaja) return false;
    const coincideNombre = p.nombre.toLowerCase().includes(filtros.nombre.toLowerCase().trim());
    const coincideModalidad = filtros.modalidad === 'Todas' || p.modalidad === filtros.modalidad;
    const coincideNivel = filtros.nivel === 'Todos' || p.nivel === filtros.nivel;
    return coincideNombre && coincideModalidad && coincideNivel;
  });

  const totalPaginas = Math.max(1, Math.ceil(participantesFiltrados.length / ITEMS_POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const participantesPaginados = participantesFiltrados.slice(
    (paginaSegura - 1) * ITEMS_POR_PAGINA,
    paginaSegura * ITEMS_POR_PAGINA,
  );

  const activos = participantes.filter((p) => p.activo).length;
  const inactivos = participantes.filter((p) => !p.activo).length;

  const exportarExcel = () => {
    const datos = participantesFiltrados.map((p) => ({
      ID: p.id,
      Nombre: p.nombre,
      Email: p.email,
      Edad: p.edad,
      País: p.pais,
      Modalidad: p.modalidad === 'Hibrido' ? 'Híbrido' : p.modalidad,
      Nivel: p.nivel,
      Tecnologías: p.tecnologias.join(', '),
      'Acepta Términos': p.aceptaTerminos ? 'Sí' : 'No',
      Estado: p.activo ? 'Activo' : 'Dado de baja',
    }));

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Participantes');
    XLSX.writeFile(wb, 'participantes.xlsx');
  };

  const mensajeVacio =
    participantes.length === 0
      ? 'No hay participantes registrados aún'
      : 'No hay participantes que coincidan con los filtros';

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 mb-2">
            Trabajo Práctico N° 8
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
            useRef · useId · Custom Hooks
          </h1>
          <p className="text-slate-600 mt-2">
            React + TypeScript + Express + PostgreSQL + JWT
          </p>
        </header>

        {/* Acciones superiores */}
        <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
          {user?.rol === 'ADMIN' && (
            <Link
              to="/nuevo"
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              + Nuevo participante
            </Link>
          )}
          <div className="flex flex-wrap gap-2 ml-auto">
            {user?.rol === 'ADMIN' && inactivos > 0 && (
              <button
                type="button"
                onClick={() => setMostrarBaja((prev) => !prev)}
                className={`px-4 py-2 rounded-lg transition font-medium text-sm ${
                  mostrarBaja
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {mostrarBaja ? `Ocultar dados de baja (${inactivos})` : `Ver dados de baja (${inactivos})`}
              </button>
            )}
            <button
              type="button"
              onClick={exportarExcel}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium text-sm"
            >
              Exportar Excel
            </button>
          </div>
        </div>

        <Filtros
          ref={filtrosRef}
          filtros={filtros}
          setFiltros={setFiltros}
          onLimpiar={limpiarFiltros}
          total={activos}
          visibles={participantesFiltrados.length}
        />

        {participantesFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-slate-500">
            {mensajeVacio}
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {participantesPaginados.map((participante) => (
                <ParticipanteCard key={participante.id} participante={participante} />
              ))}
            </section>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                  disabled={paginaSegura === 1}
                  className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ‹ Anterior
                </button>

                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => setPaginaActual(num)}
                    className={`px-3 py-2 rounded-lg border transition font-medium ${
                      num === paginaSegura
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {num}
                  </button>
                ))}

                <button
                  onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaSegura === totalPaginas}
                  className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Siguiente ›
                </button>

                <span className="text-sm text-slate-500 ml-2">
                  Página {paginaSegura} de {totalPaginas}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
