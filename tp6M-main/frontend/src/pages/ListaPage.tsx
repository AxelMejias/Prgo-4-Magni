import { useState } from 'react';
import { Link } from 'react-router-dom';
import Filtros, { type FiltrosParticipantes } from '../components/Filtros';
import ParticipanteCard from '../components/ParticipanteCard';
import { useParticipantes } from '../context/ParticipantesContext';

const filtrosIniciales: FiltrosParticipantes = {
  nombre: '',
  modalidad: 'Todas',
  nivel: 'Todos',
};

export default function ListaPage() {
  const { participantes } = useParticipantes();
  const [filtros, setFiltros] = useState<FiltrosParticipantes>(filtrosIniciales);

  const limpiarFiltros = () => setFiltros(filtrosIniciales);

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
      ? 'No hay participantes registrados aún'
      : 'No hay participantes que coincidan con los filtros';

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 mb-2">
            Trabajo Práctico N° 6
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
            Navegación con React Router + CRUD multipantalla
          </h1>
          <p className="text-slate-600 mt-2">
            useReducer + Context API + React Router + Neon PostgreSQL + Express
          </p>
        </header>

        <div className="flex justify-end mb-4">
          <Link
            to="/nuevo"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            + Nuevo participante
          </Link>
        </div>

        <Filtros
          filtros={filtros}
          setFiltros={setFiltros}
          onLimpiar={limpiarFiltros}
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
              <ParticipanteCard key={participante.id} participante={participante} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
