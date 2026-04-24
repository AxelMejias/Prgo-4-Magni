import { Participante } from '../models/Participante';
import { useParticipantes } from '../context/ParticipantesContext';

interface ParticipanteCardProps {
  participante: Participante;
}

const colorPorNivel: Record<string, string> = {
  Principiante: 'bg-green-100 border-green-300',
  Intermedio: 'bg-yellow-100 border-yellow-300',
  Avanzado: 'bg-red-100 border-red-300',
};

function ParticipanteCard({ participante }: ParticipanteCardProps) {
  const { eliminar, seleccionarEdicion } = useParticipantes();
  const claseColor = colorPorNivel[participante.nivel] ?? 'bg-white border-slate-200';

  const handleEliminar = async () => {
    const confirmacion = window.confirm(
      '¿Estás seguro de que querés eliminar a este participante?',
    );
    if (confirmacion) {
      await eliminar(participante.id);
    }
  };

  const handleEditar = () => {
    seleccionarEdicion(participante);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <article
      className={`${claseColor} border shadow rounded-xl p-4 flex flex-col justify-between`}
    >
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-slate-800">{participante.nombre}</h3>
        <p className="text-sm text-slate-700">
          <strong>Email:</strong> {participante.email}
        </p>
        <p className="text-sm text-slate-700">
          <strong>Edad:</strong> {participante.edad}
        </p>
        <p className="text-sm text-slate-700">
          <strong>País:</strong> {participante.pais}
        </p>
        <p className="text-sm text-slate-700">
          <strong>Modalidad:</strong>{' '}
          {participante.modalidad === 'Hibrido' ? 'Híbrido' : participante.modalidad}
        </p>
        <p className="text-sm text-slate-700">
          <strong>Nivel:</strong> {participante.nivel}
        </p>
        <p className="text-sm text-slate-700">
          <strong>Tecnologías:</strong>{' '}
          {participante.tecnologias.length > 0
            ? participante.tecnologias.join(', ')
            : 'Sin tecnologías'}
        </p>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={handleEditar}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={handleEliminar}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
        >
          Eliminar
        </button>
      </div>
    </article>
  );
}

export default ParticipanteCard;
