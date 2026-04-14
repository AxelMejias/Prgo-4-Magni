import { useState } from 'react';
import Filtros, { type FiltrosParticipantes } from './components/Filtros';
import Formulario from './components/Formulario';
import ParticipanteCard from './components/ParticipanteCard';
import { useParticipantes } from './context/ParticipantesContext';

const filtrosIniciales: FiltrosParticipantes = {
  nombre: '',
  modalidad: 'Todas',
  nivel: 'Todos',
};

function Home() {
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
      ? 'No hay participantes'
      : 'No hay participantes que coincidan con los filtros';

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 mb-2">
            Trabajo Práctico N° 4
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
            Gestión de Participantes con API REST
          </h1>
          <p className="text-slate-600 mt-2">
            Context API + Neon PostgreSQL + Express
          </p>
        </header>

        <Formulario />

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

export default Home;
