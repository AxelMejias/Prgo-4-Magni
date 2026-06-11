import { forwardRef, useId, type Dispatch, type SetStateAction } from 'react';
import { useParticipantes } from '../context/ParticipantesContext';
import { useAuth } from '../context/AuthContext';

export interface FiltrosParticipantes {
  nombre: string;
  modalidad: string;
  nivel: string;
}

interface FiltrosProps {
  filtros: FiltrosParticipantes;
  setFiltros: Dispatch<SetStateAction<FiltrosParticipantes>>;
  onLimpiar: () => void;
  total: number;
  visibles: number;
}

// forwardRef — PARTE 1: permite a ListaPage mover el foco aquí con Ctrl+B
const Filtros = forwardRef<HTMLElement, FiltrosProps>(function Filtros(
  { filtros, setFiltros, onLimpiar, total, visibles },
  ref,
) {
  const { resetear } = useParticipantes();
  const { user } = useAuth();

  // useId — PARTE 2: IDs accesibles para los campos de búsqueda
  const nombreBusquedaId = useId();
  const modalidadFiltroId = useId();
  const nivelFiltroId = useId();

  const handleResetear = async () => {
    const confirmacion = window.confirm(
      'Se eliminarán TODOS los participantes de la base de datos de forma permanente. ¿Continuar?',
    );
    if (!confirmacion) return;
    await resetear();
    onLimpiar();
  };

  return (
    // tabIndex={-1} permite recibir foco programático (Ctrl+B)
    <section ref={ref} tabIndex={-1} className="bg-white shadow rounded-xl p-5 mb-6 outline-none">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Sección de filtros</h2>
          <p className="text-sm text-slate-500">
            Mostrando {visibles} de {total} participantes activos
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onLimpiar}
            className="bg-amber-500 text-white px-3 py-2 rounded-lg hover:bg-amber-600 transition"
          >
            Limpiar filtros
          </button>
          {user?.rol === 'ADMIN' && (
            <button
              type="button"
              onClick={handleResetear}
              className="bg-slate-700 text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition"
            >
              Resetear datos
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor={nombreBusquedaId} className="text-sm text-slate-600">
            Buscar por nombre
          </label>
          <input
            id={nombreBusquedaId}
            type="text"
            placeholder="Ej: Juan"
            value={filtros.nombre}
            onChange={(e) => setFiltros((prev) => ({ ...prev, nombre: e.target.value }))}
            className="border border-slate-300 p-2 rounded-lg"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={modalidadFiltroId} className="text-sm text-slate-600">
            Modalidad
          </label>
          <select
            id={modalidadFiltroId}
            value={filtros.modalidad}
            onChange={(e) => setFiltros((prev) => ({ ...prev, modalidad: e.target.value }))}
            className="border border-slate-300 p-2 rounded-lg bg-white"
          >
            <option value="Todas">Todas las modalidades</option>
            <option value="Presencial">Presencial</option>
            <option value="Virtual">Virtual</option>
            <option value="Hibrido">Híbrido</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={nivelFiltroId} className="text-sm text-slate-600">
            Nivel
          </label>
          <select
            id={nivelFiltroId}
            value={filtros.nivel}
            onChange={(e) => setFiltros((prev) => ({ ...prev, nivel: e.target.value }))}
            className="border border-slate-300 p-2 rounded-lg bg-white"
          >
            <option value="Todos">Todos los niveles</option>
            <option value="Principiante">Principiante</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Avanzado">Avanzado</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-3">
        Tip: presioná <kbd className="bg-slate-100 border border-slate-300 px-1 rounded">Ctrl + B</kbd> desde cualquier pantalla para saltar a esta sección
      </p>
    </section>
  );
});

export default Filtros;
