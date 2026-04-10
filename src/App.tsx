import { useEffect, useRef, useState } from 'react';
import Filtros, { type FiltrosParticipantes } from './components/Filtros';
import Formulario from './components/Formulario';
import ParticipanteCard from './components/ParticipanteCard';
import { Participante, type ParticipanteData } from './models/Participante';

const STORAGE_KEY = 'participantes';
const filtrosIniciales: FiltrosParticipantes = {
  nombre: '',
  modalidad: 'Todas',
  nivel: 'Todos',
};

function App() {
  const [participantes, setParticipantes] = useState<Participante[]>(() => {
    const datosGuardados = localStorage.getItem(STORAGE_KEY);

    if (!datosGuardados) {
      return [];
    }

    try {
      const participantesParseados = JSON.parse(datosGuardados) as ParticipanteData[];
      return participantesParseados.map((participante) => Participante.fromJSON(participante));
    } catch {
      return [];
    }
  });
  const [filtros, setFiltros] = useState<FiltrosParticipantes>(filtrosIniciales);
  const omitirSiguienteGuardado = useRef(false);

  useEffect(() => {
    if (omitirSiguienteGuardado.current) {
      omitirSiguienteGuardado.current = false;
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(participantes));
  }, [participantes]);

  const agregarParticipante = (data: Omit<ParticipanteData, 'id'>) => {
    const nuevoParticipante = new Participante({
      id: Date.now(),
      ...data,
    });

    setParticipantes((prev) => [...prev, nuevoParticipante]);
  };

  const eliminarParticipante = (id: number) => {
    const confirmacion = window.confirm(
      '¿Estás seguro de que querés eliminar a este participante?',
    );

    if (confirmacion) {
      setParticipantes((prev) => prev.filter((participante) => participante.id !== id));
    }
  };

  const limpiarFiltros = () => {
    setFiltros(filtrosIniciales);
  };

  const resetearDatos = () => {
    const confirmacion = window.confirm(
      'Se eliminarán todos los participantes guardados. ¿Continuar?',
    );

    if (!confirmacion) {
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
    omitirSiguienteGuardado.current = true;
    setParticipantes([]);
    setFiltros(filtrosIniciales);
  };

  const participantesFiltrados = participantes.filter((participante) => {
    const coincideNombre = participante.nombre
      .toLowerCase()
      .includes(filtros.nombre.toLowerCase().trim());
    const coincideModalidad =
      filtros.modalidad === 'Todas' || participante.modalidad === filtros.modalidad;
    const coincideNivel = filtros.nivel === 'Todos' || participante.nivel === filtros.nivel;

    return coincideNombre && coincideModalidad && coincideNivel;
  });

  const mensajeVacio =
    participantes.length === 0
      ? 'No hay participantes'
      : 'No hay participantes que coincidan con los filtros';

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 mb-2">
            Trabajo Práctico N° 3
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
            Gestión de Participantes Persistente y Modular
          </h1>
          <p className="text-slate-600 mt-2">
            useEffect + localStorage + componentización + filtros combinados
          </p>
        </header>

        <Formulario onAgregar={agregarParticipante} />

        <Filtros
          filtros={filtros}
          setFiltros={setFiltros}
          onLimpiar={limpiarFiltros}
          onResetearDatos={resetearDatos}
          total={participantes.length}
          visibles={participantesFiltrados.length}
        />

        {participantesFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-slate-500">
            {mensajeVacio}
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {participantesFiltrados.map((participante) => (
              <ParticipanteCard
                key={participante.id}
                participante={participante}
                onEliminar={eliminarParticipante}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

export default App;